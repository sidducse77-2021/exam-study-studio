export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Content-Type": "application/json; charset=utf-8"
  };

  try {
    if (!context.env.GEMINI_API_KEY) {
      return new Response(JSON.stringify({
        error: "GEMINI_API_KEY is not configured in Cloudflare Pages environment variables."
      }), {
        status: 500,
        headers: corsHeaders
      });
    }

    const contentType = context.request.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return new Response(JSON.stringify({
        error: "Request body must be JSON."
      }), {
        status: 415,
        headers: corsHeaders
      });
    }

    const body = await context.request.json().catch(() => ({}));
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const model = typeof body.model === "string" ? body.model : "gemini-2.5-flash";

    if (!prompt) {
      return new Response(JSON.stringify({
        error: "Please provide a prompt."
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (prompt.length > 32000) {
      return new Response(JSON.stringify({
        error: "Input is too long. Please send a smaller section or split the material into chunks."
      }), {
        status: 413,
        headers: corsHeaders
      });
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: `You are a careful, bilingual exam-preparation assistant. Use only the supplied material as primary evidence. Never invent facts or official sources. If a fact is not supported by the source, say so clearly. Return valid JSON only when requested.

User request:
${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 3000,
        responseMimeType: "application/json"
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const maxAttempts = 3;
    let lastStatus = 0;
    let lastPayload = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": context.env.GEMINI_API_KEY
        },
        body: JSON.stringify(requestBody)
      });

      lastStatus = response.status;
      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        const text = result.candidates?.[0]?.content?.parts
          ?.map((part) => part.text || "")
          .join("")
          .trim();

        if (!text) {
          return new Response(JSON.stringify({
            error: "Gemini returned no usable payload."
          }), {
            status: 502,
            headers: corsHeaders
          });
        }

        return new Response(JSON.stringify({ result: text }), {
          status: 200,
          headers: corsHeaders
        });
      }

      const permanentStatus = [400, 401, 403, 404].includes(response.status);
      if (permanentStatus) {
        return new Response(JSON.stringify({
          error: result.error?.message || "The request was rejected by the Gemini API. Check the model name and credentials."
        }), {
          status: response.status,
          headers: corsHeaders
        });
      }

      const transientStatus = [408, 429, 500, 502, 503, 504].includes(response.status);
      if (!transientStatus || attempt >= maxAttempts) {
        return new Response(JSON.stringify({
          error: result.error?.message || "Gemini API request failed."
        }), {
          status: response.status || 500,
          headers: corsHeaders
        });
      }

      const jitter = Math.floor(Math.random() * 300) + 200 * attempt;
      await new Promise((resolve) => setTimeout(resolve, jitter));
    }

    return new Response(JSON.stringify({
      error: lastPayload?.error?.message || "Gemini request failed after retries."
    }), {
      status: lastStatus || 500,
      headers: corsHeaders
    });

  } catch (error) {
    console.error("Generate API error", error);
    return new Response(JSON.stringify({
      error: "Request failed. Check the input and try again."
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
