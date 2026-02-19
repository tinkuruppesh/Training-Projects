/**
 * INKWELL — Markdown Editor
 * script.js
 *
 * Features:
 *  - Live markdown rendering via marked.js
 *  - Syntax highlighting via highlight.js
 *  - Toolbar formatting actions
 *  - Dark/light theme with localStorage persistence
 *  - Auto-save to localStorage
 *  - View modes: editor / preview / split
 *  - Fullscreen distraction-free mode
 *  - Open .md files from disk
 *  - Download as .md
 *  - Export as PDF via html2pdf.js
 *  - Resizable split panes
 *  - Word count, char count, reading time
 *  - Keyboard shortcuts
 *  - Toast notifications
 *  - Auto-save badge
 */

"use strict";

/* ─────────────────────────────────────────────────
   1. DOM REFERENCES
───────────────────────────────────────────────── */
const $   = (id) => document.getElementById(id);

const editor          = $("editor");
const preview         = $("preview");
const docTitle        = $("docTitle");
const themeToggle     = $("themeToggle");
const fullscreenBtn   = $("fullscreenBtn");
const fullscreenOverlay = $("fullscreenOverlay");
const fullscreenExit  = $("fullscreenExit");
const fsEditor        = $("fsEditor");
const fsDocTitle      = $("fsDocTitle");
const fsStats         = $("fsStats");
const openFileBtn     = $("openFileBtn");
const fileInput       = $("fileInput");
const downloadBtn     = $("downloadBtn");
const downloadMenu    = $("downloadMenu");
const downloadMd      = $("downloadMd");
const downloadPdf     = $("downloadPdf");
const autosaveBadge   = $("autosaveBadge");
const toastContainer  = $("toastContainer");
const workspace       = $("workspace");
const resizeHandle    = $("resizeHandle");
const editorPane      = $("editorPane");

const wordCountEl = $("wordCount");
const charCountEl = $("charCount");
const readTimeEl  = $("readTime");

/* ─────────────────────────────────────────────────
   2. MARKED.JS CONFIGURATION
───────────────────────────────────────────────── */
// Configure marked with GFM and highlight.js integration
marked.setOptions({
  gfm: true,          // GitHub Flavored Markdown
  breaks: true,       // line breaks become <br>
  highlight: function (code, lang) {
    // Use highlight.js if the language is recognised
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; }
      catch (_) { /* fall through */ }
    }
    return hljs.highlightAuto(code).value;
  },
});

/* ─────────────────────────────────────────────────
   3. DEFAULT CONTENT (shown on first load)
───────────────────────────────────────────────── */
const DEFAULT_CONTENT = `# Welcome to Inkwell ✦

**Inkwell** is a *clean, distraction-free* Markdown editor that lives entirely in your browser.

---

## Features

- **Live preview** — updates as you type
- **Split / Write / Preview** modes
- **Dark & light** themes
- **Auto-save** to \`localStorage\`
- **Export** as \`.md\` or \`.pdf\`
- **Fullscreen** writing mode
- Syntax highlighted **code blocks**

---

## Quick Markdown Reference

### Emphasis

**bold text** and *italic text* and ~~strikethrough~~

### Lists

1. Ordered item one
2. Ordered item two
3. Ordered item three

- Unordered item
- Another item
  - Nested item

### Blockquote

> "The first draft is just you telling yourself the story."
> — *Terry Pratchett*

### Code

Inline \`code\` and a fenced block:

\`\`\`javascript
// Fibonacci (recursive)
function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}
console.log(fib(10)); // 55
\`\`\`

### Table

| Feature      | Status   |
|--------------|----------|
| Live preview | ✅ Ready |
| Dark theme   | ✅ Ready |
| PDF export   | ✅ Ready |
| Auto-save    | ✅ Ready |

### Image

![Placeholder](https://via.placeholder.com/600x200/f9f7f4/c4724a?text=Inkwell+Preview)

---

Start writing — your work is saved automatically. 🖊️
`;

/* ─────────────────────────────────────────────────
   4. STATE
───────────────────────────────────────────────── */
let currentTheme    = "light";
let currentMode     = "both";
let isFullscreen    = false;
let autosaveTimer   = null;
let autosaveBadgeTimer = null;
let isResizing      = false;
let startX          = 0;
let startWidth      = 0;
let undoStack       = [];
let redoStack       = [];
let isUndoRedo      = false;

/* ─────────────────────────────────────────────────
   5. INITIALISATION
───────────────────────────────────────────────── */
function init() {
  loadTheme();
  loadContent();
  renderPreview();
  updateStats();
  setupEventListeners();
  setupKeyboardShortcuts();
  setupResizeHandle();
}

/* ─────────────────────────────────────────────────
   6. THEME
───────────────────────────────────────────────── */
function loadTheme() {
  currentTheme = localStorage.getItem("inkwell-theme") || "light";
  applyTheme(currentTheme);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("inkwell-theme", theme);

  // Toggle hljs theme stylesheets
  const hljsLight = $("hljs-theme");
  const hljsDark  = $("hljs-theme-dark");
  if (theme === "dark") {
    hljsLight.disabled = true;
    hljsDark.disabled  = false;
  } else {
    hljsLight.disabled = false;
    hljsDark.disabled  = true;
  }
}

function toggleTheme() {
  applyTheme(currentTheme === "light" ? "dark" : "light");
  // Re-render so code blocks pick up the new hljs theme
  renderPreview();
}

/* ─────────────────────────────────────────────────
   7. CONTENT & AUTO-SAVE
───────────────────────────────────────────────── */
function loadContent() {
  const savedContent = localStorage.getItem("inkwell-content");
  const savedTitle   = localStorage.getItem("inkwell-title");

  editor.value  = savedContent !== null ? savedContent : DEFAULT_CONTENT;
  docTitle.value = savedTitle  || "Untitled Document";

  // Seed undo stack with initial state
  undoStack.push(editor.value);
}

function scheduleAutoSave() {
  // Debounce: save 1.5 s after user stops typing
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(autoSave, 1500);
}

function autoSave() {
  localStorage.setItem("inkwell-content", editor.value);
  localStorage.setItem("inkwell-title",   docTitle.value);
  showAutosaveBadge();
}

function showAutosaveBadge() {
  autosaveBadge.classList.add("show");
  clearTimeout(autosaveBadgeTimer);
  autosaveBadgeTimer = setTimeout(() => autosaveBadge.classList.remove("show"), 2000);
}

/* ─────────────────────────────────────────────────
   8. UNDO / REDO
───────────────────────────────────────────────── */
function pushUndoState() {
  if (isUndoRedo) return;
  const current = editor.value;
  // Avoid duplicate entries
  if (undoStack[undoStack.length - 1] === current) return;
  undoStack.push(current);
  // Cap stack at 100 entries
  if (undoStack.length > 100) undoStack.shift();
  redoStack = []; // New edit clears redo
}

function undo() {
  if (undoStack.length < 2) return;
  isUndoRedo = true;
  redoStack.push(undoStack.pop());
  editor.value = undoStack[undoStack.length - 1];
  isUndoRedo = false;
  renderPreview();
  updateStats();
}

function redo() {
  if (redoStack.length === 0) return;
  isUndoRedo = true;
  const state = redoStack.pop();
  undoStack.push(state);
  editor.value = state;
  isUndoRedo = false;
  renderPreview();
  updateStats();
}

/* ─────────────────────────────────────────────────
   9. MARKDOWN RENDERING
───────────────────────────────────────────────── */
function renderPreview() {
  // Parse markdown and inject into preview
  preview.innerHTML = marked.parse(editor.value || "");

  // Apply syntax highlighting to any code blocks that weren't auto-highlighted
  preview.querySelectorAll("pre code:not(.hljs)").forEach((block) => {
    hljs.highlightElement(block);
  });
}

/* ─────────────────────────────────────────────────
   10. WORD / CHAR COUNT & READING TIME
───────────────────────────────────────────────── */
function updateStats() {
  const text  = editor.value;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  // Average reading speed: 200 wpm
  const mins  = Math.max(1, Math.ceil(words / 200));

  wordCountEl.textContent = `${words.toLocaleString()} word${words !== 1 ? "s" : ""}`;
  charCountEl.textContent = `${chars.toLocaleString()} char${chars !== 1 ? "s" : ""}`;
  readTimeEl.textContent  = `~${mins} min read`;

  // Sync fullscreen stats
  if (isFullscreen) {
    fsStats.textContent = `${words.toLocaleString()} words · ${chars.toLocaleString()} chars · ~${mins} min read`;
  }
}

/* ─────────────────────────────────────────────────
   11. VIEW MODES
───────────────────────────────────────────────── */
function setMode(mode) {
  currentMode = mode;
  workspace.setAttribute("data-mode", mode);

  // Update button states
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
}

/* ─────────────────────────────────────────────────
   12. FULLSCREEN MODE
───────────────────────────────────────────────── */
function enterFullscreen() {
  isFullscreen = true;
  fsEditor.value = editor.value;
  fsDocTitle.textContent = docTitle.value;
  updateStats();
  fullscreenOverlay.hidden = false;
  fsEditor.focus();
  // Move cursor to end
  fsEditor.selectionStart = fsEditor.selectionEnd = fsEditor.value.length;
}

function exitFullscreen() {
  // Sync content back to main editor
  editor.value = fsEditor.value;
  renderPreview();
  updateStats();
  autoSave();
  isFullscreen = false;
  fullscreenOverlay.hidden = true;
  editor.focus();
}

/* ─────────────────────────────────────────────────
   13. FILE OPEN
───────────────────────────────────────────────── */
function openFile() {
  fileInput.click();
}

function handleFileOpen(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    editor.value = e.target.result;
    // Use filename (without extension) as document title
    docTitle.value = file.name.replace(/\.(md|txt)$/i, "");
    renderPreview();
    updateStats();
    autoSave();
    showToast(`Opened "${file.name}"`);
  };
  reader.readAsText(file);
  // Reset so the same file can be re-opened
  event.target.value = "";
}

/* ─────────────────────────────────────────────────
   14. DOWNLOAD AS .MD
───────────────────────────────────────────────── */
function downloadAsMarkdown() {
  const filename = (docTitle.value || "document").trim() + ".md";
  const blob     = new Blob([editor.value], { type: "text/markdown" });
  triggerDownload(blob, filename);
  showToast("Downloaded as .md");
}

/* ─────────────────────────────────────────────────
   15. EXPORT AS PDF
───────────────────────────────────────────────── */
function exportAsPdf() {
  // Clone the preview element so we can style it without affecting the UI
  const clone = preview.cloneNode(true);

  // Wrap with styling for the PDF
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 14px;
    line-height: 1.8;
    color: #1c1a17;
    max-width: 680px;
    margin: 0 auto;
    padding: 0;
  `;
  wrapper.appendChild(clone);

  const filename = (docTitle.value || "document").trim() + ".pdf";

  const options = {
    margin:      [12, 16, 12, 16],  // mm
    filename:    filename,
    image:       { type: "jpeg", quality: 0.97 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" },
  };

  showToast("Generating PDF…");
  html2pdf().set(options).from(wrapper).save()
    .then(() => showToast("PDF exported!"))
    .catch(() => showToast("PDF export failed"));
}

/* ─────────────────────────────────────────────────
   16. TOOLBAR ACTIONS
───────────────────────────────────────────────── */
/**
 * Insert/wrap text in the active editor.
 * @param {HTMLTextAreaElement} ta - the textarea element
 * @param {string} before - text to insert before selection
 * @param {string} after  - text to insert after selection (optional)
 * @param {string} placeholder - placeholder if no selection
 */
function insertText(ta, before, after = "", placeholder = "") {
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  const sel   = ta.value.substring(start, end);
  const inner = sel || placeholder;

  const replacement = before + inner + after;
  ta.setRangeText(replacement, start, end, "select");

  // If we inserted a placeholder, select it so user can type over it
  if (!sel && placeholder) {
    ta.selectionStart = start + before.length;
    ta.selectionEnd   = start + before.length + placeholder.length;
  }

  ta.focus();
  // Trigger input event so preview updates
  ta.dispatchEvent(new Event("input"));
}

/**
 * Insert a line-prefix (heading, list item, blockquote, etc.)
 * Applies the prefix to every selected line.
 */
function insertLinePrefix(ta, prefix) {
  const start = ta.selectionStart;
  const end   = ta.selectionEnd;
  const lines = ta.value.split("\n");

  // Find the line indices that contain the selection
  let charCount = 0;
  let firstLine = -1, lastLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const lineEnd = charCount + lines[i].length;
    if (firstLine === -1 && lineEnd >= start) firstLine = i;
    if (charCount <= end)                     lastLine  = i;
    charCount += lines[i].length + 1; // +1 for \n
  }

  // Toggle: if all selected lines already have the prefix, remove it
  const allHavePrefix = lines
    .slice(firstLine, lastLine + 1)
    .every((l) => l.startsWith(prefix));

  for (let i = firstLine; i <= lastLine; i++) {
    if (allHavePrefix) {
      lines[i] = lines[i].startsWith(prefix)
        ? lines[i].slice(prefix.length)
        : lines[i];
    } else {
      if (!lines[i].startsWith(prefix)) lines[i] = prefix + lines[i];
    }
  }

  ta.value = lines.join("\n");
  ta.dispatchEvent(new Event("input"));
  ta.focus();
}

/** Dispatch a toolbar action to the active textarea. */
function handleToolbarAction(action) {
  // Use main editor or fullscreen editor depending on current mode
  const ta = isFullscreen ? fsEditor : editor;

  switch (action) {
    case "bold":        insertText(ta, "**", "**", "bold text"); break;
    case "italic":      insertText(ta, "*",  "*",  "italic text"); break;
    case "strikethrough": insertText(ta, "~~", "~~", "strikethrough"); break;
    case "h1":          insertLinePrefix(ta, "# "); break;
    case "h2":          insertLinePrefix(ta, "## "); break;
    case "h3":          insertLinePrefix(ta, "### "); break;
    case "ul":          insertLinePrefix(ta, "- "); break;
    case "ol":          insertLinePrefix(ta, "1. "); break;
    case "blockquote":  insertLinePrefix(ta, "> "); break;
    case "hr":          insertText(ta, "\n\n---\n\n"); break;
    case "code":        insertText(ta, "`", "`", "code"); break;
    case "codeblock":
      insertText(ta, "```\n", "\n```", "// code here"); break;
    case "link":
      insertText(ta, "[", "](https://)", "link text"); break;
    case "image":
      insertText(ta, "![", "](https://)", "alt text"); break;
    case "table":
      insertText(ta,
        "\n| Header 1 | Header 2 | Header 3 |\n| -------- | -------- | -------- |\n| Cell 1   | Cell 2   | Cell 3   |\n"
      ); break;
    case "undo": undo(); break;
    case "redo": redo(); break;
  }
}

/* ─────────────────────────────────────────────────
   17. RESIZABLE SPLIT PANE
───────────────────────────────────────────────── */
function setupResizeHandle() {
  resizeHandle.addEventListener("mousedown", startResize);
  resizeHandle.addEventListener("touchstart", startResize, { passive: true });
}

function startResize(e) {
  if (currentMode !== "both") return;
  isResizing = true;
  startX     = e.clientX ?? e.touches?.[0].clientX;
  startWidth = editorPane.getBoundingClientRect().width;

  resizeHandle.classList.add("dragging");
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";

  document.addEventListener("mousemove", doResize);
  document.addEventListener("touchmove", doResize, { passive: false });
  document.addEventListener("mouseup",   stopResize);
  document.addEventListener("touchend",  stopResize);
}

function doResize(e) {
  if (!isResizing) return;
  e.preventDefault();

  const clientX = e.clientX ?? e.touches?.[0].clientX;
  const dx = clientX - startX;
  const parentWidth = workspace.getBoundingClientRect().width;
  const newWidth = Math.min(Math.max(startWidth + dx, 200), parentWidth - 200);
  const pct = (newWidth / parentWidth) * 100;

  editorPane.style.flex = `0 0 ${pct}%`;
}

function stopResize() {
  isResizing = false;
  resizeHandle.classList.remove("dragging");
  document.body.style.cursor = "";
  document.body.style.userSelect = "";

  document.removeEventListener("mousemove", doResize);
  document.removeEventListener("touchmove", doResize);
  document.removeEventListener("mouseup",   stopResize);
  document.removeEventListener("touchend",  stopResize);
}

/* ─────────────────────────────────────────────────
   18. TOAST NOTIFICATIONS
───────────────────────────────────────────────── */
function showToast(message, duration = 2500) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duration);
}

/* ─────────────────────────────────────────────────
   19. UTILITY — trigger a file download
───────────────────────────────────────────────── */
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement("a");
  a.href     = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ─────────────────────────────────────────────────
   20. EVENT LISTENERS
───────────────────────────────────────────────── */
function setupEventListeners() {

  // ── Editor input ────────────────────────────
  editor.addEventListener("input", () => {
    pushUndoState();
    renderPreview();
    updateStats();
    scheduleAutoSave();
    // Sync to fullscreen if open
    if (isFullscreen) fsEditor.value = editor.value;
  });

  // ── Fullscreen editor input ──────────────────
  fsEditor.addEventListener("input", () => {
    editor.value = fsEditor.value; // keep in sync
    renderPreview();
    updateStats();
    scheduleAutoSave();
  });

  // ── Tab key → indent ─────────────────────────
  [editor, fsEditor].forEach((ta) => {
    ta.addEventListener("keydown", (e) => {
      if (e.key === "Tab") {
        e.preventDefault();
        insertText(ta, "  "); // 2-space indent
      }
    });
  });

  // ── Document title ───────────────────────────
  docTitle.addEventListener("input", scheduleAutoSave);
  docTitle.addEventListener("change", () => {
    if (isFullscreen) fsDocTitle.textContent = docTitle.value;
  });

  // ── Theme toggle ─────────────────────────────
  themeToggle.addEventListener("click", toggleTheme);

  // ── View mode buttons ─────────────────────────
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });

  // ── Fullscreen ───────────────────────────────
  fullscreenBtn.addEventListener("click", enterFullscreen);
  fullscreenExit.addEventListener("click", exitFullscreen);

  // ── Open file ────────────────────────────────
  openFileBtn.addEventListener("click", openFile);
  fileInput.addEventListener("change", handleFileOpen);

  // ── Download dropdown ────────────────────────
  downloadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    downloadMenu.classList.toggle("open");
  });
  document.addEventListener("click", (e) => {
    if (!downloadMenu.contains(e.target)) {
      downloadMenu.classList.remove("open");
    }
  });
  downloadMd.addEventListener("click", () => {
    downloadMenu.classList.remove("open");
    downloadAsMarkdown();
  });
  downloadPdf.addEventListener("click", () => {
    downloadMenu.classList.remove("open");
    exportAsPdf();
  });

  // ── Toolbar ───────────────────────────────────
  document.querySelectorAll(".tool-btn[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => handleToolbarAction(btn.dataset.action));
  });

  // ── Escape key exits fullscreen ──────────────
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isFullscreen) exitFullscreen();
  });

  // ── Drag-and-drop .md files onto editor ──────
  editor.addEventListener("dragover", (e) => { e.preventDefault(); });
  editor.addEventListener("drop", (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && /\.(md|txt)$/i.test(file.name)) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        editor.value  = ev.target.result;
        docTitle.value = file.name.replace(/\.(md|txt)$/i, "");
        renderPreview();
        updateStats();
        autoSave();
        showToast(`Opened "${file.name}"`);
      };
      reader.readAsText(file);
    }
  });
}

/* ─────────────────────────────────────────────────
   21. KEYBOARD SHORTCUTS
───────────────────────────────────────────────── */
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey; // Cmd on Mac, Ctrl on Win/Linux

    if (ctrl) {
      switch (e.key.toLowerCase()) {
        case "b": e.preventDefault(); handleToolbarAction("bold");   break;
        case "i": e.preventDefault(); handleToolbarAction("italic"); break;
        case "k": e.preventDefault(); handleToolbarAction("link");   break;
        case "s":
          e.preventDefault();
          autoSave();
          showToast("Saved!");
          break;
        case "z":
          if (!e.shiftKey) { e.preventDefault(); undo(); }
          else             { e.preventDefault(); redo(); }
          break;
        case "y": e.preventDefault(); redo(); break;
        case "\\": // Ctrl+\ → toggle fullscreen
          e.preventDefault();
          isFullscreen ? exitFullscreen() : enterFullscreen();
          break;
        case "1": e.preventDefault(); setMode("both");    break;
        case "2": e.preventDefault(); setMode("editor");  break;
        case "3": e.preventDefault(); setMode("preview"); break;
      }
    }
  });
}

/* ─────────────────────────────────────────────────
   22. START
───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", init);
