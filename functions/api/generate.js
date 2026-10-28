const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8" };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(context, { prompt, image }) {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "GEMINI_API_KEY is missing. Add it as a Cloudflare Pages Secret and redeploy." }, 500);

  const model = "gemini-2.5-flash";
  const parts = [];
  if (prompt) parts.push({ text: prompt });
  if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: image.base64 } });
  if (!parts.length) return json({ error: "Please provide text or an image to process." }, 400);

  const requestBody = {
    contents: [{ parts }],
    generationConfig: {
      temperature: image ? 0.1 : 0.2,
      maxOutputTokens: image ? 6000 : 5000,
      ...(image ? {} : { responseMimeType: "application/json" })
    }
  };
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  let lastMessage = "Gemini request failed.";
  let lastStatus = 502;

  for (let attempt = 1; attempt <= 3; attempt++) {
    let response;
    let payload;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(requestBody)
      });
      payload = await response.json().catch(() => ({}));
    } catch {
      lastMessage = "Could not reach Gemini. Check your connection and try again.";
      lastStatus = 502;
      if (attempt < 3) { await delay(400 * attempt); continue; }
      break;
    }

    if (response.ok) {
      const result = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("\n").trim();
      if (!result) return json({ error: "Gemini returned no text. Try a smaller document or a clearer image." }, 502);
      return json({ result });
    }

    lastStatus = response.status;
    lastMessage = payload.error?.message || `Gemini API request failed (HTTP ${response.status}).`;
    const retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
    if (!retryable || attempt === 3) break;
    // Small bounded backoff: this helps transient throttling, but cannot bypass quota limits.
    await delay(500 * attempt + Math.floor(Math.random() * 250));
  }

  if (lastStatus === 429) {
    lastMessage += " Wait a little before retrying. Repeated requests cannot bypass your Gemini project quota or rate limit.";
  }
  return json({ error: lastMessage }, lastStatus || 502);
}

export async function onRequestPost(context) {
  try {
    const contentType = context.request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await context.request.formData();
      const kind = String(form.get("kind") || "");
      const file = form.get("file");
      if (!(file instanceof File)) return json({ error: "No image file was received." }, 400);
      if (!/^image\/(png|jpeg|webp|gif)$/i.test(file.type)) {
        return json({ error: "OCR currently accepts PNG, JPG/JPEG, WEBP or GIF images. For scanned PDFs, export pages as images or use a text-based PDF." }, 415);
      }
      if (file.size > 7 * 1024 * 1024) return json({ error: "Image is larger than 7 MB. Please resize it and try again." }, 413);
      const bytes = new Uint8Array(await file.arrayBuffer());
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      const base64 = btoa(binary);
      const prompt = kind === "ocr"
        ? "Read all legible text in this image faithfully. Preserve names, dates, numbers, tables, headings and paragraphs. Do not summarize or invent missing text. Return extracted text only."
        : String(form.get("prompt") || "Describe this image for exam preparation.");
      return await callGemini(context, { prompt, image: { mimeType: file.type, base64 } });
    }

    if (!contentType.includes("application/json")) return json({ error: "Request must be JSON or an image upload." }, 415);
    const body = await context.request.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    if (!prompt) return json({ error: "Please provide a prompt." }, 400);
    if (prompt.length > 32000) return json({ error: "Input is too long. Split the material into smaller sections." }, 413);
    return await callGemini(context, { prompt });
  } catch (error) {
    console.error("Generate API error", error);
    return json({ error: "The request could not be processed. Check the file/input and try again." }, 500);
  }
}
