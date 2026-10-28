const cors = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readResponse(response) {
  const raw = await response.text();
  if (!raw) return { data: {}, raw: "" };
  try {
    return { data: JSON.parse(raw), raw };
  } catch {
    return { data: {}, raw };
  }
}

async function requestModel({ model, prompt, action, apiKey, grounding = false }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const tools = grounding ? [{ googleSearch: {} }] : [];
  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      signal: AbortSignal.timeout(30000),
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: tools.length ? tools : undefined,
        generationConfig:
          action === "mcqs"
            ? { responseMimeType: "application/json", temperature: 0.2 }
            : action === "concept"
            ? { responseMimeType: "application/json", temperature: 0.35 }
            : { temperature: 0.3 },
      }),
    });
  } catch (error) {
    const timedOut =
      error?.name === "TimeoutError" || error?.name === "AbortError";
    return {
      ok: false,
      status: 504,
      message: timedOut
        ? "Gemini request timed out after 30 seconds. Try a smaller source."
        : `Could not connect to Gemini: ${error?.message || "network error"}`,
      retryable: true,
    };
  }

  const { data, raw } = await readResponse(response);

  if (response.ok) {
    return { ok: true, data };
  }

  const message =
    data?.error?.message ||
    (raw ? raw.slice(0, 300) : `Gemini API returned HTTP ${response.status}.`);

  const retryable =
    [408, 429, 500, 502, 503, 504, 524].includes(response.status) ||
    /error code:\s*524|temporarily unavailable|high demand|overloaded/i.test(
      message
    );

  return { ok: false, status: response.status, message, retryable };
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return reply(
      {
        error:
          "GEMINI_API_KEY secret is missing from Cloudflare Pages runtime settings.",
      },
      503
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return reply({ error: "Request body must be valid JSON." }, 400);
  }

  const action = String(body.action || "");
  const text = String(body.text || "").trim();
  const topic = String(body.title || "Study topic").trim();

  if (!text) return reply({ error: "Document text is empty." }, 400);
  if (!["notes", "mcqs", "concept"].includes(action)) {
    return reply({ error: "Unsupported action." }, 400);
  }

  const maxChars =
    action === "mcqs" ? 30000 : action === "concept" ? 35000 : 40000;
  const sourceText = text.slice(0, maxChars);
  const truncatedNote =
    text.length > maxChars
      ? `\n\nNOTE: The source was shortened to the first ${maxChars} characters to reduce timeout risk. Do not claim the entire original document was reviewed.`
      : "";

  const prompt =
    action === "concept"
      ? `You are a careful exam-prep assistant for UPSC/APPSC/SSC. Create a structured concept brief for the topic: ${topic}.

Requirements:
1. Use only the provided source text. If the text is incomplete, clearly state "AI-generated summary; source verification unavailable."
2. Output valid JSON only.
3. The JSON must include these keys:
{
  "title": "string",
  "english": "string",
  "telugu": "string",
  "background": "string",
  "chronology": [{ "year": "string", "event": "string" }],
  "causes": ["string"],
  "consequences": ["string"],
  "related": ["string"],
  "prelims": "string",
  "mains": "string",
  "misconceptions": ["string"],
  "mcqs": [
    {
      "question": "string",
      "options": ["string","string","string","string"],
      "answer": 0,
      "explanation": "string"
    }
  ],
  "sources": [{ "title": "string", "url": "string", "accessed": "string" }],
  "verificationStatus": "string"
}

Rules:
- Do not invent facts, URLs, publication dates, or live verification.
- If there is insufficient evidence, set verificationStatus to "AI-generated summary; source verification unavailable."
- Use a realistic timeline only if the provided source supports it.
- Keep explanations simple and exam-friendly.
- Include a few exam-focused concepts for related connections.
- For sources, use official or well-known sources only when supported by the text. Otherwise use empty array.
- Add no markdown fences.

SOURCE TEXT:
${sourceText}${truncatedNote}`
      : action === "notes"
      ? `You are an expert APPSC Group 1 and UPSC teacher and smart-note designer. Turn the uploaded source into EXAM-ORIENTED SMART NOTES, not a paragraph summary. Audience: beginner. Use simple English and Telugu explanations.

ACCURACY RULES:
- Preserve important names, dates, places, dynasties, rulers, terms, numbers and claims from the source.
- Do not silently correct or replace source facts. Put questionable or conflicting facts in "Facts to verify".
- Separate source-derived facts from "Supplementary context". Do not invent recent events, statistics, or citations.
- This request has no live web search. Mark time-sensitive current-affairs links "Needs latest-source verification" and name an official source to check. If no clear link exists, say so.
- Avoid unrelated padding and long paragraphs.

FORMAT:
# Topic title
## 1. Topic at a glance (simple Telugu + English terms; exam relevance)
## 2. Concept explained step by step (short sections and bullets)
## 3. Mind map (topic-specific branches using ├──, └── and →)
## 4. Timeline table (Year/period | Ruler/event | What happened | Exam relevance)
## 5. Important people, places and terms table (Name | Role/meaning | Related topic | Prelims clue)
## 6. Cause → process → result
## 7. Topic connections / syllabus interlinking (mark added knowledge Supplementary context)
## 8. APPSC Group 1 / UPSC Prelims focus (high-yield facts, confusing pairs, 5 possible question angles)
## 9. Mains answer-building (5–7 points and Introduction → Body → Conclusion framework)
## 10. Current-affairs connection (do not claim latest without verification)
## 11. One-page quick revision (10–15 recall points, memory chain, 5 terms with Telugu meanings)
## 12. Practice questions (5 MCQs with options and explanations, then 2 Mains questions; answer key at end)
## 13. Facts to verify / source limits
Use readable Markdown, tables, bullets, arrows and concise bilingual explanations. Avoid long continuous paragraphs and repeated facts.

SOURCE TEXT:
${sourceText}`
      : `You are an exam MCQ writer for APPSC Group 1 and UPSC. Use ONLY the supplied source text. Generate 10 distinct MCQs with four options, answer index 0-3, English explanation, Telugu explanation, subject, topic, difficulty, source and tags. Return valid JSON in the format { "mcqs": [...], "terms": [...] }.

SOURCE TEXT:
${sourceText}`;

  const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
  ];

  let lastMessage = "";
  let lastStatus = 503;
  let successData = null;

  for (const model of models) {
    let result = await requestModel({
      model,
      prompt,
      action,
      apiKey: env.GEMINI_API_KEY,
      grounding: action === "concept",
    });

    if (result.ok) {
      successData = result.data;
      break;
    }

    lastMessage = result.message;
    lastStatus = result.status;

    if (result.retryable) {
      await sleep(800);
      result = await requestModel({
        model,
        prompt,
        action,
        apiKey: env.GEMINI_API_KEY,
        grounding: action === "concept",
      });
      if (result.ok) {
        successData = result.data;
        break;
      }
      lastMessage = result.message;
      lastStatus = result.status;
    } else {
      const modelUnavailable =
        /model.*(not found|not available|no longer available|unsupported)/i.test(
          lastMessage
        );
      if (!modelUnavailable) {
        return reply({ error: lastMessage }, 502);
      }
    }
  }

  if (!successData) {
    const isTimeout =
      lastStatus === 524 ||
      lastStatus === 504 ||
      /error code:\s*524|timed out|timeout/i.test(lastMessage);
    return reply(
      {
        error: isTimeout
          ? "Gemini request timed out (524/504). The document may be too large or the service is busy. Try again with a shorter document or select a smaller PDF section."
          : `Gemini is temporarily busy or unavailable. Automatic retry and fallback were attempted. ${
              lastMessage || "Please try again shortly."
            }`,
      },
      isTimeout ? 504 : 503
    );
  }

  const output = successData?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("\n")
    .trim();

  if (!output) {
    const blockReason = successData?.promptFeedback?.blockReason;
    return reply(
      {
        error: blockReason
          ? `Gemini could not process this request (block reason: ${blockReason}).`
          : "Gemini returned no text. Try again or use a shorter document.",
      },
      502
    );
  }

  if (action === "notes") return reply({ notes: output });

  if (action === "concept") {
    let parsed;
    try {
      const cleaned = output.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
      parsed = JSON.parse(cleaned);
    } catch {
      return reply(
        { error: "Gemini response was not valid JSON for the concept structure." },
        502
      );
    }
    return reply({
      concept: parsed,
      verificationStatus:
        parsed?.verificationStatus ||
        "AI-generated summary; source verification unavailable.",
    });
  }

  let parsed;
  try {
    const cleaned = output
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");
    parsed = JSON.parse(cleaned);
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
}
