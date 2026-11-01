/* ================================================================
   ENTERPRISE QA ENGINE — APPLICATION LOGIC
   Project: Local Test Case Generator
   Architecture: Zero-Backend | Direct-to-Ollama
   Model: llama3.2 @ localhost:11434
   ================================================================ */

'use strict';

// ───────────────────────────────────────────────────────────────
// 1. CONSTANTS & STATE
// ───────────────────────────────────────────────────────────────

let ollamaHost     = localStorage.getItem('ollama_host') || 'http://127.0.0.1:11434';
const MODEL_NAME   = 'llama3.2';
const MAX_CONTENT  = 18000; // chars per file to avoid token overflow

const STATE = {
  isProcessing  : false,
  files         : [],          // { name, type, size, content, icon, warning }
  lastOutput    : null,        // parsed output object
  currentTab    : 'overview',
  currentView   : 'generator',
};

// ───────────────────────────────────────────────────────────────
// 2. ENTERPRISE SYSTEM PROMPT (Anti-Hallucination Engine)
// ───────────────────────────────────────────────────────────────

function buildSystemPrompt(framework) {
  const frameworkLine = framework
    ? `\nPreferred Automation Framework: ${framework}`
    : '';

  return `You are an Enterprise QA Test Design Engine with expertise in:
Selenium Automation, Java, Maven, TestNG, Salesforce CRM, Enterprise Web Applications, REST APIs, UI/UX Validation, Functional Testing, Regression Testing, Accessibility Testing, Security Validation, Cross Browser Validation, Test Scenario Engineering, Risk Based Testing, and Requirement Traceability.${frameworkLine}

## ANTI-HALLUCINATION RULES (MANDATORY — NEVER VIOLATE):
1. Do NOT invent requirements not present in the provided input.
2. Do NOT assume UI elements, workflows, APIs, or validations not explicitly stated.
3. Do NOT infer business logic unless explicitly stated in the provided material.
4. Every generated test case MUST map to source evidence in the provided input.
5. If information is missing, explicitly state: "Insufficient information to determine."
6. All assumptions must be labeled: "Inference (low confidence)"
7. Never fabricate selectors, URLs, field names, buttons, workflows, or expected results.
8. Never merge unrelated requirements.
9. Always maintain requirement traceability.
10. Never generate fake APIs or fake system behaviors.

## MANDATORY OUTPUT FORMAT:
You MUST respond in the following EXACT JSON structure. Do not include any text outside this JSON block:

{
  "verified_facts": ["string", ...],
  "missing_information": ["string", ...],
  "low_confidence_inferences": ["string", ...],
  "test_scenarios": [
    {
      "scenario_id": "TS_001",
      "scenario_name": "string",
      "module": "string",
      "priority": "Critical|High|Medium|Low",
      "preconditions": "string",
      "test_data": "string",
      "steps": ["step1", "step2", ...],
      "expected_result": "string",
      "requirement_reference": "string",
      "evidence_source": "string",
      "automation_candidate": "Yes|No|Partial",
      "risk_level": "High|Medium|Low",
      "confidence": "High|Medium|Low",
      "confidence_reason": "string"
    }
  ],
  "test_cases": [
    {
      "tc_id": "TC_001",
      "scenario_id": "TS_001",
      "title": "string",
      "objective": "string",
      "module": "string",
      "priority": "Critical|High|Medium|Low",
      "environment": "string",
      "preconditions": "string",
      "dependencies": "string",
      "test_data": "string",
      "execution_steps": ["step1", "step2", ...],
      "expected_result": "string",
      "actual_result": "To be executed",
      "status": "Not Run",
      "requirement_mapping": "string",
      "source_evidence": "string",
      "automation_feasibility": "Yes|No|Partial",
      "regression_impact": "High|Medium|Low",
      "risk_category": "string",
      "confidence": "High|Medium|Low",
      "tc_type": "Positive|Negative|Boundary|Security|UI|API|Accessibility|Integration|Performance"
    }
  ],
  "traceability_matrix": [
    {
      "requirement_ref": "string",
      "source": "string",
      "scenario_id": "string",
      "test_case_ids": ["TC_001"],
      "priority": "Critical|High|Medium|Low",
      "coverage": "Full|Partial|None",
      "automation": "Yes|No|Partial"
    }
  ],
  "automation_candidates": [
    {
      "name": "string",
      "framework": "string",
      "type": "Selenium|API|DataDriven|Regression|E2E",
      "reason": "string",
      "scenario_ids": ["TS_001"],
      "tags": ["Regression", "Smoke", "CI/CD"]
    }
  ],
  "risk_areas": [
    {
      "area": "string",
      "risk_level": "High|Medium|Low",
      "description": "string",
      "mitigation": "string",
      "icon": "🔴|🟠|🟡"
    }
  ],
  "self_validation": {
    "no_hallucinated_fields": true,
    "no_invented_apis": true,
    "no_invented_workflows": true,
    "no_fabricated_validations": true,
    "no_duplicate_scenarios": true,
    "all_scenarios_mapped": true,
    "missing_info_identified": true,
    "notes": "string"
  }
}`;
}

// ───────────────────────────────────────────────────────────────
// 3. FILE TYPE DETECTION & ICONS
// ───────────────────────────────────────────────────────────────

const FILE_ICONS = {
  pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗',
  csv: '📊', txt: '📄', log: '📄', json: '🟡', xml: '🔴',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', webp: '🖼️', gif: '🖼️',
  mp4: '🎬', mov: '🎬', avi: '🎬', mkv: '🎬',
  zip: '📦', default: '📎'
};

const TEXT_TYPES = new Set(['txt','log','json','xml','csv','md','js','ts','py','java','html','css','yaml','yml']);
const IMAGE_TYPES = new Set(['png','jpg','jpeg','webp','gif']);
const VIDEO_TYPES = new Set(['mp4','mov','avi','mkv']);
const BINARY_TYPES = new Set(['doc','zip']);

function getExt(name) { return (name.split('.').pop() || '').toLowerCase(); }
function getIcon(name) { return FILE_ICONS[getExt(name)] || FILE_ICONS.default; }

function formatBytes(b) {
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  return (b/1024/1024).toFixed(1) + ' MB';
}

// ───────────────────────────────────────────────────────────────
// 4. FILE HANDLING
// ───────────────────────────────────────────────────────────────

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.add('drag-over');
}

function handleDragLeave(e) {
  document.getElementById('upload-zone').classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('upload-zone').classList.remove('drag-over');
  processFiles(e.dataTransfer.files);
}

function handleFileSelect(e) {
  processFiles(e.target.files);
  e.target.value = ''; // reset so same file can be re-added
}

async function processFiles(fileList) {
  const promises = Array.from(fileList).map(file => readFile(file));
  const results  = await Promise.all(promises);

  for (const r of results) {
    // Deduplicate by name
    if (!STATE.files.find(f => f.name === r.name)) {
      STATE.files.push(r);
    }
  }

  renderFileList();
  showToast(`✅ ${fileList.length} file(s) added`, 'success');
}

// Helper to parse Excel files using SheetJS
function parseExcel(file) {
  return new Promise((resolve, reject) => {
    if (typeof XLSX === 'undefined') {
      reject(new Error('SheetJS library is not loaded. Please check your internet connection or reload.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let text = '';
        workbook.SheetNames.forEach(sheetName => {
          text += `Sheet: ${sheetName}\n`;
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          text += csv + '\n';
        });
        resolve(text);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = err => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Helper to parse Word documents using Mammoth.js
function parseDocx(file) {
  return new Promise((resolve, reject) => {
    if (typeof mammoth === 'undefined') {
      reject(new Error('Mammoth.js library is not loaded. Please check your internet connection or reload.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const arrayBuffer = e.target.result;
      mammoth.extractRawText({ arrayBuffer: arrayBuffer })
        .then(result => resolve(result.value))
        .catch(err => reject(err));
    };
    reader.onerror = err => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

// Helper to parse PDF documents using PDF.js
function parsePdf(file) {
  return new Promise((resolve, reject) => {
    if (typeof pdfjsLib === 'undefined') {
      reject(new Error('PDF.js library is not loaded. Please check your internet connection or reload.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      const typedarray = new Uint8Array(e.target.result);
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
      
      pdfjsLib.getDocument({ data: typedarray }).promise.then(pdf => {
        const maxPages = pdf.numPages;
        const pagePromises = [];
        for (let j = 1; j <= maxPages; j++) {
          pagePromises.push(
            pdf.getPage(j).then(page => {
              return page.getTextContent().then(textContent => {
                return textContent.items.map(item => item.str).join(' ');
              });
            })
          );
        }
        Promise.all(pagePromises)
          .then(texts => resolve(texts.join('\n\n')))
          .catch(err => reject(err));
      }).catch(err => reject(err));
    };
    reader.onerror = err => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

function readFile(file) {
  return new Promise((resolve) => {
    const ext   = getExt(file.name);
    const icon  = getIcon(file.name);

    if (TEXT_TYPES.has(ext)) {
      const reader = new FileReader();
      reader.onload = e => resolve({
        name   : file.name,
        size   : file.size,
        type   : 'text',
        ext,
        icon,
        content: e.target.result.slice(0, MAX_CONTENT),
        warning: file.size > MAX_CONTENT ? '(truncated to 18K chars)' : null
      });
      reader.readAsText(file);

    } else if (ext === 'xlsx' || ext === 'xls') {
      parseExcel(file)
        .then(text => {
          resolve({
            name   : file.name,
            size   : file.size,
            type   : 'document',
            ext,
            icon,
            content: text.slice(0, MAX_CONTENT),
            warning: text.length > MAX_CONTENT ? '(truncated to 18K chars)' : null
          });
        })
        .catch(err => {
          resolve({
            name   : file.name,
            size   : file.size,
            type   : 'binary',
            ext,
            icon,
            content: `[EXCEL FILE: ${file.name}] — Error parsing: ${err.message}`,
            warning: `⚠️ Excel parsing failed: ${err.message}`
          });
        });

    } else if (ext === 'docx') {
      parseDocx(file)
        .then(text => {
          resolve({
            name   : file.name,
            size   : file.size,
            type   : 'document',
            ext,
            icon,
            content: text.slice(0, MAX_CONTENT),
            warning: text.length > MAX_CONTENT ? '(truncated to 18K chars)' : null
          });
        })
        .catch(err => {
          resolve({
            name   : file.name,
            size   : file.size,
            type   : 'binary',
            ext,
            icon,
            content: `[DOCX FILE: ${file.name}] — Error parsing: ${err.message}`,
            warning: `⚠️ DOCX parsing failed: ${err.message}`
          });
        });

    } else if (ext === 'pdf') {
      parsePdf(file)
        .then(text => {
          resolve({
            name   : file.name,
            size   : file.size,
            type   : 'document',
            ext,
            icon,
            content: text.slice(0, MAX_CONTENT),
            warning: text.length > MAX_CONTENT ? '(truncated to 18K chars)' : null
          });
        })
        .catch(err => {
          resolve({
            name   : file.name,
            size   : file.size,
            type   : 'binary',
            ext,
            icon,
            content: `[PDF FILE: ${file.name}] — Error parsing: ${err.message}`,
            warning: `⚠️ PDF parsing failed: ${err.message}`
          });
        });

    } else if (IMAGE_TYPES.has(ext)) {
      const reader = new FileReader();
      reader.onload = e => resolve({
        name    : file.name,
        size    : file.size,
        type    : 'image',
        ext,
        icon,
        content : `[IMAGE FILE: ${file.name}] — Describe visible UI elements, fields, buttons, layouts, error messages, workflows, and navigation from this image in your analysis.`,
        dataUrl : e.target.result,
        warning : 'Image submitted. AI will analyze based on filename and description only.'
      });
      reader.readAsDataURL(file);

    } else if (VIDEO_TYPES.has(ext)) {
      resolve({
        name    : file.name,
        size    : file.size,
        type    : 'video',
        ext,
        icon,
        content : `[VIDEO FILE: ${file.name}] — Extract observable UI workflows, user actions, page transitions, visible validations, and error messages from this screen recording in your analysis.`,
        warning : 'Video metadata submitted. Analyze visible filename context for test generation.'
      });

    } else if (BINARY_TYPES.has(ext)) {
      resolve({
        name    : file.name,
        size    : file.size,
        type    : 'binary',
        ext,
        icon,
        content : `[BINARY FILE: ${file.name} (${formatBytes(file.size)})] — This document was uploaded but its content cannot be parsed in-browser. Generate test assets based on: (a) the filename and type context, (b) any context the user provides in the notes field. DO NOT invent content not evidenced by user-provided notes.`,
        warning : `⚠️ ${ext.toUpperCase()} files cannot be parsed in-browser. Paste key content into the Context notes for best results.`
      });

    } else {
      resolve({
        name    : file.name,
        size    : file.size,
        type    : 'unknown',
        ext,
        icon,
        content : `[FILE: ${file.name}] — Unknown type. Context provided via filename only.`,
        warning : 'File type not directly parseable.'
      });
    }
  });
}

function removeFile(idx) {
  STATE.files.splice(idx, 1);
  renderFileList();
}

function renderFileList() {
  const list = document.getElementById('file-list');
  list.innerHTML = '';

  STATE.files.forEach((f, i) => {
    const el = document.createElement('div');
    el.className = 'file-item';
    el.innerHTML = `
      <span class="ficon">${f.icon}</span>
      <span class="fname" title="${f.name}">${f.name}</span>
      <span class="fsize">${formatBytes(f.size)}</span>
      ${f.warning ? `<span title="${f.warning}" style="color:var(--clr-amber);font-size:0.8rem;cursor:help;">⚠️</span>` : ''}
      <button class="fremove" onclick="removeFile(${i})" title="Remove file">✕</button>
    `;
    list.appendChild(el);
  });
}

// ───────────────────────────────────────────────────────────────
// 5. PROMPT CONSTRUCTION
// ───────────────────────────────────────────────────────────────

function buildUserPrompt() {
  const context   = document.getElementById('context-input').value.trim();
  const framework = document.getElementById('framework-select').value;

  let parts = [];

  if (STATE.files.length === 0 && !context) {
    return null;
  }

  parts.push('=== UPLOADED INPUT FILES ===\n');

  if (STATE.files.length === 0) {
    parts.push('No files uploaded.\n');
  } else {
    STATE.files.forEach((f, i) => {
      parts.push(`--- File ${i+1}: ${f.name} (${f.type.toUpperCase()}) ---`);
      parts.push(f.content);
      parts.push('');
    });
  }

  parts.push('\n=== USER CONTEXT / NOTES ===\n');
  parts.push(context || 'No additional context provided.');

  parts.push('\n=== GENERATION REQUEST ===');
  parts.push('Generate the following test assets based ONLY on the evidence above:');
  parts.push('1. Functional Test Scenarios');
  parts.push('2. Functional Test Cases (Positive, Negative, Boundary, UI, API, Security, Accessibility)');
  parts.push('3. Requirement Traceability Matrix');
  parts.push('4. Automation Candidates with framework tags');
  parts.push('5. Risk Areas');
  parts.push('6. Self-Validation Check');
  parts.push('');
  parts.push('CRITICAL: Output ONLY valid JSON matching the schema. No markdown, no explanation, no preamble.');

  return parts.join('\n');
}

// ───────────────────────────────────────────────────────────────
// 6. OLLAMA API
// ───────────────────────────────────────────────────────────────

async function callOllama(systemPrompt, userPrompt) {
  const fullPrompt = `SYSTEM:\n${systemPrompt}\n\nUSER:\n${userPrompt}`;

  const response = await fetch(`${ollamaHost}/api/generate`, {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      model : MODEL_NAME,
      prompt: fullPrompt,
      stream: false,
      options: {
        temperature: 0.1,   // Low temp = deterministic / less hallucination
        top_p      : 0.85,
        num_predict: 8192,  // Allow large outputs
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Ollama API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.response;
}

// ───────────────────────────────────────────────────────────────
// 7. JSON PARSING (ROBUST)
// ───────────────────────────────────────────────────────────────

function parseAIResponse(raw) {
  // Try direct parse first
  try {
    return JSON.parse(raw);
  } catch (_) {}

  // Extract JSON block from markdown fences
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1].trim()); } catch (_) {}
  }

  // Try to find first { to last }
  const startIdx = raw.indexOf('{');
  const endIdx   = raw.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1) {
    try {
      return JSON.parse(raw.slice(startIdx, endIdx + 1));
    } catch (_) {}
  }

  // Fallback: build a minimal error object so UI doesn't break
  return {
    verified_facts          : [],
    missing_information     : ['Could not parse AI response as structured JSON. Raw response stored below.'],
    low_confidence_inferences: [],
    test_scenarios          : [],
    test_cases              : [],
    traceability_matrix     : [],
    automation_candidates   : [],
    risk_areas              : [{
      area       : 'Parse Error',
      risk_level : 'High',
      description: 'AI returned unstructured response. Retry or check model capabilities.',
      mitigation : 'Use a model with better JSON adherence (e.g. llama3.1 or mistral).',
      icon       : '🔴'
    }],
    self_validation: {
      no_hallucinated_fields: false,
      no_invented_apis: false,
      no_invented_workflows: false,
      no_fabricated_validations: false,
      no_duplicate_scenarios: false,
      all_scenarios_mapped: false,
      missing_info_identified: true,
      notes: 'Parse error — raw AI output: ' + raw.slice(0, 500) + '…'
    }
  };
}

// ───────────────────────────────────────────────────────────────
// 8. MAIN GENERATE FUNCTION
// ───────────────────────────────────────────────────────────────

async function generate() {
  if (STATE.isProcessing) return;

  const userPrompt = buildUserPrompt();
  if (!userPrompt) {
    showToast('⚠️ Please upload at least one file or add context notes.', 'error');
    return;
  }

  const framework    = document.getElementById('framework-select').value;
  const systemPrompt = buildSystemPrompt(framework);
  const contextText  = document.getElementById('context-input').value.trim();

  STATE.isProcessing = true;
  setGeneratingState(true);
  addChatMsg('user', `📎 ${STATE.files.length} file(s) | ${contextText || 'No additional context'}`);

  const steps = [
    'Ingesting uploaded files and context…',
    'Applying Anti-Hallucination protocol…',
    'Extracting verified facts…',
    'Engineering test scenarios…',
    'Generating test cases…',
    'Building traceability matrix…',
    'Identifying automation candidates…',
    'Performing self-validation check…',
    'Finalizing output…'
  ];

  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    if (stepIdx < steps.length) {
      document.getElementById('gen-step').textContent = steps[stepIdx++];
    }
  }, 2800);

  try {
    const raw    = await callOllama(systemPrompt, userPrompt);
    const parsed = parseAIResponse(raw);
    STATE.lastOutput = parsed;

    clearInterval(stepInterval);
    renderOutput(parsed);

    const tcCount  = (parsed.test_cases  || []).length;
    const scCount  = (parsed.test_scenarios || []).length;
    addChatMsg('ai', `✅ Generated **${scCount} scenarios** and **${tcCount} test cases** with traceability matrix.`);
    showToast(`✅ Generated ${scCount} scenarios · ${tcCount} test cases`, 'success');

  } catch (err) {
    clearInterval(stepInterval);
    addChatMsg('ai', `❌ **Error**: ${err.message}`);
    showToast('❌ ' + err.message, 'error');
    setGeneratingState(false, true);
  } finally {
    STATE.isProcessing = false;
    setGeneratingState(false);
  }
}

// ───────────────────────────────────────────────────────────────
// 9. OUTPUT RENDERING
// ───────────────────────────────────────────────────────────────

function renderOutput(data) {
  hideEmpty();

  const scenarios  = data.test_scenarios        || [];
  const testcases  = data.test_cases            || [];
  const traces     = data.traceability_matrix   || [];
  const autos      = data.automation_candidates || [];
  const risks      = data.risk_areas            || [];

  updateBadges(scenarios.length, testcases.length, risks.length, autos.length);

  renderOverview(data);
  renderScenarios(scenarios);
  renderTestCases(testcases);
  renderTraceability(traces);
  renderRisks(risks);
  renderAutomation(autos);

  switchTab('overview');
}

function updateBadges(sc, tc, ri, au) {
  setText('tb-scenarios', sc);
  setText('tb-testcases', tc);
  setText('tb-risks',     ri);
  setText('tb-auto',      au);
  setText('sb-scenarios', sc);
  setText('sb-testcases', tc);
  setText('sb-risks',     ri);
  setText('sb-auto',      au);
  setText('sb-total', sc + tc);
  setText('scenarios-count', sc);
  setText('testcases-count', tc);
  setText('risks-count',     ri);
  setText('auto-count',      au);
}

// ── OVERVIEW ──
function renderOverview(data) {
  const scenarios = data.test_scenarios        || [];
  const testcases = data.test_cases            || [];
  const autos     = data.automation_candidates || [];
  const risks     = data.risk_areas            || [];

  const autoCount   = testcases.filter(t => t.automation_feasibility === 'Yes').length;
  const critCount   = testcases.filter(t => t.priority === 'Critical').length;
  const negCount    = testcases.filter(t => t.tc_type  === 'Negative').length;
  const covPct      = testcases.length
    ? Math.round((testcases.filter(t => t.confidence === 'High').length / testcases.length) * 100)
    : 0;

  // Stats
  const statsGrid = document.getElementById('stats-grid');
  statsGrid.innerHTML = [
    { v: scenarios.length, l: 'Test Scenarios'        },
    { v: testcases.length, l: 'Test Cases'             },
    { v: autoCount,        l: 'Auto Candidates'        },
    { v: autos.length,     l: 'Automation Suites'      },
    { v: critCount,        l: 'Critical Priority'      },
    { v: negCount,         l: 'Negative Tests'         },
    { v: risks.length,     l: 'Risk Areas'             },
    { v: covPct + '%',     l: 'High-Confidence Cases'  },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-value">${s.v}</div>
      <div class="stat-label">${s.l}</div>
    </div>
  `).join('');

  // Info blocks
  const infoBlocks = document.getElementById('info-blocks');
  infoBlocks.innerHTML = '';

  if ((data.verified_facts || []).length) {
    infoBlocks.innerHTML += infoBlock('verified', '✅ Verified Facts', data.verified_facts);
  }
  if ((data.missing_information || []).length) {
    infoBlocks.innerHTML += infoBlock('missing', '❌ Missing / Unknown Information', data.missing_information);
  }
  if ((data.low_confidence_inferences || []).length) {
    infoBlocks.innerHTML += infoBlock('inferred', '⚠️ Low Confidence Inferences', data.low_confidence_inferences);
  }

  // Self-validation
  const sv = data.self_validation || {};
  const checks = [
    { key: 'no_hallucinated_fields',     label: 'No hallucinated fields'     },
    { key: 'no_invented_apis',           label: 'No invented APIs'           },
    { key: 'no_invented_workflows',      label: 'No invented workflows'      },
    { key: 'no_fabricated_validations',  label: 'No fabricated validations'  },
    { key: 'no_duplicate_scenarios',     label: 'No duplicate scenarios'     },
    { key: 'all_scenarios_mapped',       label: 'All scenarios mapped'       },
    { key: 'missing_info_identified',    label: 'Missing info identified'    },
  ];

  document.getElementById('validation-result').innerHTML = `
    <div class="validation-box">
      <h3>🔍 Self-Validation Check</h3>
      <div class="validation-checks">
        ${checks.map(c => `
          <div class="check-item">
            <span class="check-icon">${sv[c.key] ? '✅' : '❌'}</span>
            <span style="font-size:0.8rem;color:${sv[c.key] ? 'var(--clr-green)' : 'var(--clr-red)'}">
              ${c.label}
            </span>
          </div>
        `).join('')}
        ${sv.notes ? `<p style="font-size:0.75rem;color:var(--clr-text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--clr-border)">${escHTML(sv.notes)}</p>` : ''}
      </div>
    </div>
  `;
}

function infoBlock(cls, title, items) {
  return `
    <div class="info-block ${cls}">
      <h3>${title}</h3>
      <ul>${(items||[]).map(i => `<li>${escHTML(i)}</li>`).join('')}</ul>
    </div>
  `;
}

// ── SCENARIOS ──
function renderScenarios(scenarios) {
  const list = document.getElementById('scenarios-list');
  if (!scenarios.length) {
    list.innerHTML = emptyMsg('No test scenarios generated.');
    return;
  }

  list.innerHTML = scenarios.map((s, i) => `
    <div class="scenario-card" id="sc-${i}">
      <div class="scenario-header" onclick="toggleCard('sc-${i}')">
        <span class="scenario-id">${escHTML(s.scenario_id || 'TS_?')}</span>
        <span class="scenario-name">${escHTML(s.scenario_name || 'Unnamed Scenario')}</span>
        ${priorityBadge(s.priority)}
        ${confBadge(s.confidence)}
        ${riskBadge(s.risk_level)}
        ${autoBadge(s.automation_candidate)}
        <span style="color:var(--clr-text-muted);font-size:0.8rem;margin-left:auto">▼</span>
      </div>
      <div class="scenario-body">
        <div class="field-grid">
          <div class="field-item">
            <span class="field-label">Module</span>
            <span class="field-value">${escHTML(s.module || '—')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Confidence Reason</span>
            <span class="field-value">${escHTML(s.confidence_reason || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Preconditions</span>
            <span class="field-value">${escHTML(s.preconditions || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Test Data</span>
            <span class="field-value">${escHTML(s.test_data || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Steps</span>
            <ol class="steps-list">
              ${(s.steps||[]).map((step, si) => `
                <li><span class="step-num-badge">${si+1}</span><span>${escHTML(step)}</span></li>
              `).join('')}
            </ol>
          </div>
          <div class="field-item full">
            <span class="field-label">Expected Result</span>
            <span class="field-value">${escHTML(s.expected_result || '—')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Requirement Reference</span>
            <span class="field-value mono">${escHTML(s.requirement_reference || '—')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Evidence Source</span>
            <span class="field-value">${escHTML(s.evidence_source || '—')}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ── TEST CASES ──
function renderTestCases(testcases) {
  const list = document.getElementById('testcases-list');
  if (!testcases.length) {
    list.innerHTML = emptyMsg('No test cases generated.');
    return;
  }

  list.innerHTML = testcases.map((t, i) => `
    <div class="tc-card" id="tc-${i}">
      <div class="tc-header" onclick="toggleCard('tc-${i}')">
        <span class="tc-id">${escHTML(t.tc_id || 'TC_?')}</span>
        <span class="tc-title">${escHTML(t.title || 'Untitled Test Case')}</span>
        ${tcTypeBadge(t.tc_type)}
        ${priorityBadge(t.priority)}
        ${confBadge(t.confidence)}
        ${autoBadge(t.automation_feasibility)}
        <span style="color:var(--clr-text-muted);font-size:0.8rem;margin-left:auto">▼</span>
      </div>
      <div class="tc-body">
        <button class="copy-btn" onclick="copyTC(${i})">Copy</button>
        <div class="field-grid">
          <div class="field-item">
            <span class="field-label">Scenario ID</span>
            <span class="field-value mono">${escHTML(t.scenario_id || '—')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Module</span>
            <span class="field-value">${escHTML(t.module || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Objective</span>
            <span class="field-value">${escHTML(t.objective || '—')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Environment</span>
            <span class="field-value">${escHTML(t.environment || '—')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Dependencies</span>
            <span class="field-value">${escHTML(t.dependencies || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Preconditions</span>
            <span class="field-value">${escHTML(t.preconditions || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Test Data</span>
            <span class="field-value">${escHTML(t.test_data || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Execution Steps</span>
            <ol class="steps-list">
              ${(t.execution_steps||[]).map((step, si) => `
                <li><span class="step-num-badge">${si+1}</span><span>${escHTML(step)}</span></li>
              `).join('')}
            </ol>
          </div>
          <div class="field-item full">
            <span class="field-label">Expected Result</span>
            <span class="field-value" style="color:var(--clr-green)">${escHTML(t.expected_result || '—')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Actual Result</span>
            <span class="field-value" style="color:var(--clr-text-muted)">${escHTML(t.actual_result || 'To be executed')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Status</span>
            <span class="field-value">${escHTML(t.status || 'Not Run')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Requirement Mapping</span>
            <span class="field-value mono">${escHTML(t.requirement_mapping || '—')}</span>
          </div>
          <div class="field-item">
            <span class="field-label">Regression Impact</span>
            <span class="field-value">${escHTML(t.regression_impact || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Source Evidence</span>
            <span class="field-value">${escHTML(t.source_evidence || '—')}</span>
          </div>
          <div class="field-item full">
            <span class="field-label">Risk Category</span>
            <span class="field-value">${escHTML(t.risk_category || '—')}</span>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// ── TRACEABILITY ──
function renderTraceability(traces) {
  const tbody = document.getElementById('trace-tbody');
  if (!traces.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--clr-text-muted);padding:32px;">No traceability data generated.</td></tr>`;
    return;
  }

  tbody.innerHTML = traces.map(t => `
    <tr>
      <td class="mono">${escHTML(t.requirement_ref || '—')}</td>
      <td>${escHTML(t.source || '—')}</td>
      <td class="mono">${escHTML(t.scenario_id || '—')}</td>
      <td>${(t.test_case_ids||[]).map(id => `<span class="mono" style="display:inline-block;margin:1px 2px;padding:1px 6px;background:var(--clr-bg-card);border:1px solid var(--clr-border);border-radius:4px;font-size:0.68rem">${escHTML(id)}</span>`).join('')}</td>
      <td>${priorityBadge(t.priority)}</td>
      <td>${coverageBadge(t.coverage)}</td>
      <td>${autoBadge(t.automation)}</td>
    </tr>
  `).join('');
}

// ── RISKS ──
function renderRisks(risks) {
  const list = document.getElementById('risks-list');
  if (!risks.length) {
    list.innerHTML = emptyMsg('No risk areas identified.');
    return;
  }

  list.innerHTML = risks.map(r => `
    <div class="risk-item">
      <div class="risk-icon">${r.icon || (r.risk_level === 'High' ? '🔴' : r.risk_level === 'Medium' ? '🟠' : '🟡')}</div>
      <div class="risk-content">
        <h4>${escHTML(r.area)} ${riskBadge(r.risk_level)}</h4>
        <p>${escHTML(r.description || '—')}</p>
        ${r.mitigation ? `<p style="margin-top:6px;color:var(--clr-green);font-size:0.75rem">💡 ${escHTML(r.mitigation)}</p>` : ''}
      </div>
    </div>
  `).join('');
}

// ── AUTOMATION ──
function renderAutomation(autos) {
  const list = document.getElementById('auto-list');
  if (!autos.length) {
    list.innerHTML = emptyMsg('No automation candidates identified.');
    return;
  }

  list.innerHTML = autos.map(a => `
    <div class="auto-item">
      <div class="auto-bar"></div>
      <div class="auto-content">
        <h4>${escHTML(a.name)} <span class="badge auto-yes">${escHTML(a.type || 'Automation')}</span></h4>
        <p>${escHTML(a.reason || '—')}</p>
        <p style="margin-top:4px;font-size:0.75rem;color:var(--clr-text-muted)">
          Framework: <strong style="color:var(--clr-accent)">${escHTML(a.framework || '—')}</strong>
          &nbsp;·&nbsp; Scenarios: ${(a.scenario_ids||[]).join(', ')}
        </p>
        <div class="auto-tags">
          ${(a.tags||[]).map(tag => `<span class="badge medium">${escHTML(tag)}</span>`).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

// ───────────────────────────────────────────────────────────────
// 10. BADGE HELPERS
// ───────────────────────────────────────────────────────────────

function priorityBadge(p) {
  const cls = { Critical:'critical', High:'high', Medium:'medium', Low:'low' }[p] || 'low';
  return p ? `<span class="badge ${cls}">${p}</span>` : '';
}

function confBadge(c) {
  const cls = { High:'conf-high', Medium:'conf-medium', Low:'conf-low' }[c] || '';
  return c ? `<span class="badge ${cls}" title="Confidence: ${c}">⬡ ${c}</span>` : '';
}

function autoBadge(a) {
  const map = { Yes:'auto-yes', No:'auto-no', Partial:'auto-part' };
  const cls = map[a] || 'auto-no';
  return a ? `<span class="badge ${cls}">🤖 ${a}</span>` : '';
}

function riskBadge(r) {
  const cls = { High:'risk-high', Medium:'risk-med', Low:'risk-low' }[r] || '';
  return r ? `<span class="badge ${cls}">⚠ ${r}</span>` : '';
}

function tcTypeBadge(t) {
  const colors = {
    Positive:'medium', Negative:'critical', Boundary:'high',
    Security:'critical', UI:'medium', API:'medium',
    Accessibility:'low', Integration:'high', Performance:'high'
  };
  const cls = colors[t] || 'medium';
  return t ? `<span class="badge ${cls}">${t}</span>` : '';
}

function coverageBadge(c) {
  if (c === 'Full')    return `<span class="badge conf-high">Full</span>`;
  if (c === 'Partial') return `<span class="badge conf-medium">Partial</span>`;
  return `<span class="badge conf-low">${c || 'None'}</span>`;
}

// ───────────────────────────────────────────────────────────────
// 11. TAB SWITCHING
// ───────────────────────────────────────────────────────────────

function switchTab(tab) {
  STATE.currentTab = tab;

  // Update tab buttons
  document.querySelectorAll('.out-tab').forEach(btn => {
    btn.classList.toggle('active', btn.id === `tab-${tab}`);
  });

  // Update panels
  document.querySelectorAll('.output-panel').forEach(p => {
    p.classList.toggle('active', p.id === `panel-${tab}`);
  });

  // Scroll top
  document.getElementById('output-content').scrollTop = 0;
}

function showView(view) {
  STATE.currentView = view;
  document.querySelectorAll('.sidebar-btn[id^="nav-"]').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`nav-${view}`);
  if (btn) btn.classList.add('active');
}

// ───────────────────────────────────────────────────────────────
// 12. CARD TOGGLE
// ───────────────────────────────────────────────────────────────

function toggleCard(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('expanded');
}

// ───────────────────────────────────────────────────────────────
// 13. SEARCH & FILTER
// ───────────────────────────────────────────────────────────────

function filterContent(query) {
  const q       = (query || '').toLowerCase();
  const pFilter = document.getElementById('priority-filter').value.toLowerCase();
  const aFilter = document.getElementById('auto-filter').value.toLowerCase();

  // Filter scenario cards
  document.querySelectorAll('.scenario-card').forEach(card => {
    const text = card.innerText.toLowerCase();
    const pMatch = !pFilter || text.includes(pFilter);
    const aMatch = !aFilter || (aFilter === 'yes' && text.includes('auto-yes')) ||
                               (aFilter === 'no'  && text.includes('auto-no'));
    card.style.display = ((!q || text.includes(q)) && pMatch && aMatch) ? '' : 'none';
  });

  // Filter test case cards
  document.querySelectorAll('.tc-card').forEach(card => {
    const text = card.innerText.toLowerCase();
    const pMatch = !pFilter || text.includes(pFilter);
    const aMatch = !aFilter || (aFilter === 'yes' && text.includes('auto-yes')) ||
                               (aFilter === 'no'  && text.includes('auto-no'));
    card.style.display = ((!q || text.includes(q)) && pMatch && aMatch) ? '' : 'none';
  });
}

// ───────────────────────────────────────────────────────────────
// 14. EXPORT ENGINE
// ───────────────────────────────────────────────────────────────

function exportCSV() {
  if (!STATE.lastOutput) { showToast('No data to export. Generate first.', 'error'); return; }

  const tcs = STATE.lastOutput.test_cases || [];
  if (!tcs.length) { showToast('No test cases to export.', 'error'); return; }

  const headers = [
    'TC ID','Scenario ID','Title','Objective','Module','Type','Priority',
    'Environment','Preconditions','Dependencies','Test Data',
    'Execution Steps','Expected Result','Actual Result','Status',
    'Requirement Mapping','Source Evidence','Automation Feasibility',
    'Regression Impact','Risk Category','Confidence'
  ];

  const rows = tcs.map(t => [
    t.tc_id, t.scenario_id, t.title, t.objective, t.module, t.tc_type, t.priority,
    t.environment, t.preconditions, t.dependencies, t.test_data,
    (t.execution_steps||[]).join(' | '), t.expected_result, t.actual_result, t.status,
    t.requirement_mapping, t.source_evidence, t.automation_feasibility,
    t.regression_impact, t.risk_category, t.confidence
  ].map(v => `"${String(v||'').replace(/"/g,'""')}"`));

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  download('test_cases.csv', csv, 'text/csv');
  showToast('✅ CSV exported successfully', 'success');
}

function exportJSON() {
  if (!STATE.lastOutput) { showToast('No data to export. Generate first.', 'error'); return; }
  download('qa_output.json', JSON.stringify(STATE.lastOutput, null, 2), 'application/json');
  showToast('✅ JSON exported successfully', 'success');
}

function exportHTML() {
  if (!STATE.lastOutput) { showToast('No data to export. Generate first.', 'error'); return; }

  const d = STATE.lastOutput;
  const tcs = d.test_cases || [];
  const scs = d.test_scenarios || [];

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>QA Test Report</title>
<style>
  body { font-family: Arial, sans-serif; background: #f5f5f5; color: #333; padding: 24px; }
  h1 { color: #5c6bc0; } h2 { color: #333; border-bottom: 2px solid #5c6bc0; padding-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
  th { background: #5c6bc0; color: white; padding: 8px 12px; text-align: left; }
  td { padding: 8px 12px; border: 1px solid #ddd; vertical-align: top; }
  tr:nth-child(even) td { background: #f9f9f9; }
  .badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:bold; }
  .Critical { background:#fde8e8; color:#c0392b; } .High { background:#fef3e2; color:#d97706; }
  .Medium { background:#eef2ff; color:#5c6bc0; } .Low { background:#e8f5e9; color:#27ae60; }
  .fact { background:#e8f5e9; padding:6px 10px; border-left:3px solid #27ae60; margin:4px 0; }
  .missing { background:#fde8e8; padding:6px 10px; border-left:3px solid #c0392b; margin:4px 0; }
  .inferred { background:#fef3e2; padding:6px 10px; border-left:3px solid #d97706; margin:4px 0; }
</style>
</head>
<body>
<h1>🧪 Enterprise QA Test Report</h1>
<p>Generated: ${new Date().toLocaleString()}</p>

<h2>Summary</h2>
<p>Scenarios: ${scs.length} &nbsp;|&nbsp; Test Cases: ${tcs.length} &nbsp;|&nbsp; Risk Areas: ${(d.risk_areas||[]).length}</p>

<h2>Verified Facts</h2>
${(d.verified_facts||[]).map(f => `<div class="fact">✅ ${f}</div>`).join('')}

<h2>Missing Information</h2>
${(d.missing_information||[]).map(f => `<div class="missing">❌ ${f}</div>`).join('')}

<h2>Test Scenarios</h2>
<table>
  <tr><th>ID</th><th>Name</th><th>Module</th><th>Priority</th><th>Expected Result</th><th>Automation</th></tr>
  ${scs.map(s => `<tr>
    <td>${s.scenario_id||''}</td><td>${s.scenario_name||''}</td>
    <td>${s.module||''}</td>
    <td><span class="badge ${s.priority||''}">${s.priority||''}</span></td>
    <td>${s.expected_result||''}</td>
    <td>${s.automation_candidate||''}</td>
  </tr>`).join('')}
</table>

<h2>Test Cases</h2>
<table>
  <tr><th>TC ID</th><th>Title</th><th>Type</th><th>Priority</th><th>Steps</th><th>Expected Result</th><th>Status</th></tr>
  ${tcs.map(t => `<tr>
    <td>${t.tc_id||''}</td><td>${t.title||''}</td>
    <td>${t.tc_type||''}</td>
    <td><span class="badge ${t.priority||''}">${t.priority||''}</span></td>
    <td>${(t.execution_steps||[]).map((s,i)=>`${i+1}. ${s}`).join('<br>')}</td>
    <td>${t.expected_result||''}</td>
    <td>${t.status||'Not Run'}</td>
  </tr>`).join('')}
</table>

<h2>Requirement Traceability Matrix</h2>
<table>
  <tr><th>Requirement Ref</th><th>Source</th><th>Scenario ID</th><th>Test Case IDs</th><th>Coverage</th></tr>
  ${(d.traceability_matrix||[]).map(t => `<tr>
    <td>${t.requirement_ref||''}</td><td>${t.source||''}</td>
    <td>${t.scenario_id||''}</td><td>${(t.test_case_ids||[]).join(', ')}</td>
    <td>${t.coverage||''}</td>
  </tr>`).join('')}
</table>
</body>
</html>`;

  download('qa_report.html', html, 'text/html');
  showToast('✅ HTML report exported', 'success');
}

function exportTXT() {
  if (!STATE.lastOutput) { showToast('No data to export. Generate first.', 'error'); return; }

  const d  = STATE.lastOutput;
  const lines = [
    '='.repeat(70),
    'ENTERPRISE QA TEST REPORT',
    `Generated: ${new Date().toLocaleString()}`,
    '='.repeat(70),
    '',
    '--- VERIFIED FACTS ---',
    ...(d.verified_facts||[]).map(f => '✓ ' + f),
    '',
    '--- MISSING INFORMATION ---',
    ...(d.missing_information||[]).map(f => '✗ ' + f),
    '',
    '--- LOW CONFIDENCE INFERENCES ---',
    ...(d.low_confidence_inferences||[]).map(f => '~ ' + f),
    '',
    '='.repeat(70),
    'TEST SCENARIOS',
    '='.repeat(70),
    ...(d.test_scenarios||[]).flatMap(s => [
      '',
      `[${s.scenario_id}] ${s.scenario_name}`,
      `Module: ${s.module} | Priority: ${s.priority} | Risk: ${s.risk_level} | Automation: ${s.automation_candidate}`,
      `Preconditions: ${s.preconditions}`,
      `Test Data: ${s.test_data}`,
      'Steps:',
      ...(s.steps||[]).map((st, i) => `  ${i+1}. ${st}`),
      `Expected: ${s.expected_result}`,
      `Requirement: ${s.requirement_reference}`,
      `Evidence: ${s.evidence_source}`,
      `Confidence: ${s.confidence} — ${s.confidence_reason}`,
    ]),
    '',
    '='.repeat(70),
    'TEST CASES',
    '='.repeat(70),
    ...(d.test_cases||[]).flatMap(t => [
      '',
      `[${t.tc_id}] ${t.title}`,
      `Scenario: ${t.scenario_id} | Type: ${t.tc_type} | Priority: ${t.priority} | Automation: ${t.automation_feasibility}`,
      `Module: ${t.module} | Environment: ${t.environment}`,
      `Objective: ${t.objective}`,
      `Preconditions: ${t.preconditions}`,
      `Dependencies: ${t.dependencies}`,
      `Test Data: ${t.test_data}`,
      'Execution Steps:',
      ...(t.execution_steps||[]).map((s,i) => `  ${i+1}. ${s}`),
      `Expected Result: ${t.expected_result}`,
      `Actual Result: ${t.actual_result}`,
      `Status: ${t.status}`,
      `Requirement: ${t.requirement_mapping}`,
      `Source: ${t.source_evidence}`,
      `Regression Impact: ${t.regression_impact} | Risk: ${t.risk_category}`,
    ]),
    '',
    '='.repeat(70),
    'RISK AREAS',
    '='.repeat(70),
    ...(d.risk_areas||[]).flatMap(r => [
      '',
      `${r.icon||'⚠'} ${r.area} [${r.risk_level}]`,
      `Description: ${r.description}`,
      `Mitigation: ${r.mitigation}`,
    ]),
    '',
    '='.repeat(70),
    'AUTOMATION CANDIDATES',
    '='.repeat(70),
    ...(d.automation_candidates||[]).flatMap(a => [
      '',
      `${a.name} [${a.type}]`,
      `Framework: ${a.framework}`,
      `Reason: ${a.reason}`,
      `Scenarios: ${(a.scenario_ids||[]).join(', ')}`,
      `Tags: ${(a.tags||[]).join(', ')}`,
    ]),
  ];

  download('qa_report.txt', lines.join('\n'), 'text/plain');
  showToast('✅ TXT report exported', 'success');
}

function download(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ───────────────────────────────────────────────────────────────
// 15. COPY INDIVIDUAL TEST CASE
// ───────────────────────────────────────────────────────────────

function copyTC(idx) {
  if (!STATE.lastOutput) return;
  const t    = (STATE.lastOutput.test_cases || [])[idx];
  if (!t) return;

  const text = [
    `TC ID: ${t.tc_id}`,
    `Title: ${t.title}`,
    `Type: ${t.tc_type} | Priority: ${t.priority}`,
    `Objective: ${t.objective}`,
    `Preconditions: ${t.preconditions}`,
    `Test Data: ${t.test_data}`,
    `Steps:\n${(t.execution_steps||[]).map((s,i) => `  ${i+1}. ${s}`).join('\n')}`,
    `Expected Result: ${t.expected_result}`,
    `Automation: ${t.automation_feasibility}`,
  ].join('\n');

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.querySelector(`#tc-${idx} .copy-btn`);
    if (btn) {
      btn.textContent = '✅ Copied!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    }
  });
}

// ───────────────────────────────────────────────────────────────
// 16. UI STATE HELPERS
// ───────────────────────────────────────────────────────────────

function setGeneratingState(on, error = false) {
  const genBtn = document.getElementById('generate-btn');
  const empty  = document.getElementById('empty-state');
  const genSt  = document.getElementById('generating-state');

  genBtn.classList.toggle('loading', on);
  genBtn.disabled = on;

  if (on) {
    empty.style.display  = 'none';
    genSt.style.display  = 'flex';
    document.getElementById('gen-status').textContent = 'Connecting to Ollama…';
    document.getElementById('gen-step').textContent   = 'Applying Anti-Hallucination protocol';

    // Hide all panels
    document.querySelectorAll('.output-panel').forEach(p => p.classList.remove('active'));

  } else {
    genSt.style.display = 'none';

    if (error) {
      empty.style.display = 'flex';
    } else if (STATE.lastOutput) {
      // Show the overview panel
      document.getElementById('panel-overview').classList.add('active');
    }
  }
}

function hideEmpty() {
  document.getElementById('empty-state').style.display  = 'none';
  document.getElementById('generating-state').style.display = 'none';
}

function addChatMsg(role, text) {
  const history = document.getElementById('chat-history');
  const el      = document.createElement('div');
  el.className  = `chat-msg ${role}`;
  el.innerHTML  = marked ? marked.parse(text) : text;
  history.appendChild(el);
  history.scrollTop = history.scrollHeight;
}

function emptyMsg(msg) {
  return `<p style="color:var(--clr-text-muted);font-size:0.82rem;text-align:center;padding:32px;">${msg}</p>`;
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHTML(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ───────────────────────────────────────────────────────────────
// 17. TOAST
// ───────────────────────────────────────────────────────────────

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ───────────────────────────────────────────────────────────────
// 18. CONNECTIVITY CHECK & DYNAMIC HOST CONFIGURATION
// ───────────────────────────────────────────────────────────────

function updateApiUrl(val) {
  let host = val.trim();
  if (host && !host.startsWith('http://') && !host.startsWith('https://')) {
    host = 'http://' + host;
  }
  if (host.endsWith('/')) {
    host = host.slice(0, -1);
  }
  ollamaHost = host;
  localStorage.setItem('ollama_host', host);
  const hostInput = document.getElementById('api-url-input');
  if (hostInput) hostInput.value = host;
  checkConnectivity();
  showToast(`API Host updated to: ${host}`, 'success');
}

async function checkConnectivity() {
  const pill    = document.getElementById('status-pill');
  const statusT = document.getElementById('status-text');

  try {
    const ctrl = new AbortController();
    const id   = setTimeout(() => ctrl.abort(), 3000);

    await fetch(ollamaHost, {
      method: 'GET', signal: ctrl.signal, mode: 'no-cors'
    });

    clearTimeout(id);
    pill.classList.add('online');
    pill.classList.remove('offline');
    statusT.textContent = 'Ollama Online';

  } catch (e) {
    pill.classList.add('offline');
    pill.classList.remove('online');
    statusT.textContent = 'Ollama Offline';
    showToast(`⚠️ Cannot reach Ollama at ${ollamaHost}. Ensure Ollama is running and OLLAMA_ORIGINS="*" is set.`, 'error');
  }
}

// ───────────────────────────────────────────────────────────────
// 19. INIT
// ───────────────────────────────────────────────────────────────

(function init() {
  const hostInput = document.getElementById('api-url-input');
  if (hostInput) {
    hostInput.value = ollamaHost;
  }

  checkConnectivity();

  // Auto-resize context textarea
  const ctx = document.getElementById('context-input');
  ctx.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 160) + 'px';
  });

  // Ctrl+Enter to generate
  ctx.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); generate(); }
  });

  // Ping Ollama every 30s to update status
  setInterval(checkConnectivity, 30000);

  console.log('[QA Engine] Initialized. Ollama target host:', ollamaHost);
})();
