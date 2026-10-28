export async function onRequestPost({ request, env }) {
  const cors = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  };
  const reply = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: cors });
  if (!env.GEMINI_API_KEY)
    return reply(
      {
        error:
          "GEMINI_API_KEY secret is missing from Cloudflare Pages runtime settings.",
      },
      503
    );
  let body;
  try {
    body = await request.json();
  } catch {
    return reply({ error: "Request body must be valid JSON." }, 400);
  }
  const action = String(body.action || "");
  const text = String(body.text || "").trim();
  if (!text) return reply({ error: "Document text is empty." }, 400);
  if (!["notes", "mcqs"].includes(action))
    return reply({ error: "Unsupported action." }, 400);
  // Keep requests within practical model limits; never silently claim the full document was processed.
  const sourceText = text.slice(0, 60000);
  const title = String(body.title || "Study document").slice(0, 200);
  const prompt =
    action === "notes"
      ? `You are an exam-preparation teacher. Use ONLY the source text below. Create useful concise bilingual English + Telugu study notes for APPSC Group 1/UPSC. Preserve names, dates, places, schemes, definitions, numbers and source terminology. Organize with headings, key facts, chronology where relevant, prelims facts, mains relevance, and quick revision points. Do not invent facts. If information is absent, omit it. Return plain Markdown, not JSON. Document: ${title}\n\nSOURCE TEXT:\n${sourceText}`
      : `You are an exam MCQ writer for APPSC Group 1 and UPSC. Use ONLY the source text below. Generate 10 distinct, source-grounded MCQs with four options each, correct answer index 0-3, English explanation, Telugu explanation, subject, topic, difficulty, and source. Also extract up to 20 important terms/entities (people, schemes, years, experiments, cities/places, rivers, institutions, political/economic/geographical/science terms, events) with brief English definition and Telugu meaning when supported. Do not invent unsupported facts. Return ONLY valid JSON with schema: {"mcqs":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"...","telugu":"...","subject":"...","topic":"...","difficulty":"Intermediate","source":"${title}","tags":[]}],"terms":[{"name":"...","category":"...","definition":"...","telugu":"...","source":"${title}"}]}. Ensure answer is an integer 0-3.\n\nSOURCE TEXT:\n${sourceText}`;
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig:
            action === "mcqs"
              ? { responseMimeType: "application/json", temperature: 0.2 }
              : { temperature: 0.3 },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok)
      return reply(
        {
          error:
            data?.error?.message ||
            `Gemini API returned ${res.status}. Check API key and Gemini API access.`,
        },
        502
      );
    const output = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text || "")
      .join("\n")
      .trim();
    if (!output)
      return reply(
        {
          error:
            "Gemini returned no text. Try again or use a shorter document.",
        },
        502
      );
    if (action === "notes") return reply({ notes: output });
    let parsed;
    try {
      parsed = JSON.parse(
        output.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
      );
    } catch {
      return reply(
        { error: "Gemini response was not valid JSON. Please try again." },
        502
      );
    }
    return reply({
      mcqs: Array.isArray(parsed.mcqs) ? parsed.mcqs : [],
      terms: Array.isArray(parsed.terms) ? parsed.terms : [],
    });
  } catch (error) {
    return reply(
      {
        error:
          "Could not connect to Gemini: " + (error?.message || "network error"),
      },
      502
    );
  }
}
