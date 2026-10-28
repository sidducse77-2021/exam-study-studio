--- a/app.js
+++ b/app.js
@@
 const starter = {
   mcqs: [
@@
   ],
   terms: [
     {
       id: "t1",
       name: "Fundamental Rights",
       category: "Polity",
       definition:
         "Basic rights guaranteed by the Constitution to citizens and persons in India.",
       telugu: "భారత రాజ్యాంగం హామీ ఇచ్చిన ప్రాథమిక హక్కులు.",
       source: "Indian Constitution",
       bookmarked: false,
+      concept: {
+        english:
+          "Fundamental Rights are the basic rights guaranteed by the Constitution to citizens and persons in India.",
+        telugu:
+          "ప్రాథమిక హక్కులు అంటే భారత రాజ్యాంగం అందించే ముఖ్యమైన హక్కులు, ఇవి వ్యక్తి గౌరవం, సమానత్వం, స్వేచ్ఛ, న్యాయం, మానవతను కాపాడుతాయి.",
+        background:
+          "These rights were incorporated to protect liberty, equality, dignity, and justice after independence.",
+        chronology: [
+          { year: "1947", event: "Independence" },
+          { year: "1948-49", event: "Constituent Assembly debates" },
+          { year: "1950", event: "Constitution came into force" },
+        ],
+        causes: [
+          "Need for constitutional safeguards against arbitrary state action.",
+          "Post-independence commitment to dignity, liberty, and equality.",
+        ],
+        consequences: [
+          "Judicial review as a constitutional check.",
+          "Rights-based litigation and governance reform.",
+        ],
+        related: [
+          "Directive Principles",
+          "Judicial Review",
+          "Right to Equality",
+          "Right to Freedom",
+        ],
+        prelims: "Fundamental Rights are guaranteed by Articles 12-35 and are central to the Indian polity.",
+        mains: "In mains, connect rights with judicial protection, balancing tests, reasonable restrictions, and social justice.",
+        misconceptions: [
+          "They are not absolute and may be limited by reasonable restriction.",
+          "They are not limited to one religion, class, or group.",
+        ],
+        mcqs: [
+          {
+            question: "Which article guarantees equality before law?",
+            options: ["Article 14", "Article 19", "Article 21", "Article 32"],
+            answer: 0,
+            explanation:
+              "Article 14 guarantees equality before the law and equal protection of the laws.",
+          },
+        ],
+        sources: [
+          {
+            title: "Constitution of India",
+            url: "https://www.india.gov.in/my-government/constitution-india",
+            accessed: "Not automatically verified",
+          },
+        ],
+        verificationStatus:
+          "AI-generated summary; source verification unavailable in this local environment.",
+      },
+      relationships: [
+        {
+          target: "Directive Principles",
+          type: "Concept and related concept",
+          explanation:
+            "Both belong to the constitutional framework and guide rights and governance.",
+        },
+      ],
     },
@@
   alerts: [],
   tasks: [],
   attempts: {},
+  news: [],
+  saved: {
+    terms: [],
+    concepts: [],
+    maps: [],
+    timelines: [],
+    mcqs: [],
+    news: [],
+  },
   settings: {
     dailyTarget: 90,
     showAnswers: false,
@@
 function fingerprint(value = "") {
   return String(value)
     .toLowerCase()
     .replace(/[^a-z0-9\u0C00-\u0C7F]+/g, " ")
     .trim();
 }
 
+function safeText(value) {
+  return value == null ? "" : String(value);
+}
+
+function buildConceptDetail(term) {
+  const concept = term?.concept || {};
+  const sourceList = Array.isArray(concept.sources) ? concept.sources : [];
+  const timeline = Array.isArray(concept.chronology) ? concept.chronology : [];
+  const causes = Array.isArray(concept.causes) ? concept.causes : [];
+  const consequences = Array.isArray(concept.consequences)
+    ? concept.consequences
+    : [];
+  const misconceptions = Array.isArray(concept.misconceptions)
+    ? concept.misconceptions
+    : [];
+  const related = Array.isArray(concept.related) ? concept.related : [];
+  const mcqs = Array.isArray(concept.mcqs) ? concept.mcqs : [];
+
+  return {
+    id: term.id || id("concept"),
+    title: term.name || "Concept",
+    english: safeText(concept.english || term.definition || ""),
+    telugu: safeText(concept.telugu || term.telugu || ""),
+    background: safeText(concept.background || ""),
+    chronology: timeline,
+    causes,
+    consequences,
+    related,
+    misconceptions,
+    mcqs,
+    sources: sourceList,
+    verificationStatus: safeText(
+      concept.verificationStatus ||
+        "AI-generated learning summary; source verification not available in this local environment."
+    ),
+    connections: Array.isArray(term.relationships) ? term.relationships : [],
+    prelims: safeText(concept.prelims || term.prelims || ""),
+    mains: safeText(concept.mains || ""),
+  };
+}
+
+function persistSavedCollections() {
+  if (!data.saved) data.saved = {};
+  data.saved.terms = Array.isArray(data.saved.terms) ? data.saved.terms : [];
+  data.saved.concepts = Array.isArray(data.saved.concepts)
+    ? data.saved.concepts
+    : [];
+  data.saved.maps = Array.isArray(data.saved.maps) ? data.saved.maps : [];
+  data.saved.timelines = Array.isArray(data.saved.timelines)
+    ? data.saved.timelines
+    : [];
+  data.saved.mcqs = Array.isArray(data.saved.mcqs) ? data.saved.mcqs : [];
+  data.saved.news = Array.isArray(data.saved.news) ? data.saved.news : [];
+}
+
+function addSavedConcept(item) {
+  persistSavedCollections();
+  const key = item && item.id ? item.id : "";
+  if (!key) return;
+  const exists = data.saved.concepts.some((entry) => entry && entry.id === key);
+  if (!exists) data.saved.concepts.unshift(item);
+  saveData();
+}
+
+function addSavedNews(item) {
+  persistSavedCollections();
+  const key = item && item.id ? item.id : "";
+  if (!key) return;
+  const exists = data.saved.news.some((entry) => entry && entry.id === key);
+  if (!exists) data.saved.news.unshift(item);
+  saveData();
+}
+
+function renderConceptModal(termId) {
+  const term = data.terms.find((entry) => entry.id === termId);
+  if (!term) return;
+
+  const concept = buildConceptDetail(term);
+  const modal = document.getElementById("conceptModal");
+  const body = document.getElementById("conceptModalBody");
+  if (!modal || !body) return;
+
+  const relatedHtml = (concept.related || []).length
+    ? concept.related
+        .map(
+          (item) =>
+            `<button class="link-button" data-open-related="${esc(String(item))}">${esc(item)}</button>`
+        )
+        .join("")
+    : "<p class='muted'>No related concepts recorded yet.</p>";
+
+  const timelineHtml = (concept.chronology || []).length
+    ? `<ul>${concept.chronology
+        .map(
+          (step) =>
+            `<li><strong>${esc(step.year || "Period")}</strong> — ${esc(step.event || "")}</li>`
+        )
+        .join("")}</ul>`
+    : "<p class='muted'>No chronology available for this topic.</p>";
+
+  const causesHtml = (concept.causes || []).length
+    ? `<ul>${concept.causes.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
+    : "<p class='muted'>No cause information available.</p>";
+
+  const consequencesHtml = (concept.consequences || []).length
+    ? `<ul>${concept.consequences
+        .map((item) => `<li>${esc(item)}</li>`)
+        .join("")}</ul>`
+    : "<p class='muted'>No consequence information available.</p>";
+
+  const misconceptionsHtml = (concept.misconceptions || []).length
+    ? `<ul>${concept.misconceptions
+        .map((item) => `<li>${esc(item)}</li>`)
+        .join("")}</ul>`
+    : "<p class='muted'>No misconceptions listed.</p>";
+
+  const sourceHtml = (concept.sources || []).length
+    ? concept.sources
+        .map((src) => {
+          const url = src && src.url ? src.url : "";
+          const title = src && src.title ? src.title : "Source";
+          const date = src && src.accessed ? src.accessed : "Access date unavailable";
+          return url
+            ? `<li><a href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a> <span class="muted">— ${esc(date)}</span></li>`
+            : `<li>${esc(title)} <span class="muted">— ${esc(date)}</span></li>`;
+        })
+        .join("")
+    : "<li>No trusted source recorded.</li>";
+
+  const mcqHtml = (concept.mcqs || []).length
+    ? concept.mcqs
+        .map((entry, index) => {
+          const options = Array.isArray(entry.options) ? entry.options : [];
+          return `
+            <div class="concept-mcq">
+              <h4>${index + 1}. ${esc(entry.question || "Question")}</h4>
+              <ol>
+                ${options.map((opt) => `<li>${esc(opt)}</li>`).join("")}
+              </ol>
+              <p><strong>Answer:</strong> ${esc(String(entry.answer + 1 || "N/A"))}</p>
+              <p>${esc(entry.explanation || "")}</p>
+            </div>
+          `;
+        })
+        .join("")
+    : "<p class='muted'>No MCQs saved for this concept yet.</p>";
+
+  body.innerHTML = `
+    <div class="concept-header">
+      <span class="pill">${esc(term.category || "General")}</span>
+      <h2>${esc(concept.title || term.name || "Concept")}</h2>
+      <div class="row">
+        <button class="secondary" data-save-term-concept="${esc(term.id)}">Save concept</button>
+      </div>
+    </div>
+
+    <div class="concept-section">
+      <h3>1. Simple English explanation</h3>
+      <p>${esc(concept.english || term.definition || "")}</p>
+    </div>
+
+    <div class="concept-section">
+      <h3>2. Detailed Telugu explanation</h3>
+      <p>${esc(concept.telugu || term.telugu || "")}</p>
+    </div>
+
+    <div class="concept-section">
+      <h3>3. Background and historical context</h3>
+      <p>${esc(concept.background || "")}</p>
+    </div>
+
+    <div class="concept-section">
+      <h3>4. Timeline and chronology</h3>
+      ${timelineHtml}
+    </div>
+
+    <div class="concept-section">
+      <h3>5. Causes and consequences</h3>
+      <div class="concept-two-col">
+        <div>
+          <h4>Causes</h4>
+          ${causesHtml}
+        </div>
+        <div>
+          <h4>Consequences</h4>
+          ${consequencesHtml}
+        </div>
+      </div>
+    </div>
+
+    <div class="concept-section">
+      <h3>6. Related people, places, schemes, institutions, and concepts</h3>
+      ${relatedHtml}
+    </div>
+
+    <div class="concept-section">
+      <h3>7. Connections with previous topics</h3>
+      <p>${esc(concept.prelims || "Not yet specified.")}</p>
+    </div>
+
+    <div class="concept-section">
+      <h3>8. Prelims facts and mains relevance</h3>
+      <p>${esc(concept.mains || concept.prelims || "Not yet specified.")}</p>
+    </div>
+
+    <div class="concept-section">
+      <h3>9. Common misconceptions</h3>
+      ${misconceptionsHtml}
+    </div>
+
+    <div class="concept-section">
+      <h3>10. Practice MCQs</h3>
+      ${mcqHtml}
+    </div>
+
+    <div class="concept-section">
+      <h3>11. Source list</h3>
+      <ul>${sourceHtml}</ul>
+    </div>
+
+    <div class="concept-section">
+      <h3>12. Verification notice</h3>
+      <p class="muted">${esc(concept.verificationStatus || "Source verification unavailable.")}</p>
+    </div>
+  `;
+
+  modal.classList.add("active");
+
+  body.querySelectorAll("[data-save-term-concept]").forEach((button) => {
+    button.addEventListener("click", () => {
+      addSavedConcept({
+        id: term.id,
+        title: term.name,
+        category: term.category,
+        summary: concept.english,
+        savedAt: new Date().toISOString(),
+      });
+      alert("Concept saved to your local study library.");
+    });
+  });
+
+  body.querySelectorAll("[data-open-related]").forEach((button) => {
+    button.addEventListener("click", () => {
+      const targetName = button.dataset.openRelated;
+      const target = data.terms.find((entry) => entry.name === targetName);
+      if (target) renderConceptModal(target.id);
+    });
+  });
+}
+
+function closeConceptModal() {
+  const modal = document.getElementById("conceptModal");
+  if (modal) modal.classList.remove("active");
+}
+
 function download(filename, content, type = "text/plain;charset=utf-8") {
   const blob = new Blob([content], { type });
   const a = document.createElement("a");
@@
 function refreshAll() {
   renderStats();
   renderDashboard();
   renderQuestions();
   renderTerms();
   renderNotes();
   renderDocuments();
+  renderDailyNews();
   renderAlerts();
   renderTasks();
   renderBackupStatus();
   renderDriveStatus();
 }
@@
 function renderTerms() {
   const termsList = document.getElementById("termList");
   const searchInput = document.getElementById("termSearch");
   const categoryFilter = document.getElementById("termCategory");
   if (!termsList) return;
 
   const query = (searchInput?.value || "").toLowerCase();
   const category = categoryFilter?.value || "";
 
   const filtered = data.terms.filter((term) => {
     const matchesCategory = !category || term.category === category;
     const searchable = [
       term.name,
       term.definition,
       term.telugu,
       term.category,
       term.source,
+      term.concept?.english || "",
+      term.concept?.telugu || "",
     ]
       .join(" ")
       .toLowerCase();
     return matchesCategory && (!query || searchable.includes(query));
   });
 
   termsList.innerHTML = filtered.length
     ? filtered
         .map(
           (term) => `
             <article class="note-card term-card">
               <div class="pill">${esc(term.category || "General")}</div>
               <h3>${esc(term.name || "Unnamed term")}</h3>
-              <p>${esc(term.definition || "")}</p>
-              <p class="muted telugu">${esc(term.telugu || "")}</p>
-              <div class="meta-row"><strong>Source:</strong> ${esc(term.source || "Not recorded")}</div>
-              <div class="row wrap">
-                <button class="secondary" data-term-bookmark="${esc(term.id)}">${term.bookmarked ? "Bookmarked" : "Bookmark"}</button>
-              </div>
+              <p>${esc(term.definition || term.concept?.english || "")}</p>
+              <div class="row">
+                <button class="secondary" data-open-term="${esc(term.id)}">Open concept</button>
+                <button class="secondary" data-term-bookmark="${esc(term.id)}">
+                  ${term.bookmarked ? "★ Saved" : "☆ Save"}
+                </button>
+              </div>
             </article>
           `
         )
         .join("")
     : '<div class="empty-state">No terms available. Add a term to begin building the explorer.</div>';
 
+  termsList.querySelectorAll("[data-open-term]").forEach((button) => {
+    button.addEventListener("click", () => renderConceptModal(button.dataset.openTerm));
+  });
+
   termsList.querySelectorAll("[data-term-bookmark]").forEach((button) => {
     button.addEventListener("click", () => {
       const target = data.terms.find((term) => term.id === button.dataset.termBookmark);
       if (!target) return;
       target.bookmarked = !target.bookmarked;
+      if (target.bookmarked) {
+        addSavedConcept({
+          id: target.id,
+          title: target.name,
+          category: target.category,
+          summary: target.definition || target.concept?.english || "",
+          savedAt: new Date().toISOString(),
+        });
+      }
       saveData();
     });
   });
 }
 
+function renderDailyNews() {
+  const list = document.getElementById("dailyNewsList");
+  if (!list) return;
+
+  const items = Array.isArray(data.news) ? data.news : [];
+  list.innerHTML = items.length
+    ? items
+        .map(
+          (item) => `
+          <article class="note-card news-card">
+            <div class="pill">${esc(item.section || "Current Affairs")}</div>
+            <h3>${esc(item.title || "Untitled article")}</h3>
+            <p class="muted">${esc(item.source || "Source unavailable")} • ${esc(item.date || "Date unavailable")}</p>
+            <p>${esc(item.summary || "")}</p>
+            ${item.url ? `<a href="${esc(item.url)}" target="_blank" rel="noopener">Read source</a>` : ""}
+            <div class="row">
+              <button class="secondary" data-save-news="${esc(item.id)}">Save article</button>
+            </div>
+          </article>
+        `
+        )
+        .join("")
+    : '<div class="empty-state">No daily news saved yet. Add reliable sources to begin building your current affairs desk.</div>';
+
+  list.querySelectorAll("[data-save-news]").forEach((button) => {
+    button.addEventListener("click", () => {
+      const item = data.news.find((entry) => entry.id === button.dataset.saveNews);
+      if (!item) return;
+      addSavedNews({
+        ...item,
+        savedAt: new Date().toISOString(),
+      });
+      alert("News article saved.");
+    });
+  });
+}
+
+function addDailyNewsArticle(article) {
+  data.news.unshift({
+    id: article.id || id("news"),
+    title: article.title || "Current affairs item",
+    source: article.source || "Source to be verified",
+    section: article.section || "National",
+    date: article.date || new Date().toISOString(),
+    url: article.url || "",
+    summary: article.summary || "",
+    createdAt: new Date().toISOString(),
+    live: Boolean(article.live),
+    examRelevance: article.examRelevance || "",
+    mcqs: Array.isArray(article.mcqs) ? article.mcqs : [],
+  });
+  saveData();
+}
+
+document.addEventListener("DOMContentLoaded", () => {
+  bindNavigation();
+  go("dashboard");
+
+  document.querySelectorAll("[data-close-concept-modal]").forEach((button) => {
+    button.addEventListener("click", closeConceptModal);
+  });
+
+  document.addEventListener("keydown", (event) => {
+    if (event.key === "Escape") closeConceptModal();
+  });
+});
+
 function renderNotes() {
   const noteList = document.getElementById("noteList");
   if (!noteList) return;
@@
   document.getElementById("saveAlert")?.addEventListener("click", () => {
     const title = document.getElementById("alertTitle").value.trim();
     if (!title) {
       alert("Enter an alert title.");
       return;
@@
     saveData();
     alert("Exam alert saved.");
   });
+
+  document.getElementById("saveNewsItem")?.addEventListener("click", () => {
+    const title = document.getElementById("newsTitle")?.value.trim();
+    if (!title) {
+      alert("Enter an article title.");
+      return;
+    }
+
+    addDailyNewsArticle({
+      id: id("news"),
+      title,
+      source:
+        document.getElementById("newsSource")?.value.trim() ||
+        "Source unlisted",
+      section: document.getElementById("newsSection")?.value || "National",
+      date: document.getElementById("newsDate")?.value || new Date().toISOString(),
+      url: document.getElementById("newsUrl")?.value.trim(),
+      summary: document.getElementById("newsSummary")?.value.trim(),
+      live: true,
+      examRelevance: "Current affairs linked to prelims and mains preparation",
+    });
+    renderDailyNews();
+    alert("Daily news article saved.");
+  });
