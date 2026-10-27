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

function renderAlerts() {
  const list = document.getElementById("alertList");
  if (!list) return;

  list.innerHTML = data.alerts.length
    ? data.alerts.map((alert) => `
      <article class="alert-card">
        <div class="pill">${esc(alert.exam || "Exam")}</div>
        <h3>${esc(alert.title || "Untitled alert")}</h3>
        <p>${alert.date ? `Date: ${formatDate(alert.date)}` : "No date recorded"}</p>
        <p>${alert.url ? `<a href="${esc(alert.url)}" target="_blank" rel="noopener">Official notification</a>` : "No official link"}</p>
      </article>
    `).join("")
    : "<div class=\"empty-state\">No official exam alerts recorded yet.</div>";
}

function renderTasks() {
  const taskList = document.getElementById("taskList");
  if (!taskList) return;

  taskList.innerHTML = data.tasks.length
    ? data.tasks.map((task) => `
      <article class="task-card">
        <label class="task-check">
          <input type="checkbox" data-taskdone="${esc(task.id)}" ${task.done ? "checked" : ""}>
          <span>${esc(task.task || "Untitled task")}</span>
        </label>
        <small>${esc(task.exam || "General")}</small>
      </article>
    `).join("")
    : "<div class=\"empty-state\">No study tasks planned yet.</div>";

  taskList.querySelectorAll("[data-taskdone]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const item = data.tasks.find((task) => task.id === checkbox.dataset.taskdone);
      if (!item) return;
      item.done = checkbox.checked;
      saveData();
    });
  });
}

function renderBackupStatus() {
  const status = document.getElementById("backupStatus");
  if (status) {
    status.textContent = "Local backup available. Keep a JSON export before making major changes.";
  }
}

function renderDriveStatus() {
  const driveStatus = document.getElementById("driveStatus");
  if (!driveStatus) return;

  const configured = !!(window.__GOOGLE_DRIVE_CONFIGURED__ || false);
  if (configured) {
    driveStatus.textContent = "Google Drive integration is ready for use with the configured OAuth credentials.";
    driveStatus.classList.add("success");
    driveStatus.classList.remove("warning");
  } else {
    driveStatus.textContent = "Drive sync is not active. Google OAuth and redirect configuration are still required.";
    driveStatus.classList.add("warning");
    driveStatus.classList.remove("success");
  }
}

async function handleDocumentUpload(files) {
  const fileList = Array.from(files || []);
  if (!fileList.length) return;

  for (const file of fileList) {
    const name = file.name || "document";
    const status = document.getElementById("pdfStatus");
    try {
      let text = "";
      if (name.toLowerCase().endsWith(".pdf")) {
        text = await extractPdf(file, status);
      } else if (name.toLowerCase().endsWith(".docx")) {
        text = await extractDocx(file, status);
      } else if (name.toLowerCase().endsWith(".txt") || name.toLowerCase().endsWith(".md")) {
        text = await file.text();
      } else if (file.type.startsWith("image/")) {
        text = await extractImageWithGemini(file, status);
      } else {
        text = await file.text();
      }

      data.documents.unshift({
        id: id("doc"),
        name,
        type: file.type || "application/octet-stream",
        text,
        createdAt: new Date().toISOString(),
        pages: estimatePageCount(text)
      });

      document.getElementById("extractedText").value = text;
      saveData();
      if (status) {
        status.textContent = `Loaded ${name}. Review the text before generating questions or notes.`;
      }
    } catch (error) {
      console.error(error);
      if (status) {
        status.textContent = `Unable to read ${name}: ${error.message || "Unknown error. Please paste the text manually."}`;
      }
    }
  }
}

function estimatePageCount(text) {
  return Math.max(1, Math.ceil((text || "").split(/\n\s*\n/).length / 8));
}

async function extractPdf(file, status) {
  if (!window.pdfjsLib) {
    if (status) status.textContent = "PDF.js did not load. Connect to the internet or paste the text manually.";
    return "";
  }

  const pdfjs = window.pdfjsLib;
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    if (status) status.textContent = `Extracting page ${pageNumber} of ${pdf.numPages}...`;
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    pageTexts.push((content.items || []).map((item) => item.str || "").join(" ").trim());
  }

  const extracted = pageTexts.filter(Boolean).join("\n\n");
  if (!extracted.trim() && status) {
    status.textContent = "No selectable text was found. This may be a scanned or image-only PDF. OCR or hand-paste is required.";
  }
  return extracted;
}

async function extractDocx(file, status) {
  if (!window.mammoth) {
    if (status) status.textContent = "DOCX extraction library is not available. Paste the text manually or add the required browser library.";
    return "";
  }

  const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value || "";
}

async function extractImageWithGemini(file, status) {
  try {
    if (status) {
      status.textContent = `Preparing image OCR for ${file.name || "image"} using the configured backend...`;
    }

    const payload = await callGeminiAIForImage(file);
    if (payload && typeof payload === "string" && payload.trim()) {
      return payload.trim();
    }

    if (status) {
      status.textContent = "Image conversion succeeded, but no readable text was returned. Paste the text manually or ensure the backend OCR workflow is configured.";
    }
    return "";
  } catch (error) {
    console.error("Image OCR failed", error);
    if (status) {
      status.textContent = `Image OCR failed: ${error.message || "Unknown image processing error"}`;
    }
    return "";
  }
}

async function makeAiQuestionsFromText() {
  const text = document.getElementById("extractedText").value.trim();
  const batchSizeInput = document.getElementById("batchSize");
  const batchSize = Number(batchSizeInput?.value || DEFAULT_SET_SIZE);

  if (!text) {
    alert("Please upload or paste text first before generating MCQs.");
    return;
  }

  if (isGenerating) {
    alert("A generation request is already running. Please wait for it to finish.");
    return;
  }

  isGenerating = true;
  const button = document.getElementById("makeMcqs");
  const originalButtonText = button ? button.textContent : "Generate";

  if (button) {
    button.disabled = true;
    button.textContent = "Generating...";
  }

  try {
    const prompt = `
You are a careful, bilingual exam-preparation assistant for UPSC, APPSC, SSC, RRB, CTET, DSC, and related competitive exams.

Use only the supplied material as primary evidence. Never invent facts, official sources, or government schemes. If a fact is not directly supported by the source text, say so clearly.

Create exactly ${Math.max(1, Math.min(15, batchSize || 15))} high-quality MCQs when the source supports them.

Requirements:
- English question + Telugu translation
- Four options only
- Zero-based answer index
- English explanation + Telugu explanation
- exam, subject, topic, difficulty, source reference
- additional prelims/mains relevance
- no fabricated official PYQs or unverifiable claims

Return valid JSON only in this format:
{
  "mcqs": [
    {
      "subject": "",
      "topic": "",
      "exam": "",
      "difficulty": "",
      "question_en": "",
      "question_te": "",
      "options_en": ["", "", "", ""],
      "options_te": ["", "", "", ""],
      "answer": 0,
      "explanation_en": "",
      "explanation_te": "",
      "additional_info": "",
      "source_reference": "",
      "source_page": ""
    }
  ],
  "terms": [
    {
      "name": "",
      "category": "",
      "definition_en": "",
      "definition_te": "",
      "source_reference": ""
    }
  ]
}

SOURCE MATERIAL:
${text.slice(0, 22000)}
`;

    const result = await callGeminiAI(prompt);

    let payload;
    try {
      payload = JSON.parse(result);
    } catch (error) {
      console.error(error);
      alert("AI returned an unexpected format. Please try again with a shorter excerpt.");
      return;
    }

    const questions = Array.isArray(payload.mcqs) ? payload.mcqs : [];
    if (!questions.length) {
      alert("No MCQs were returned from the source text. Try another section or a shorter excerpt.");
      return;
    }

    const uniqueQuestions = [];
    const seen = new Set(data.mcqs.map((question) => fingerprint(question.question)));

    for (const q of questions) {
      const questionText = q.question_en || q.question_te || "";
      if (!questionText) continue;

      const normalized = fingerprint(questionText);
      if (seen.has(normalized)) continue;
      seen.add(normalized);

      uniqueQuestions.push({
        id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        exam: q.exam || "UPSC",
        subject: q.subject || "General Studies",
        topic: q.topic || "Document study",
        question: q.question_en || q.question_te || "Question",
        question_te: q.question_te || "",
        options: Array.isArray(q.options_en) && q.options_en.length === 4 ? q.options_en : ["Option A", "Option B", "Option C", "Option D"],
        options_te: Array.isArray(q.options_te) && q.options_te.length === 4 ? q.options_te : ["వైదా A", "వైదా B", "వైదా C", "వైదా D"],
        answer: Number.isInteger(q.answer) ? q.answer : 0,
        explanation: q.explanation_en || "",
        telugu: q.explanation_te || "",
        additional: q.additional_info || "",
        source: q.source_reference || "Uploaded document",
        tags: [q.topic || "Document study", q.subject || "General Studies"],
        bookmarked: false,
        difficulty: q.difficulty || "Medium",
        attempted: false,
        sourcePage: q.source_page || ""
      });
    }

    if (!uniqueQuestions.length) {
      alert("The generated questions are duplicates of existing material. Try a different section or adjust the source text.");
      return;
    }

    const allowedQuestions = uniqueQuestions.slice(0, Math.max(1, Math.min(15, batchSize || 15)));
    data.mcqs.push(...allowedQuestions);

    if (Array.isArray(payload.terms)) {
      payload.terms.forEach((term) => {
        if (!term.name) return;
        const exists = data.terms.some((entry) => fingerprint(entry.name) === fingerprint(term.name));
        if (!exists) {
          data.terms.push({
            id: id("term"),
            name: term.name,
            category: term.category || "General Studies",
            definition: term.definition_en || "",
            telugu: term.definition_te || "",
            source: term.source_reference || "AI-assisted extraction",
            bookmarked: false
          });
        }
      });
    }

    saveData();
    go("mcqs");
    alert(`Generated ${allowedQuestions.length} new question(s) from the uploaded text.`);
  } catch (error) {
    console.error(error);
    alert(`AI generation failed: ${error.message || "Unknown error"}`);
  } finally {
    isGenerating = false;
    if (button) {
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  }
}

async function callGeminiAI(prompt) {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt, model: "gemini-2.5-flash" })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "AI request failed.");
  }

  return payload.result || "";
}

async function callGeminiAIForImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", "gemini-2.5-flash");
  formData.append("kind", "ocr");

  const response = await fetch("/api/generate", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Image OCR request failed.");
  }

  const payload = await response.json().catch(() => ({}));
  return payload.result || "";
}

function addListenerIfExists(idName, eventName, handler) {
  const element = document.getElementById(idName);
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

async function fetchDriveConfig() {
  try {
    const response = await fetch("/api/drive-files", {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json().catch(() => ({}));
    return !!payload.configured;
  } catch (error) {
    console.warn("Drive config probe failed", error);
    return false;
  }
}

async function initDriveUI() {
  const connectBtn = document.getElementById("driveConnectBtn");
  const refreshBtn = document.getElementById("driveRefreshBtn");
  const driveStatus = document.getElementById("driveStatus");
  const list = document.getElementById("driveFileList");

  if (connectBtn) {
    connectBtn.addEventListener("click", async () => {
      const configured = await fetchDriveConfig();
      if (!configured) {
        alert("Google Drive OAuth is not configured on this deployment. Set the required environment variables and redirect URIs first.");
        return;
      }

      window.location.href = "/api/drive-auth";
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      const configured = await fetchDriveConfig();
      if (!configured) {
        alert("Google Drive is not configured on this deployment yet.");
        return;
      }

      const response = await fetch("/api/drive-files");
      if (!response.ok) {
        if (list) {
          list.innerHTML = "<div class=\"empty-state\">Drive files are unavailable right now.</div>";
        }
        return;
      }

      const payload = await response.json().catch(() => ({ files: [] }));
      if (!Array.isArray(payload.files)) {
        if (list) {
          list.innerHTML = "<div class=\"empty-state\">No Drive files found.</div>";
        }
        return;
      }

      if (list) {
        list.innerHTML = payload.files.slice(0, 10).map((file) => `
          <div class="drive-item">
            <strong>${esc(file.name || "Unnamed file")}</strong>
            <small>${esc(file.mimeType || "Drive file")}</small>
            <button class="secondary" data-drive-import="${esc(file.id)}">Import</button>
          </div>
        `).join("") || "<div class=\"empty-state\">No files available in Drive.</div>";
      }

      list?.querySelectorAll("[data-drive-import]").forEach((button) => {
        button.addEventListener("click", async () => {
          const fileId = button.dataset.driveImport;
          const response = await fetch(`/api/drive-files?fileId=${encodeURIComponent(fileId)}`);
          const payload = await response.json().catch(() => ({}));

          if (!response.ok || !payload || !payload.text) {
            alert("The selected file could not be imported.");
            return;
          }

          document.getElementById("extractedText").value = payload.text || "";
          document.getElementById("articleTitle").value = payload.name || "Imported Drive file";
          go("documents");
          alert("Drive document imported into the article workspace.");
        });
      });
    });
  }

  const configured = await fetchDriveConfig();
  if (!configured) {
    if (driveStatus) {
      driveStatus.textContent = "Drive sync is not active. Google OAuth and redirect configuration are still required.";
      driveStatus.classList.add("warning");
      driveStatus.classList.remove("success");
    }
  } else {
    if (driveStatus) {
      driveStatus.textContent = "Google Drive integration is ready for use with the configured OAuth credentials.";
      driveStatus.classList.add("success");
      driveStatus.classList.remove("warning");
    }
  }
}

function init() {
  bindNavigation();

  addListenerIfExists("mcqSearch", "input", () => renderQuestions());
  addListenerIfExists("mcqExam", "change", () => renderQuestions());
  addListenerIfExists("setSelect", "change", () => renderQuestions());
  addListenerIfExists("batchSize", "change", () => renderQuestions());
  addListenerIfExists("termSearch", "input", () => renderTerms());
  addListenerIfExists("termCategory", "change", () => renderTerms());

  addListenerIfExists("showAddMcq", "click", () => {
    const panel = document.getElementById("addMcqPanel");
    if (panel) panel.classList.toggle("hidden");
  });

  addListenerIfExists("saveMcq", "click", () => {
    const exam = document.getElementById("newExam")?.value || "UPSC";
    const subject = document.getElementById("newSubject")?.value.trim() || "General Studies";
    const topic = document.getElementById("newTopic")?.value.trim() || "General";
    const question = document.getElementById("newQuestion")?.value.trim() || "";
    const options = [
      document.getElementById("optA")?.value.trim() || "",
      document.getElementById("optB")?.value.trim() || "",
      document.getElementById("optC")?.value.trim() || "",
      document.getElementById("optD")?.value.trim() || ""
    ];
    const answer = Number(document.getElementById("newAnswer")?.value || 0);

    if (!question || options.some((value) => !value)) {
      alert("Enter a question and all four options.");
      return;
    }

    if (data.mcqs.some((entry) => fingerprint(entry.question) === fingerprint(question))) {
      alert("A question with the same wording already exists.");
      return;
    }

    data.mcqs.push({
      id: id("q"),
      exam,
      subject,
      topic,
      question,
      options,
      answer,
      explanation: document.getElementById("newExplanation")?.value || "",
      telugu: document.getElementById("newTelugu")?.value || "",
      additional: document.getElementById("newAdditional")?.value || "",
      source: document.getElementById("newSource")?.value || "Manual entry",
      bookmarked: false,
      difficulty: "Medium",
      attempted: false
    });

    selectedQuestionId = data.mcqs[data.mcqs.length - 1].id;
    saveData();
    document.getElementById("addMcqPanel")?.classList.add("hidden");
  });

  addListenerIfExists("exportMcqJson", "click", () => {
    download("exam-study-master-mcqs.json", JSON.stringify({ exportedAt: new Date().toISOString(), mcqs: data.mcqs }, null, 2), "application/json");
  });

  addListenerIfExists("exportMcqCsv", "click", () => {
    const rows = data.mcqs.map((question) => [
      question.exam,
      question.subject,
      question.topic,
      question.question,
      question.options.join(" | "),
      question.answer,
      question.explanation,
      question.source || ""
    ]);

    download("exam-study-master-mcqs.csv", [
      "exam,subject,topic,question,options,answer,explanation,source",
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n"), "text/csv;charset=utf-8");
  });

  addListenerIfExists("printMcqs", "click", () => {
    const target = window.open("", "_blank", "width=1000,height=800");
    if (!target) {
      alert("Pop-up blocked. Allow pop-ups to print or save as PDF.");
      return;
    }

    const list = data.mcqs.slice(0, 30);
    target.document.write(`
      <html>
        <head><title>MCQ Set</title></head>
        <body>
          ${list.map((question, index) => `
            <h3>${index + 1}. ${question.question}</h3>
            <ol>${(question.options || []).map((option) => `<li>${option}</li>`).join("")}</ol>
          `).join("")}
        </body>
      </html>
    `);
    target.document.close();
    target.focus();
    setTimeout(() => target.print(), 400);
  });

  addListenerIfExists("saveDocument", "click", () => {
    const text = document.getElementById("extractedText")?.value.trim();
    if (!text) {
      alert("Extract or paste text first.");
      return;
    }

    data.documents.unshift({
      id: id("doc"),
      name: document.getElementById("articleTitle")?.value.trim() || "Document",
      type: "text",
      text,
      createdAt: new Date().toISOString(),
      pages: estimatePageCount(text)
    });

    saveData();
    alert("Document saved to the library.");
  });

  addListenerIfExists("makeNotes", "click", () => {
    const text = document.getElementById("extractedText")?.value.trim();
    if (!text) {
      alert("Upload or paste a source document first.");
      return;
    }

    const title = document.getElementById("articleTitle")?.value.trim() || "Study note";
    data.notes.unshift({
      id: id("note"),
      title,
      body: text.slice(0, 3000),
      createdAt: new Date().toISOString()
    });

    saveData();
    go("notes");
  });

  addListenerIfExists("makeMcqs", "click", () => makeAiQuestionsFromText());

  addListenerIfExists("downloadText", "click", () => {
    const text = document.getElementById("extractedText")?.value || "";
    if (!text) {
      alert("No text is available to export.");
      return;
    }
    download("extracted-text.txt", text, "text/plain;charset=utf-8");
  });

  addListenerIfExists("saveAnalysis", "click", () => {
    const title = document.getElementById("articleTitle")?.value.trim();
    if (!title) {
      alert("Enter a headline or topic.");
      return;
    }

    data.analyses.unshift({
      id: id("analysis"),
      title,
      summary: document.getElementById("analysisEnglish")?.value || "",
      telugu: document.getElementById("analysisTelugu")?.value || "",
      prelims: document.getElementById("analysisPrelims")?.value || "",
      mains: document.getElementById("analysisMains")?.value || ""
    });

    saveData();
  });

  addListenerIfExists("showAddTerm", "click", () => {
    const panel = document.getElementById("addTermPanel");
    if (panel) panel.classList.toggle("hidden");
  });

  addListenerIfExists("saveTerm", "click", () => {
    const name = document.getElementById("termName")?.value.trim();
    if (!name) {
      alert("Enter a term name.");
      return;
    }

    if (data.terms.some((entry) => fingerprint(entry.name) === fingerprint(name))) {
      alert("A matching term already exists in the explorer.");
      return;
    }

    data.terms.push({
      id: id("term"),
      name,
      category: document.getElementById("termNewCategory")?.value || "General Studies",
      definition: document.getElementById("termDefinition")?.value || "",
      telugu: document.getElementById("termTelugu")?.value || "",
      preface: document.getElementById("termPrelims")?.value || "",
      source: document.getElementById("termSource")?.value || "Manual entry",
      bookmarked: false
    });

    saveData();
    document.getElementById("addTermPanel")?.classList.add("hidden");
  });

  addListenerIfExists("saveNote", "click", () => {
    const title = document.getElementById("noteTitle")?.value.trim();
    const body = document.getElementById("noteBody")?.value.trim();
    if (!title || !body) {
      alert("Enter both a note title and note content.");
      return;
    }

    data.notes.unshift({
      id: id("note"),
      title,
      body,
      createdAt: new Date().toISOString()
    });

    saveData();
  });

  addListenerIfExists("clearNote", "click", () => {
    document.getElementById("noteTitle").value = "";
    document.getElementById("noteBody").value = "";
  });

  addListenerIfExists("saveAlert", "click", () => {
    const title = document.getElementById("alertTitle")?.value.trim();
    if (!title) {
      alert("Enter an alert title.");
      return;
    }

    data.alerts.unshift({
      id: id("alert"),
      exam: document.getElementById("alertExam")?.value || "UPSC",
      title,
      date: document.getElementById("alertDate")?.value || "",
      url: document.getElementById("alertUrl")?.value.trim() || ""
    });

    saveData();
  });

  addListenerIfExists("saveTask", "click", () => {
    const taskText = document.getElementById("taskText")?.value.trim();
    if (!taskText) {
      alert("Enter a task to schedule.");
      return;
    }

    data.tasks.push({
      id: id("task"),
      task: taskText,
      exam: document.getElementById("taskExam")?.value || "UPSC",
      done: false
    });

    saveData();
  });

  addListenerIfExists("backupExport", "click", () => {
    download("exam-study-studio-backup.json", JSON.stringify({ app: "Exam Study Studio", version: 2, exportedAt: new Date().toISOString(), data }, null, 2), "application/json");
  });

  addListenerIfExists("backupImport", "change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const incoming = JSON.parse(await file.text());
      data = normalizeData(incoming);
      localStorage.setItem(DBKEY, JSON.stringify(data));
      refreshAll();
      document.getElementById("backupStatus").textContent = "Backup restored successfully.";
    } catch (error) {
      console.error(error);
      document.getElementById("backupStatus").textContent = "The backup file could not be restored. Ensure it is a valid JSON export.";
    }
  });

  addListenerIfExists("pdfUpload", "change", async (event) => {
    const files = event.target.files;
    if (files && files.length) {
      handleDocumentUpload(files);
    }
  });

  addListenerIfExists("teachBtn", "click", () => {
    const term = document.getElementById("teacherTopic")?.value.trim().toLowerCase();
    if (!term) {
      alert("Enter a topic or keyword to search.");
      return;
    }

    const matches = [...data.terms, ...data.mcqs].filter((entry) => {
      const candidate = (entry.name || entry.question || "").toLowerCase();
      const tags = (entry.tags || []).join(" ").toLowerCase();
      return candidate.includes(term) || tags.includes(term);
    }).slice(0, 6);

    const result = document.getElementById("teacherResult");
    if (!matches.length) {
      result.innerHTML = "<div class=\"empty-state\">No matching saved material found. Try uploading a PDF or adding a note with that topic.</div>";
      return;
    }

    result.innerHTML = matches.map((entry) => `
      <article class="summary-card compact">
        <strong>${esc(entry.name || entry.question || "Saved resource")}</strong>
        <small>${esc((entry.definition || entry.explanation || entry.topic || "Study material").slice(0, 180))}</small>
      </article>
    `).join("");
  });

  addListenerIfExists("driveSetupBtn", "click", () => {
    const panel = document.getElementById("driveSetupGuide");
    if (panel) panel.classList.toggle("hidden");
  });

  addListenerIfExists("installBtn", "click", async () => {
    if (!currentDeferredPrompt) {
      alert("Install prompt is not available yet.");
      return;
    }

    currentDeferredPrompt.prompt();
    await currentDeferredPrompt.userChoice;
    currentDeferredPrompt = null;
  });

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    currentDeferredPrompt = event;
    const button = document.getElementById("installBtn");
    if (button) button.classList.remove("hidden");
  });

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("./service-worker.js").catch(console.warn);
  }

  initDriveUI();
  refreshAll();
}

window.addEventListener("load", init);
