export async function onRequestPost(context) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json; charset=utf-8"
  };

  try {
    if (!context.env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is not configured in Cloudflare." }),
        { status: 500, headers: corsHeaders }
      );
    }

    const body = await context.request.json();
    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: "Please provide a prompt." }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (prompt.length > 30000) {
      return new Response(
        JSON.stringify({ error: "Text is too long. Please send a smaller section." }),
        { status: 413, headers: corsHeaders }
      );
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": context.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an accurate UPSC and APPSC exam preparation assistant.
Use the supplied material as the primary source. Never invent facts or page numbers.
Return clear Telugu and English explanations.
If asked to create MCQs, create exactly 15 questions when the material supports them.
Each MCQ must have four options, one correct answer, a Telugu explanation, an English explanation, and a source/page reference only when supplied.
If the source does not support an answer, state that verification is required.
User request:
${prompt}`
            }]
          }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: result.error?.message || "Gemini API request failed."
        }),
        { status: response.status, headers: corsHeaders }
      );
    }

    const text = result.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "")
      .join("");

    if (!text) {
      return new Response(
        JSON.stringify({ error: "Gemini returned no text. Try a shorter prompt." }),
        { status: 502, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ result: text }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Request failed. Check the input and try again." }),
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
