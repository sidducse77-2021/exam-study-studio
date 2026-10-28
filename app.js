const starter = {
  mcqs: [
    {
      id: "q1",
      exam: "UPSC",
      subject: "Polity",
      topic: "Constitution",
      question: "When did the Constitution of India come into effect?",
      options: ["15 August 1947", "26 January 1950", "26 November 1949", "2 October 1945"],
      answer: 1,
      explanation: "The Constitution of India came into effect on 26 January 1950, the date when it was formally adopted and the Republic was established.",
      telugu: "భారత రాజ్యాంగం 26 జనవరి 1950 న అమల్లోకి వచ్చింది.",
      additional: "This is the date of the Republic Day celebration.",
      source: "Indian Constitution / Constitutional terminology",
      tags: ["Constitution", "Republic Day"],
      bookmarked: false,
      difficulty: "Beginner",
      attempted: false
    },
    {
      id: "q2",
      exam: "APPSC Group 1",
      subject: "Geography",
      topic: "Rivers",
      question: "Which river is commonly called the Dakshin Ganga?",
      options: ["Godavari", "Krishna", "Kaveri", "Mahanadi"],
      answer: 0,
      explanation: "The Godavari River is often referred to as the Dakshin Ganga due to its length and cultural importance.",
      telugu: "గోదావరి నది తరచుగా దక్షిణ గంగా అని పిలువబడుతుంది.",
      additional: "Godavari is the longest peninsular river in India.",
      source: "Geography of India",
      tags: ["Geography", "Rivers"],
      bookmarked: false,
      difficulty: "Basic",
      attempted: false
    },
    {
      id: "q3",
      exam: "SSC",
      subject: "Economy",
      topic: "Inflation",
      question: "Which index is commonly used to measure retail inflation in India?",
      options: ["WPI", "CPI", "GDP deflator", "Index of Industrial Production"],
      answer: 1,
      explanation: "The Consumer Price Index (CPI) is the widely used index to track retail inflation in India.",
      telugu: "భారతదేశంలో వినియోగదారుల ధర సూచిక (CPI) వాణిజ్య ధర పెరుగుదలను అంచనా వేస్తుంది.",
      additional: "CPI captures household consumption patterns.",
      source: "Indian Economy",
      tags: ["Inflation", "Economy"],
      bookmarked: false,
      difficulty: "Basic",
      attempted: false
    }
  ],
  terms: [
    {
      id: "t1",
      name: "Fundamental Rights",
      category: "Polity",
      definition: "Basic rights guaranteed by the Constitution to citizens and persons in India.",
      telugu: "భారత రాజ్యాంగం హామీ ఇచ్చిన ప్రాథమిక హక్కులు.",
      source: "Indian Constitution",
      bookmarked: false
    },
    {
      id: "t2",
      name: "Fiscal Deficit",
      category: "Economy",
      definition: "The gap between total expenditure and total receipts excluding borrowings.",
      telugu: "రుణాలు మినహాయించి మొత్తం వ్యయం మరియు మొత్తం ఆదాయాల మధ్య గల లోపం.",
      source: "Union Budget",
      bookmarked: false
    }
  ],
  notes: [],
  documents: [],
  analyses: [],
  alerts: [],
  tasks: [],
  attempts: {},
  settings: {
    dailyTarget: 90,
    showAnswers: false,
    lang: "en",
    examCountdowns: [],
    practiceMode: "standard",
    studyStreak: 0,
    lastActivity: null,
    cloudSyncMode: "manual-backup"
  }
};

const DBKEY = "examStudyStudio_v2";
const DEFAULT_SET_SIZE = 15;
const EXAM_OPTIONS = ["UPSC", "APPSC Group 1", "APPSC Group 2", "RRB", "SSC", "CTET", "DSC", "TET"];

let data = loadData();
let selectedQuestionId = null;
let currentDeferredPrompt = null;
let isGenerating = false;

function safeClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    return value;
  }
}

function normalizeData(raw = {}) {
  const normalized = safeClone(starter);
  const source = raw && typeof raw === "object" ? raw : {};

  normalized.mcqs = Array.isArray(source.mcqs) && source.mcqs.length ? source.mcqs : normalized.mcqs;
  normalized.terms = Array.isArray(source.terms) && source.terms.length ? source.terms : normalized.terms;
  normalized.notes = Array.isArray(source.notes) ? source.notes : normalized.notes;
  normalized.documents = Array.isArray(source.documents) ? source.documents : normalized.documents;
  normalized.analyses = Array.isArray(source.analyses) ? source.analyses : normalized.analyses;
  normalized.alerts = Array.isArray(source.alerts) ? source.alerts : normalized.alerts;
  normalized.tasks = Array.isArray(source.tasks) ? source.tasks : normalized.tasks;
  normalized.attempts = source.attempts && typeof source.attempts === "object" ? source.attempts : {};
  normalized.settings = {
    ...normalized.settings,
    ...(source.settings && typeof source.settings === "object" ? source.settings : {})
  };
  if (!Array.isArray(normalized.settings.examCountdowns)) normalized.settings.examCountdowns = [];
  return normalized;
}

function loadData() {
  try {
    const saved = localStorage.getItem(DBKEY);
    if (!saved) return normalizeData(starter);
    return normalizeData(JSON.parse(saved));
  } catch (error) {
    console.warn("Could not load saved data", error);
    return normalizeData(starter);
  }
}

function saveData() {
  data = normalizeData(data);
  localStorage.setItem(DBKEY, JSON.stringify(data));
  refreshAll();
}

function id(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function esc(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function formatDate(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function fingerprint(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9\u0C00-\u0C7F]+/g, " ").trim();
}

function download(filename, content, type = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function go(view) {
  document.querySelectorAll(".view").forEach((section) => {
    section.classList.toggle("active", section.id === view);
  });
  document.querySelectorAll(".nav").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });
}

function bindNavigation() {
  document.querySelectorAll(".nav").forEach((button) => {
    button.addEventListener("click", () => go(button.dataset.view));
  });
  document.querySelectorAll("[data-goto]").forEach((button) => {
    button.addEventListener("click", () => go(button.dataset.goto));
  });
}

function refreshAll() {
  renderStats();
  renderDashboard();
  renderQuestions();
  renderTerms();
  renderNotes();
  renderDocuments();
  renderAlerts();
  renderTasks();
  renderBackupStatus();
  renderDriveStatus();
}

function renderStats() {
  const mcqsCount = document.getElementById("statMcqs");
  const notesCount = document.getElementById("statNotes");
  const termsCount = document.getElementById("statTerms");
  const docsCount = document.getElementById("statDocs");

  if (mcqsCount) mcqsCount.textContent = String(data.mcqs.length);
  if (notesCount) notesCount.textContent = String(data.notes.length);
  if (termsCount) termsCount.textContent = String(data.terms.length);
  if (docsCount) docsCount.textContent = String(data.documents.length);
}

function renderDashboard() {
  const summary = document.getElementById("dashboardSummary");
  if (!summary) return;

  const totalAttempts = Object.keys(data.attempts || {}).length;
  const correctMatches = Object.values(data.attempts || {}).filter((entry) => entry && entry.correct).length;

  const dailyTarget = Number(data.settings.dailyTarget || 90);
  const progress = Math.min(100, Math.round((correctMatches / Math.max(1, totalAttempts || 1)) * 100));

  summary.innerHTML = `
    <article class="summary-card">
      <span>Study target</span>
      <strong>${dailyTarget} mins</strong>
      <small>${progress}% progress</small>
    </article>
    <article class="summary-card">
      <span>Practice</span>
      <strong>${correctMatches}/${Math.max(1, totalAttempts)}</strong>
      <small>Correct attempts</small>
    </article>
    <article class="summary-card">
      <span>Planner</span>
      <strong>${data.tasks.filter((task) => task.done).length}/${data.tasks.length}</strong>
      <small>Tasks complete</small>
    </article>
    <article class="summary-card">
      <span>Study streak</span>
      <strong>${Number(data.settings.studyStreak || 0)}</strong>
      <small>Day streak</small>
    </article>
  `;

  const countdowns = document.getElementById("countdownCards");
  if (countdowns) {
    const cards = Array.isArray(data.settings.examCountdowns) ? data.settings.examCountdowns : [];
    if (!cards.length) {
      countdowns.innerHTML = '<div class="empty-state">No exam countdowns configured yet. Add one in the exam alerts section.</div>';
      return;
    }

    countdowns.innerHTML = cards.map((entry) => {
      const date = new Date(entry.date);
      const diffDays = Math.ceil((date.getTime() - Date.now()) / 86400000);
      return `
        <article class="countdown-card">
          <span>${esc(entry.exam || "Exam")}</span>
          <strong>${Math.max(0, diffDays)} days</strong>
          <small>${esc(entry.title || "Countdown")}</small>
        </article>
      `;
    }).join("");
  }
}

function renderQuestions() {
  const searchInput = document.getElementById("mcqSearch");
  const examFilter = document.getElementById("mcqExam");
  const setSelect = document.getElementById("setSelect");
  const batchSizeValue = document.getElementById("batchSize");
  const questionList = document.getElementById("questionList");
  const questionDetail = document.getElementById("questionDetail");
  const questionPosition = document.getElementById("questionPosition");

  if (!questionList || !questionDetail || !setSelect) return;

  const term = (searchInput?.value || "").toLowerCase().trim();
  const exam = examFilter?.value || "";
  const batchSize = Number(batchSizeValue?.value || DEFAULT_SET_SIZE);

  const filtered = data.mcqs.filter((question) => {
    const matchesExam = !exam || question.exam === exam;
    const haystack = [question.question, question.subject, question.topic, question.source, question.explanation, question.telugu, question.additional || ""].join(" ").toLowerCase();
    const matchesSearch = !term || haystack.includes(term);
    return matchesExam && matchesSearch;
  });

  const sets = makeSets(filtered, batchSize);
  const currentValue = setSelect.value;
  setSelect.innerHTML = "<option value=\"0\">All questions</option>" + sets.map((_, index) => `<option value=\"${index + 1}\">Set ${index + 1} (${(sets[index] || []).length} questions)</option>`).join("");
  if ([...setSelect.options].some((option) => option.value === currentValue)) {
    setSelect.value = currentValue;
  }

  let list = filtered;
  const selectedSet = Number(setSelect.value || 0);
  if (selectedSet > 0) {
    list = sets[selectedSet - 1] || [];
  }

  questionList.innerHTML = list.length
    ? list.map((question, index) => `
      <button class="question-item ${question.id === selectedQuestionId ? "active" : ""}" data-qid="${esc(question.id)}">
        <strong>${index + 1}. ${esc(question.question || "Untitled question")}</strong>
        <small>${esc(question.exam || "General")} • ${esc(question.subject || "General Studies")} • ${esc(question.topic || "General")}</small>
      </button>
    `).join("")
    : "<div class=\"empty-state\">No MCQs match the active filters.</div>";

  questionList.querySelectorAll("[data-qid]").forEach((button) => {
    button.addEventListener("click", () => selectQuestion(button.dataset.qid));
  });

  if (list.length === 0) {
    selectedQuestionId = null;
    questionDetail.innerHTML = "<div class=\"empty-state\">No question selected.</div>";
    if (questionPosition) questionPosition.textContent = "No question selected";
    return;
  }

  if (!selectedQuestionId || !list.some((question) => question.id === selectedQuestionId)) {
    selectedQuestionId = list[0].id;
  }

  const activeQuestion = list.find((question) => question.id === selectedQuestionId) || list[0];
  renderQuestionDetail(activeQuestion, list);
}

function makeSets(list, size) {
  const chunkSize = Math.max(1, Number(size) || DEFAULT_SET_SIZE);
  const groups = [];
  for (let index = 0; index < list.length; index += chunkSize) {
    groups.push(list.slice(index, index + chunkSize));
  }
  return groups;
}

function selectQuestion(questionId) {
  selectedQuestionId = questionId;
  renderQuestions();
}

function renderQuestionDetail(question, list) {
  const detail = document.getElementById("questionDetail");
  const questionPosition = document.getElementById("questionPosition");
  if (!detail || !questionPosition) return;

  const position = list.findIndex((item) => item.id === question.id);
  questionPosition.textContent = `Question ${position + 1} of ${list.length}`;

  if (!question.options || !question.options.length) {
    detail.innerHTML = "<div class=\"empty-state\">Question data is incomplete.</div>";
    return;
  }

  const optionsHtml = question.options.map((option, index) => {
    const isCorrect = index === Number(question.answer ?? 0);
    const correctClass = data.settings.showAnswers && isCorrect ? "correct-answer" : "";
    return `
      <label class="mcq-option ${correctClass}">
        <input type="radio" name="answer" value="${index}" ${data.settings.showAnswers && isCorrect ? "checked" : ""}>
        <span>${esc(option || `Option ${String.fromCharCode(65 + index)}`)}</span>
      </label>
    `;
  }).join("");

  detail.innerHTML = `
    <div class="pill">${esc(question.exam || "Practice")} • ${esc(question.subject || "General")} • ${esc(question.topic || "General")}</div>
    <h2>${esc(question.question || "Untitled question")}</h2>
    <div class="mcq-choices">${optionsHtml}</div>
    <div class="row wrap">
      <button id="checkAnswer" class="primary">Check answer</button>
      <button id="bookmarkQuestion" class="secondary">${question.bookmarked ? "Bookmarked" : "Bookmark"}</button>
      <button id="deleteQuestion" class="secondary danger">Delete</button>
    </div>
    ${data.settings.showAnswers ? `<div class="result-box"><strong>Correct answer:</strong> ${esc((question.options || [])[Number(question.answer || 0)] || "Not set")}</div>` : ""}
    <div class="result-box">
      <h4>Explanation</h4>
      ${question.explanation ? `<div class="explanation">${esc(question.explanation)}</div>` : "<div class=\"muted\">No explanation recorded.</div>"}
      ${question.telugu ? `<div class=\"explanation telugu\">${esc(question.telugu)}</div>` : ""}
      ${question.source ? `<div class=\"meta-row\"><strong>Source:</strong> ${esc(question.source)}</div>` : ""}
    </div>
  `;

  document.getElementById("checkAnswer")?.addEventListener("click", () => {
    const checked = document.querySelector('input[name="answer"]:checked');
    const selectedIndex = Number(checked?.value ?? -1);
    if (selectedIndex < 0) {
      alert("Please select an answer option.");
      return;
    }

    const correctIndex = Number(question.answer ?? 0);
    const isCorrect = selectedIndex === correctIndex;
    data.attempts[question.id] = {
      id: question.id,
      correct: isCorrect,
      updatedAt: new Date().toISOString()
    };

    saveData();
    alert(isCorrect ? "Correct! Good work." : `Incorrect. The correct answer is ${question.options[correctIndex] || "Option " + (correctIndex + 1)}.`);
  });

  document.getElementById("bookmarkQuestion")?.addEventListener("click", () => {
    question.bookmarked = !question.bookmarked;
    saveData();
    renderQuestions();
  });

  document.getElementById("deleteQuestion")?.addEventListener("click", () => {
    if (!confirm("Delete this question from the saved library?")) return;
    data.mcqs = data.mcqs.filter((item) => item.id !== question.id);
    selectedQuestionId = data.mcqs[0]?.id || null;
    saveData();
  });

  document.getElementById("prevQuestion").disabled = position <= 0;
  document.getElementById("nextQuestion").disabled = position >= list.length - 1;
  document.getElementById("prevQuestion").onclick = () => {
    if (position > 0) selectQuestion(list[position - 1].id);
  };
  document.getElementById("nextQuestion").onclick = () => {
    if (position < list.length - 1) selectQuestion(list[position + 1].id);
  };
}

function renderTerms() {
  const termsList = document.getElementById("termList");
  const searchInput = document.getElementById("termSearch");
  const categoryFilter = document.getElementById("termCategory");
  if (!termsList) return;

  const query = (searchInput?.value || "").toLowerCase();
  const category = categoryFilter?.value || "";

  const filtered = data.terms.filter((term) => {
    const matchesCategory = !category || term.category === category;
    const searchable = [term.name, term.definition, term.telugu, term.category, term.source].join(" ").toLowerCase();
    return matchesCategory && (!query || searchable.includes(query));
  });

  termsList.innerHTML = filtered.length
    ? filtered.map((term) => `
      <article class="note-card term-card">
        <div class="pill">${esc(term.category || "General")}</div>
        <h3>${esc(term.name || "Unnamed term")}</h3>
        <p>${esc(term.definition || "")}</p>
        <p class="muted telugu">${esc(term.telugu || "")}</p>
        <div class="meta-row"><strong>Source:</strong> ${esc(term.source || "Not recorded")}</div>
        <div class="row wrap">
          <button class="secondary" data-term-bookmark="${esc(term.id)}">${term.bookmarked ? "Bookmarked" : "Bookmark"}</button>
        </div>
      </article>
    `).join("")
    : "<div class=\"empty-state\">No terms available. Add a term to begin building the explorer.</div>";

  termsList.querySelectorAll("[data-term-bookmark]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = data.terms.find((term) => term.id === button.dataset.termBookmark);
      if (!target) return;
      target.bookmarked = !target.bookmarked;
      saveData();
    });
  });
}

function renderNotes() {
  const noteList = document.getElementById("noteList");
  if (!noteList) return;

  noteList.innerHTML = data.notes.length
    ? data.notes.map((note) => `
      <article class="note-card">
        <h3>${esc(note.title || "Untitled note")}</h3>
        <p>${esc(note.body || "")}</p>
        <small class="muted">${formatDate(note.createdAt)}</small>
      </article>
    `).join("")
    : "<div class=\"empty-state\">No notes yet. Save a note to begin building a revision library.</div>";
}

function renderDocuments() {
  const list = document.getElementById("documentList");
  if (!list) return;

  list.innerHTML = data.documents.length
    ? data.documents.map((documentItem) => `
      <article class="note-card">
        <h3>${esc(documentItem.name || "Untitled document")}</h3>
        <p class="muted">${esc(documentItem.type || "Document")} • ${documentItem.pages ? `${documentItem.pages} pages` : "No page data"} • ${formatDate(documentItem.createdAt)}</p>
        <div class="row wrap">
          <button class="secondary" data-document-preview="${esc(documentItem.id)}">Preview</button>
        </div>
      </article>
    `).join("")
    : "<div class=\"empty-state\">No documents are saved yet. Add a PDF or pasted text to start.</div>";

  list.querySelectorAll("[data-document-preview]").forEach((button) => {
    button.addEventListener("click", () => {
      const item = data.documents.find((doc) => doc.id === button.dataset.documentPreview);
      if (!item) return;
      document.getElementById("extractedText").value = item.text || "";
      document.getElementById("articleTitle").value = item.name || "";
      go("documents");
    });
  });
}
function renderAlerts() {}

document.addEventListener("DOMContentLoaded", () => {
  bindNavigation();
  go("dashboard");
});
// ===== EXAM STUDY STUDIO: FUNCTIONALITY FIX =====

function renderAlerts() {
  const el = document.getElementById("alertList");
  if (!el) return;

  el.innerHTML = data.alerts.map((a, i) => `
    <article class="panel">
      <h3>${esc(a.title)}</h3>
      <p>${esc(a.exam)} | ${esc(a.date || "No date")}</p>
      ${a.url ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">Open official link</a>` : ""}
      <button class="secondary" data-delete-alert="${i}">Delete</button>
    </article>
  `).join("") || "<p>No alerts saved.</p>";

  el.querySelectorAll("[data-delete-alert]").forEach(b => {
    b.onclick = () => {
      data.alerts.splice(Number(b.dataset.deleteAlert), 1);
      saveData();
    };
  });
}

function renderTasks() {
  const el = document.getElementById("taskList");
  if (!el) return;

  el.innerHTML = data.tasks.map((t, i) => `
    <article class="panel">
      <label>
        <input type="checkbox" data-task-done="${i}" ${t.done ? "checked" : ""}>
        ${esc(t.text)} (${esc(t.exam || "")})
      </label>
      <button class="secondary" data-task-delete="${i}">Delete</button>
    </article>
  `).join("") || "<p>No study tasks yet.</p>";

  el.querySelectorAll("[data-task-done]").forEach(b => {
    b.onchange = () => {
      data.tasks[Number(b.dataset.taskDone)].done = b.checked;
      saveData();
    };
  });

  el.querySelectorAll("[data-task-delete]").forEach(b => {
    b.onclick = () => {
      data.tasks.splice(Number(b.dataset.taskDelete), 1);
      saveData();
    };
  });
}

function renderBackupStatus() {}
function renderDriveStatus() {}

function setPdfStatus(message) {
  const el = document.getElementById("pdfStatus");
  if (el) el.textContent = message;
}

document.addEventListener("DOMContentLoaded", () => {
  // Navigation and initial rendering
  bindNavigation();
  refreshAll();

  // PDF, TXT, Markdown and DOCX extraction
  const upload = document.getElementById("pdfUpload");

  if (upload) {
    upload.addEventListener("change", async () => {
      const file = upload.files && upload.files[0];
      if (!file) return;

      const output = document.getElementById("extractedText");
      if (!output) return;

      output.value = "";
      setPdfStatus("Reading " + file.name + "...");

      try {
        const name = file.name.toLowerCase();

        if (name.endsWith(".txt") || name.endsWith(".md")) {
          output.value = await file.text();
        } else if (name.endsWith(".pdf")) {
          if (!window.pdfjsLib) {
            throw new Error("PDF.js did not load. Check your internet connection and refresh.");
          }

          pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

          const buffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({
            data: new Uint8Array(buffer)
          }).promise;

          const pages = [];

          for (let p = 1; p <= pdf.numPages; p++) {
            setPdfStatus(`Extracting PDF text: page ${p} of ${pdf.numPages}`);
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();
            pages.push(
              content.items.map(item => item.str || "").join(" ")
            );
          }

          output.value = pages.join("\n\n");

          if (!output.value.trim()) {
            setPdfStatus("No selectable text found. This may be a scanned PDF; OCR is required.");
            return;
          }
        } else if (name.endsWith(".docx")) {
          if (!window.mammoth) {
            throw new Error("DOCX reader did not load. Refresh and try again.");
          }

          const result = await mammoth.extractRawText({
            arrayBuffer: await file.arrayBuffer()
          });

          output.value = result.value;
        } else {
          throw new Error("This file type is not supported for text extraction.");
        }

        setPdfStatus(
          `Extraction complete. ${output.value.length} characters extracted.`
        );
      } catch (error) {
        console.error("Document extraction failed:", error);
        setPdfStatus("Extraction failed: " + error.message);
      }
    });
  }

  // Save extracted text
  document.getElementById("saveDocument")?.addEventListener("click", () => {
    const text = document.getElementById("extractedText")?.value.trim();
    const file = document.getElementById("pdfUpload")?.files?.[0];

    if (!text) {
      alert("Please upload a readable document or paste text first.");
      return;
    }

    data.documents.unshift({
      id: id("doc"),
      name: file?.name || document.getElementById("articleTitle")?.value || "Pasted document",
      type: file?.name.split(".").pop() || "text",
      text,
      createdAt: new Date().toISOString()
    });

    saveData();
    setPdfStatus("Document saved successfully.");
  });

  // Create notes from extracted text
  document.getElementById("makeNotes")?.addEventListener("click", () => {
    const text = document.getElementById("extractedText")?.value.trim();
    if (!text) {
      alert("Upload a document or paste text first.");
      return;
    }

    data.notes.unshift({
      id: id("note"),
      title: document.getElementById("articleTitle")?.value ||
        document.getElementById("pdfUpload")?.files?.[0]?.name ||
        "Document notes",
      body: text,
      createdAt: new Date().toISOString()
    });

    saveData();
    alert("Notes saved. Open Study Notes to review them.");
  });

  // Download extracted text
  document.getElementById("downloadText")?.addEventListener("click", () => {
    const text = document.getElementById("extractedText")?.value || "";
    if (!text.trim()) {
      alert("There is no text to download.");
      return;
    }
    download("extracted-document.txt", text);
  });

  // Add study note
  document.getElementById("saveNote")?.addEventListener("click", () => {
    const title = document.getElementById("noteTitle")?.value.trim();
    const body = document.getElementById("noteBody")?.value.trim();

    if (!body) {
      alert("Enter your notes first.");
      return;
    }

    data.notes.unshift({
      id: id("note"),
      title: title || "Study note",
      body,
      createdAt: new Date().toISOString()
    });

    saveData();
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteBody").value = "";
    alert("Note saved.");
  });

  document.getElementById("clearNote")?.addEventListener("click", () => {
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteBody").value = "";
  });

  // Save a manually written news analysis
  document.getElementById("saveAnalysis")?.addEventListener("click", () => {
    const title = document.getElementById("articleTitle")?.value.trim();

    const analysis = {
      id: id("analysis"),
      title: title || "News analysis",
      english: document.getElementById("analysisEnglish")?.value || "",
      telugu: document.getElementById("analysisTelugu")?.value || "",
      prelims: document.getElementById("analysisPrelims")?.value || "",
      mains: document.getElementById("analysisMains")?.value || "",
      createdAt: new Date().toISOString()
    };

    if (![analysis.english, analysis.telugu, analysis.prelims, analysis.mains].some(v => v.trim())) {
      alert("Enter at least one analysis field first.");
      return;
    }

    data.analyses.unshift(analysis);
    data.notes.unshift({
      id: id("note"),
      title: analysis.title,
      body: [
        analysis.english,
        analysis.telugu,
        analysis.prelims,
        analysis.mains
      ].filter(Boolean).join("\n\n"),
      createdAt: new Date().toISOString()
    });

    saveData();
    alert("News analysis saved.");
  });

  // Add MCQ
  document.getElementById("showAddMcq")?.addEventListener("click", () => {
    document.getElementById("addMcqPanel")?.classList.toggle("hidden");
  });

  document.getElementById("saveMcq")?.addEventListener("click", () => {
    const question = document.getElementById("newQuestion").value.trim();
    const options = ["optA", "optB", "optC", "optD"].map(
      key => document.getElementById(key).value.trim()
    );

    if (!question || options.some(v => !v)) {
      alert("Enter the question and all four options.");
      return;
    }

    data.mcqs.push({
      id: id("q"),
      exam: document.getElementById("newExam").value,
      subject: document.getElementById("newSubject").value.trim() || "General Studies",
      topic: document.getElementById("newTopic").value.trim() || "General",
      question,
      options,
      answer: Number(document.getElementById("newAnswer").value),
      explanation: document.getElementById("newExplanation").value.trim(),
      telugu: document.getElementById("newTelugu").value.trim(),
      additional: document.getElementById("newAdditional").value.trim(),
      source: document.getElementById("newSource").value.trim(),
      bookmarked: false
    });

    saveData();
    alert("Question saved successfully.");
  });

  // Search and filter MCQs
  ["mcqSearch", "mcqExam", "batchSize", "setSelect", "termSearch", "termCategory"]
    .forEach(key => {
      document.getElementById(key)?.addEventListener("input", () => {
        if (key.startsWith("mcq") || key === "batchSize" || key === "setSelect") {
          renderQuestions();
        } else {
          renderTerms();
        }
      });

      document.getElementById(key)?.addEventListener("change", () => {
        if (key.startsWith("mcq") || key === "batchSize" || key === "setSelect") {
          renderQuestions();
        } else {
          renderTerms();
        }
      });
    });

  // Add a term
  document.getElementById("showAddTerm")?.addEventListener("click", () => {
    document.getElementById("addTermPanel")?.classList.toggle("hidden");
  });

  document.getElementById("saveTerm")?.addEventListener("click", () => {
    const name = document.getElementById("termName").value.trim();
    if (!name) {
      alert("Enter a term name.");
      return;
    }

    data.terms.push({
      id: id("term"),
      name,
      category: document.getElementById("termNewCategory").value,
      definition: document.getElementById("termDefinition").value.trim(),
      telugu: document.getElementById("termTelugu").value.trim(),
      prelims: document.getElementById("termPrelims").value.trim(),
      source: document.getElementById("termSource").value.trim(),
      bookmarked: false
    });

    saveData();
    alert("Term saved.");
  });

  // Add planner task
  document.getElementById("saveTask")?.addEventListener("click", () => {
    const text = document.getElementById("taskText").value.trim();
    if (!text) {
      alert("Enter a study task.");
      return;
    }

    data.tasks.push({
      id: id("task"),
      text,
      exam: document.getElementById("taskExam").value,
      done: false
    });

    saveData();
    document.getElementById("taskText").value = "";
  });

  // Add exam alert
  document.getElementById("saveAlert")?.addEventListener("click", () => {
    const title = document.getElementById("alertTitle").value.trim();
    if (!title) {
      alert("Enter an alert title.");
      return;
    }

    data.alerts.push({
      id: id("alert"),
      exam: document.getElementById("alertExam").value,
      title,
      date: document.getElementById("alertDate").value,
      url: document.getElementById("alertUrl").value.trim()
    });

    saveData();
    alert("Exam alert saved.");
  });

  // Export/import backup
  document.getElementById("exportBackup")?.addEventListener("click", () => {
    download(
      "exam-study-studio-backup.json",
      JSON.stringify(data, null, 2),
      "application/json"
    );
  });

  document.getElementById("importBackup")?.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imported = JSON.parse(await file.text());
      if (!imported || !Array.isArray(imported.mcqs) || !Array.isArray(imported.terms)) {
        throw new Error("This does not look like a valid study backup.");
      }

      if (!confirm("Import backup? This replaces the current saved study data.")) return;

      data = normalizeData(imported);
      saveData();
      alert("Backup imported successfully.");
    } catch (error) {
      alert("Import failed: " + error.message);
    }
  });

  // Search saved learning material
  document.getElementById("teachBtn")?.addEventListener("click", () => {
    const topic = document.getElementById("teacherTopic").value.trim().toLowerCase();
    const result = document.getElementById("teacherResult");

    if (!topic) {
      result.textContent = "Enter a topic to search.";
      return;
    }

    const matches = [
      ...data.mcqs.filter(q => JSON.stringify(q).toLowerCase().includes(topic))
        .map(q => `MCQ: ${q.question}\n${q.explanation || ""}`),
      ...data.terms.filter(t => JSON.stringify(t).toLowerCase().includes(topic))
        .map(t => `Term: ${t.name}\n${t.definition || ""}\n${t.telugu || ""}`),
      ...data.notes.filter(n => JSON.stringify(n).toLowerCase().includes(topic))
        .map(n => `Note: ${n.title}\n${n.body}`)
    ];

    result.textContent = matches.join("\n\n") || "No saved learning material matched this topic.";
  });

  // Shuffle question order
  document.getElementById("shuffleBtn")?.addEventListener("click", () => {
    for (let i = data.mcqs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [data.mcqs[i], data.mcqs[j]] = [data.mcqs[j], data.mcqs[i]];
    }
    selectedQuestionId = null;
    saveData();
  });

  // Export questions
  document.getElementById("exportMcqJson")?.addEventListener("click", () => {
    download("mcqs.json", JSON.stringify(data.mcqs, null, 2), "application/json");
  });

  document.getElementById("exportMcqCsv")?.addEventListener("click", () => {
    const quote = value => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = [
      ["Exam", "Subject", "Topic", "Question", "Option A", "Option B", "Option C", "Option D", "Answer", "Explanation"],
      ...data.mcqs.map(q => [
        q.exam, q.subject, q.topic, q.question,
        ...(q.options || []), q.options?.[q.answer] || "", q.explanation
      ])
    ];
    download("mcqs.csv", rows.map(row => row.map(quote).join(",")).join("\r\n"));
  });

  document.getElementById("printMcqs")?.addEventListener("click", () => window.print());

  refreshAll();
  console.log("Exam Study Studio: functionality handlers initialized.");
});
