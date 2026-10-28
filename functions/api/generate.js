const cors = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Retry only temporary failures. A second model is attempted if the primary
// model is busy/unavailable; the API key remains server-side in Cloudflare.
async function callGemini({ model, prompt, action, apiKey }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const maxAttempts = 3;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig:
            action === "mcqs"
              ? { responseMimeType: "application/json", temperature: 0.2 }
              : { temperature: 0.3 },
        }),
      });
    } catch (error) {
      if (attempt < maxAttempts - 1) {
        await sleep(700 * (attempt + 1));
        continue;
      }
      return {
        ok: false,
        status: 502,
        message: `Could not connect to Gemini: ${
          error?.message || "network error"
        }`,
      };
    }

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = {};
    }

    if (response.ok) {
      return { ok: true, data };
    }

    const message =
      data?.error?.message || `Gemini API returned HTTP ${response.status}.`;

    // 429/500/502/503/504 are potentially temporary. Retry with backoff.
    const retryable = [429, 500, 502, 503, 504].includes(response.status);
    if (retryable && attempt < maxAttempts - 1) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const waitMs =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(retryAfter * 1000, 8000)
          : Math.min(1000 * 2 ** attempt, 4000);
      await sleep(waitMs);
      continue;
    }

    return { ok: false, status: response.status, message };
  }

  return {
    ok: false,
    status: 503,
    message: "Gemini is temporarily unavailable. Please try again.",
  };
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

  if (!text) return reply({ error: "Document text is empty." }, 400);
  if (!["notes", "mcqs"].includes(action)) {
    return reply({ error: "Unsupported action." }, 400);
  }

  // Avoid sending an unbounded document in a single API request.
  const sourceText = text.slice(0, 60000);
  const title = String(body.title || "Study document").slice(0, 200);

  const prompt =
    action === "notes"
      ? `You are an expert APPSC Group 1 and UPSC teacher and smart-note designer. Turn the uploaded source into EXAM-ORIENTED SMART NOTES, not a paragraph summary. Audience: beginner. Use simple natural Telugu with standard English exam terms. Return organised Markdown.

ACCURACY RULES:
- Preserve important names, dates, places, dynasties, rulers, terms, numbers and claims from the source.
- Do not silently correct or replace source facts. Put questionable or conflicting facts in "Facts to verify".
- Separate source-derived facts from "Supplementary context". Never pretend added context came from the uploaded PDF.
- Do not invent recent events, statistics, or citations. This request has no live web search. Any time-sensitive current-affairs link must be marked "Needs latest-source verification" and name a suitable official source to check. If no clear link exists, say so.
- Avoid unrelated padding and long paragraphs. Explain difficult terms simply.

USE THIS EXACT NOTE STRUCTURE:
# [Topic title]
## 1. Topic at a glance
Give a beginner-friendly 3–6 line overview in Telugu + English keywords and explain relevance to APPSC Group 1 / UPSC.

## 2. Concept explained step by step
Short sections, bullets, simple definitions, and clear cause/effect. Keep paragraphs under 4 lines.

## 3. Mind map
Create a topic-specific text mind map using branches and arrows:
TOPIC
├── Factor / person → development
├── Factor / person → development
└── outcome → historical significance
Use source-specific facts, not generic filler.

## 4. Timeline / chronology
Table columns: Year/period | Ruler/dynasty/event | What happened | Exam relevance. Use only dates supported by the source; label approximate or conflicting dates.

## 5. Important people, places and terms
Table columns: Name/term | Role or meaning | Related topic | Prelims clue.

## 6. Cause → process → result
Explain why the development happened, how it progressed, and what changed. Use arrows or a table.

## 7. Topic connections / interlinking
Connect to relevant syllabus themes only where useful. For ancient history, consider geography, economy, polity, society, religion/philosophy, archaeology, art/culture and other Mahajanapadas as appropriate. Show links as Topic A → reason/connection → Topic B → exam use. Mark added background as "Supplementary context".

## 8. APPSC Group 1 / UPSC Prelims focus
High-yield facts, commonly confused facts in a comparison table, and 5 possible question angles (never claim guaranteed questions).

## 9. Mains answer-building
Give analytical dimensions, 5–7 usable points, and one framework: Introduction → Body headings → Conclusion. Do not invent data or quotations.

## 10. Current-affairs connection
Only include a genuinely relevant connection. Do not claim it is the latest without live verification. Mark time-sensitive context "Needs latest-source verification" and name an official source to check. If none is evident, say: "No direct current-affairs link established from the supplied material; verify current updates separately."

## 11. One-page quick revision
10–15 one-line recall points, one compact memory chain, and 5 English keywords with simple Telugu meanings.

## 12. Practice questions
5 source-grounded MCQs with four options, answers and short explanations; then 2 short-answer/Mains questions. Put the answer key after the questions.

## 13. Source limits / facts to verify
List unclear, missing, approximate or internally inconsistent details. If none are apparent, say this is not an independent fact-check.

STYLE:
- Make the output look like well-designed study notes, not a formal article or continuous essay.
- Prefer tables, bullets, bold keywords, arrows, mini flowcharts and short bilingual explanations.
- Keep Telugu easy to understand and retain standard English terminology in brackets.
- Avoid repeating the same fact in every section.
- Return plain Markdown, not JSON and not code fences.
- Document title: ${title}

UPLOADED SOURCE TEXT:
${sourceText}`
      : `You are an exam MCQ writer for APPSC Group 1 and UPSC. Use ONLY the source text below. Generate 10 distinct, source-grounded MCQs with four options each, correct answer index 0-3, English explanation, Telugu explanation, subject, topic, difficulty, and source. Also extract up to 20 important terms/entities (people, schemes, years, experiments, cities/places, rivers, institutions, political/economic/geographical/science terms, events) with brief English definition and Telugu meaning when supported. Do not invent unsupported facts. Return ONLY valid JSON with schema: {"mcqs":[{"question":"...","options":["...","...","...","..."],"answer":0,"explanation":"...","telugu":"...","subject":"...","topic":"...","difficulty":"Intermediate","source":"${title}","tags":[]}],"terms":[{"name":"...","category":"...","definition":"...","telugu":"...","source":"${title}"}]}. Ensure answer is an integer 0-3.\n\nSOURCE TEXT:\n${sourceText}`;
  // Try the preferred model first, then a fallback model if it remains busy or
  // unavailable. The fallback is also retried for temporary server failures.
  const models = ["gemini-3.8-flash", "gemini-2.5-flash"];
  let result;
  let lastMessage = "";

  for (const model of models) {
    result = await callGemini({
      model,
      prompt,
      action,
      apiKey: env.GEMINI_API_KEY,
    });

    if (result.ok) break;
    lastMessage = result.message;

    // Only switch models for temporary/server-side availability errors or
    // model-not-found/retired errors. Don't hide auth, permission, or bad input.
    const temporary = [429, 500, 502, 503, 504].includes(result.status);
    const modelUnavailable =
      /model.*(not found|not available|no longer available|unsupported)/i.test(
        lastMessage
      );
    if (!temporary && !modelUnavailable) {
      return reply({ error: lastMessage }, result.status === 400 ? 400 : 502);
    }
  }

  if (!result?.ok) {
    return reply(
      {
        error: `Gemini is temporarily busy or unavailable. Automatic retries and fallback were attempted. ${
          lastMessage || "Please try again shortly."
        }`,
      },
      503
    );
  }

  const data = result.data;
  const output = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("\n")
    .trim();

  if (!output) {
    const blockReason = data?.promptFeedback?.blockReason;
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
