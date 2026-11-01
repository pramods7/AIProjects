# Task Plan — Enterprise QA Engine v2.0

## Phase 1: Foundation ✅
- [x] Define data schemas in gemini.md
- [x] Create BLAST.md protocol
- [x] Create findings.md and progress.md

## Phase 2: Enterprise Build ✅
- [x] Redesign index.html (5-panel enterprise layout)
- [x] Write complete style.css (enterprise dark theme, all components)
- [x] Write complete app.js with:
  - [x] Enterprise Anti-Hallucination system prompt
  - [x] File handling (text, image, video, binary types)
  - [x] Ollama API integration (direct-to-localhost)
  - [x] JSON output parser (robust fallback)
  - [x] Scenario renderer
  - [x] Test case renderer (all fields)
  - [x] Traceability matrix table
  - [x] Risk areas renderer
  - [x] Automation candidates renderer
  - [x] Overview stats dashboard
  - [x] Self-validation check panel
  - [x] Export: CSV, JSON, HTML, TXT
  - [x] Search + Priority + Automation filters
  - [x] Tab navigation (6 tabs)
  - [x] Sidebar navigation
  - [x] Toast notifications
  - [x] Ollama connectivity indicator (auto-ping)

## Phase 3: In-Browser File Parsing (v2.1) ✅
- [x] Add SheetJS, Mammoth.js, and PDF.js CDN libraries in `index.html`
- [x] Implement Excel (`.xlsx`/`.xls`) parsing via SheetJS in `app.js`
- [x] Implement Word (`.docx`) parsing via Mammoth.js in `app.js`
- [x] Implement PDF (`.pdf`) parsing via PDF.js in `app.js`
- [x] Add truncation (MAX_CONTENT limit) and robust error fallbacks for parsed files

## Phase 4: Verification (Next)
- [ ] Open frontend/index.html in browser
- [ ] Verify Ollama status indicator
- [ ] Upload .xlsx / .docx requirements file → verify content extraction
- [ ] Verify all 6 output tabs render
- [ ] Test all 4 export functions
- [ ] Test search and filter

