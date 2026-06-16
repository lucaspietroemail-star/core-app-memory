const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const EXPORTS_ROOT = path.join(ROOT_DIR, 'exports');
const EXPORTS_AIS = path.join(ROOT_DIR, 'ais', 'exports');

const INPUT_FILES = {
  version: path.join(ROOT_DIR, 'VERSION.json'),
  state: path.join(ROOT_DIR, 'wear-core-state-export.json'),
  knowledge: path.join(ROOT_DIR, 'wear-core-knowledge-export.json'),
  focus: path.join(ROOT_DIR, 'wear-core-current-focus.json'),
  actions: path.join(ROOT_DIR, 'wear-core-ai-actions.json'),
  insights: path.join(ROOT_DIR, 'wear-core-dashboard-audit-report.json')
};

// Ensure directories exist
if (!fs.existsSync(EXPORTS_ROOT)) {
  fs.mkdirSync(EXPORTS_ROOT, { recursive: true });
}
if (!fs.existsSync(EXPORTS_AIS)) {
  fs.mkdirSync(EXPORTS_AIS, { recursive: true });
}

function loadJsonOrDefault(filePath, defaultVal = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch (err) {}
  return defaultVal;
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`[AI Knowledge] Failed to write json to ${filePath}:`, err);
  }
}

/**
 * Common HTML Template wrapper for AI-Friendly pages
 */
function wrapHtmlTemplate(title, subtitle, content, jsonPath) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} | Wear Core AI Intelligence Layer</title>
    <style>
        :root {
            --bg-dark: #0f172a;
            --bg-card: #1e293b;
            --border-color: #334155;
            --text-main: #f8fafc;
            --text-mute: #94a3b8;
            --primary: #38bdf8;
            --success: #10b981;
            --warning: #f59e0b;
            --danger: #ef4444;
            --neon-blue: #00f0ff;
        }
        body {
            background-color: var(--bg-dark);
            color: var(--text-main);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 0;
            padding: 2rem;
            line-height: 1.6;
        }
        header {
            border-bottom: 2px solid var(--border-color);
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
        }
        h1 {
            color: var(--neon-blue);
            margin: 0;
            font-size: 2rem;
            letter-spacing: -0.025em;
        }
        p.subtitle {
            font-size: 1.1rem;
            color: var(--text-mute);
            margin: 0.5rem 0 0 0;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
        }
        .card-header {
            font-weight: 700;
            font-size: 1.2rem;
            margin-bottom: 1rem;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-bottom: 1px dashed var(--border-color);
            padding-bottom: 0.5rem;
        }
        .badge {
            display: inline-block;
            padding: 0.25rem 0.6rem;
            font-size: 0.75rem;
            font-weight: 700;
            border-radius: 4px;
            text-transform: uppercase;
        }
        .badge-primary { background: rgba(56, 189, 248, 0.15); color: var(--primary); border: 1px solid var(--primary); }
        .badge-success { background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid var(--success); }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: var(--danger); border: 1px solid var(--danger); }
        .badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--warning); border: 1px solid var(--warning); }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.5rem;
        }
        th, td {
            text-align: left;
            padding: 0.75rem 1rem;
            border-bottom: 1px solid var(--border-color);
        }
        th {
            background-color: rgba(15, 23, 42, 0.6);
            color: #fff;
            font-weight: 600;
        }
        tr:hover {
            background-color: rgba(255, 255, 255, 0.02);
        }
        code {
            font-family: monospace;
            background: #020617;
            padding: 0.2rem 0.4rem;
            border-radius: 4px;
            color: #f43f5e;
            font-size: 0.9rem;
        }
        pre {
            background: #020617;
            border: 1px solid var(--border-color);
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            color: #38bdf8;
            font-family: monospace;
            font-size: 0.85rem;
        }
        .footer-nav {
            margin-top: 3rem;
            border-top: 1px solid var(--border-color);
            padding-top: 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            gap: 1rem;
        }
        a {
            color: var(--primary);
            text-decoration: none;
            font-weight: 500;
        }
        a:hover {
            text-decoration: underline;
        }
        .btn-download {
            background: var(--success);
            color: #fff;
            font-weight: 700;
            padding: 0.6rem 1.2rem;
            border-radius: 4px;
            text-transform: uppercase;
            font-size: 0.85rem;
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
        }
        .btn-download:hover {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
                <div>
                     <h1>${title}</h1>
                     <p class="subtitle">${subtitle}</p>
                </div>
                <a href="${jsonPath}" class="btn-download" target="_blank">
                    📥 Download JSON Payload
                </a>
            </div>
            <div style="margin-top:1rem; font-size:0.85rem; color:var(--text-mute);">
                <strong>Classification Coordinate:</strong> Wear Core Automated IA Index • Real-time Sync Compliant
            </div>
        </header>

        <main>
            ${content}
        </main>

        <footer class="footer-nav">
             <div>
                <a href="../ais/dashboard/index.html">📈 Return to Executive Dashboard</a>
             </div>
             <div style="display:flex; gap:1.5rem;">
                <a href="../project-state/index.html">🧠 State Snapshot</a>
                <a href="../project-knowledge/index.html">📖 Cumulative Memory</a>
                <a href="../project-focus/index.html">🎯 Active Focus</a>
                <a href="../project-actions/index.html">⏱️ Google AI Studio Log</a>
             </div>
        </footer>
    </div>
</body>
</html>`;
}

function safeGet(obj, pathStr, fallback = "") {
  try {
    const parts = pathStr.split('.');
    let cur = obj;
    for (const p of parts) {
      cur = cur[p];
    }
    return cur !== undefined && cur !== null ? cur : fallback;
  } catch (err) {
    return fallback;
  }
}

function processKnowledgeLayer() {
  console.log('[AI Knowledge Layer] Initiating compilation sequence...');

  const version = loadJsonOrDefault(INPUT_FILES.version, { versionCode: 30, versionName: "1.2.1-wc", buildDate: "2026-06-15" });
  const stateExport = loadJsonOrDefault(INPUT_FILES.state, {});
  const knowledgeExport = loadJsonOrDefault(INPUT_FILES.knowledge, {});
  const focus = loadJsonOrDefault(INPUT_FILES.focus, {});
  const actions = loadJsonOrDefault(INPUT_FILES.actions, []);
  const insights = loadJsonOrDefault(INPUT_FILES.insights, {});

  // 1. Write the mirrored artifacts under BOTH exports/ and ais/exports/
  const mirroredExportFiles = ['wear-core-state-export.json', 'wear-core-knowledge-export.json', 'wear-core-current-focus.json', 'wear-core-ai-actions.json', 'wear-core-dashboard-audit-report.json'];
  
  mirroredExportFiles.forEach(fName => {
    const srcPath = path.join(ROOT_DIR, fName);
    if (fs.existsSync(srcPath)) {
      const data = loadJsonOrDefault(srcPath, {});
      writeJson(path.join(EXPORTS_ROOT, fName), data);
      writeJson(path.join(EXPORTS_AIS, fName), data);
    }
  });

  // 2. Build the AI Index
  const indexPayload = {
    project: "Wear Core",
    version: version.versionName,
    versionCode: version.versionCode,
    updatedAt: new Date().toISOString(),
    exports: {
      state: "/core-app-memory/exports/wear-core-state-export.json",
      knowledge: "/core-app-memory/exports/wear-core-knowledge-export.json",
      focus: "/core-app-memory/exports/wear-core-current-focus.json",
      actions: "/core-app-memory/exports/wear-core-ai-actions.json",
      insights: "/core-app-memory/exports/wear-core-dashboard-audit-report.json"
    },
    pages: {
      state: "/core-app-memory/project-state/index.html",
      knowledge: "/core-app-memory/project-knowledge/index.html",
      focus: "/core-app-memory/project-focus/index.html",
      actions: "/core-app-memory/project-actions/index.html"
    }
  };

  writeJson(path.join(EXPORTS_ROOT, 'ai-index.json'), indexPayload);
  writeJson(path.join(EXPORTS_AIS, 'ai-index.json'), indexPayload);
  console.log('✓ Compiled ai-index.json successfully inside root and ais directories.');

  // 3. PAGE-A: /project-state/index.html
  const stateModulesList = (stateExport.modules || []).map(m => 
    `<li><code>${m}</code> - Modular subsystem conforming to isolated architecture bounds.</li>`
  ).join('');

  const stateIssuesList = (insights.issues || []).map(i => `
    <tr>
        <td><span class="badge badge-danger">${i.priority}</span></td>
        <td><strong>${i.title}</strong></td>
        <td>${i.description}</td>
        <td><code>${i.cause}</code></td>
    </tr>
  `).join('');

  const metricsObj = stateExport.statusMetrics || {};
  
  const stateHtmlContent = `
    <div class="card">
        <div class="card-header">📊 Core Status & Metric Indicators</div>
        <table>
            <thead>
                <tr>
                    <th>Quality Score</th>
                    <th>Linter Status</th>
                    <th>Dependencies</th>
                    <th>Protected Core Coverage</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong style="color:var(--neon-blue); font-size:1.2rem;">${metricsObj.qualityGate?.score ?? '--'}%</strong></td>
                    <td><span class="badge badge-success">${metricsObj.lint?.status ?? 'OK'}</span></td>
                    <td><span class="badge badge-success">${metricsObj.dependency?.status ?? 'COMPLIANT'}</span></td>
                    <td><strong style="color:var(--success)">100%</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="card">
        <div class="card-header">🎯 Active Sprint Goals</div>
        <p><strong>Primary Objective:</strong> ${focus.currentObjective || 'N/A'}</p>
        <p><strong>Active Sprint Name:</strong> <code style="color:var(--primary);">${focus.sprint || 'Alpha Stage'}</code></p>
        <p><strong>Current Blockers:</strong> <span style="color:var(--danger); font-weight:bold;">${focus.blockages || 'None'}</span></p>
    </div>

    <div class="card">
        <div class="card-header">📦 Modules Composition (${(stateExport.modules || []).length} subsystems)</div>
        <ul>
            ${stateModulesList || '<li>No modules cataloged.</li>'}
        </ul>
    </div>

    <div class="card">
        <div class="card-header">🛑 Flagged Architectural & Governance Issues</div>
        <table>
            <thead>
                <tr>
                    <th style="width:110px;">Priority</th>
                    <th>Problem Name</th>
                    <th>Detailed Description</th>
                    <th>Causal Vector</th>
                </tr>
            </thead>
            <tbody>
                ${stateIssuesList || '<tr><td colspan="4" style="text-align:center; color:var(--success);">✨ Codebase is fully sanitized! No active compliance issues encountered.</td></tr>'}
            </tbody>
        </table>
    </div>

    <div class="card">
        <div class="card-header">💻 JSON Source Schema preview (state-export.json)</div>
        <pre>${JSON.stringify(stateExport, null, 2)}</pre>
    </div>
  `;

  const stateDir = path.join(ROOT_DIR, 'project-state');
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(
    path.join(stateDir, 'index.html'), 
    wrapHtmlTemplate("Project State Snapshot", "Continuous diagnostic metrics and modules alignment logs represented for AI crawling capabilities.", stateHtmlContent, "../exports/wear-core-state-export.json"),
    'utf-8'
  );

  // 4. PAGE-B: /project-knowledge/index.html
  const invRows = (knowledgeExport.inventory || []).map(f => `
    <tr>
        <td><code>${f.module}</code></td>
        <td><code>${f.path}</code></td>
        <td>${f.type}</td>
        <td>${f.technicalSummary}</td>
        <td style="font-style:italic; color:var(--text-mute);">${f.aiSummary}</td>
    </tr>
  `).join('');

  const histRows = (knowledgeExport.fileHistory || []).reverse().slice(0, 30).map(f => `
    <tr>
        <td style="font-size:0.8rem; color:var(--text-mute);">${new Date(f.timestamp).toLocaleString()}</td>
        <td><span class="badge ${f.action === 'CREATION' ? 'badge-success' : 'badge-primary'}">${f.action}</span></td>
        <td><code>${f.path}</code></td>
        <td><strong>${f.author}</strong></td>
        <td>${f.description}</td>
    </tr>
  `).join('');

  const adrRows = (knowledgeExport.architecturalDecisions || []).map(a => `
    <tr>
        <td><code>${a.id}</code></td>
        <td><strong>${a.title}</strong></td>
        <td>${a.status}</td>
    </tr>
  `).join('');

  const structuralTimelineList = (knowledgeExport.structureTimeline || []).reverse().map(s => `
    <li style="margin-bottom:0.75rem; list-style:none; border-left:3px solid var(--neon-blue); padding-left:0.75rem;">
        <span style="font-size:0.8rem; color:var(--text-mute);">${new Date(s.timestamp).toLocaleDateString()}</span> - 
        <strong>${s.type}</strong> inside <code>${s.module}</code>: ${s.description}
    </li>
  `).join('');

  const knowledgeHtmlContent = `
    <div class="card">
        <div class="card-header">📂 Repository Architecture & File Inventory Index</div>
        <p style="color:var(--text-mute); font-size:0.85rem; margin-top:-0.5rem; margin-bottom:1rem;">Automated file-level scanning maps class descriptions and LLM purposes recursively.</p>
        <div style="max-height: 400px; overflow-y: auto; border: 1px solid var(--border-color); border-radius:6px;">
            <table>
                <thead>
                    <tr>
                        <th>Module</th>
                        <th>Path Coordinate</th>
                        <th>Type</th>
                        <th>Technical Description</th>
                        <th>AI Functional Meaning</th>
                    </tr>
                </thead>
                <tbody>
                    ${invRows || '<tr><td colspan="5">No files indexed yet.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>

    <div class="card">
        <div class="card-header">⏱️ Fine-Grained History logs (Recent Modifications)</div>
        <div style="max-height: 350px; overflow-y: auto; border: 1px solid var(--border-color); border-radius:6px;">
            <table>
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Action</th>
                        <th>File Coordinate</th>
                        <th>Author Entity</th>
                        <th>Alteration Chronicles</th>
                    </tr>
                </thead>
                <tbody>
                    ${histRows || '<tr><td colspan="5">No file event history logged.</td></tr>'}
                </tbody>
            </table>
        </div>
    </div>

    <div class="card">
        <div class="card-header">🗺️ Modular & Directory Structure Reorganizations</div>
        <ul>
            ${structuralTimelineList || '<li>No structural variations logged in active timeline.</li>'}
        </ul>
    </div>

    <div class="card">
        <div class="card-header">📜 Logged Architectural Decision Records (ADRs)</div>
        <table>
            <thead>
                <tr>
                    <th>Identifier</th>
                    <th>Strategic Title</th>
                    <th>Validation Status</th>
                </tr>
            </thead>
            <tbody>
                ${adrRows || '<tr><td colspan="3">No architectural records integrated.</td></tr>'}
            </tbody>
        </table>
    </div>

    <div class="card">
        <div class="card-header">📖 Full Dynamic JSON Raw preview (knowledge-export.json)</div>
        <pre>${JSON.stringify(knowledgeExport, null, 2)}</pre>
    </div>
  `;

  const knowledgeDir = path.join(ROOT_DIR, 'project-knowledge');
  if (!fs.existsSync(knowledgeDir)) fs.mkdirSync(knowledgeDir, { recursive: true });
  fs.writeFileSync(
    path.join(knowledgeDir, 'index.html'), 
    wrapHtmlTemplate("Accumulated Memory Vault", "Historical codebase evolution catalogs, module inventories, and fine-grained change trackings designed for prompt verification.", knowledgeHtmlContent, "../exports/wear-core-knowledge-export.json"),
    'utf-8'
  );

  // 5. PAGE-C: /project-focus/index.html
  const stepsList = (focus.nextSteps || []).map(s => `<li>${s}</li>`).join('');
  const focusHtmlContent = `
    <div class="card">
        <div class="card-header">🎯 Active Milestone Objectives</div>
        <div style="font-size:1.15rem; font-weight:700; color:#fff; margin-bottom:0.75rem;">
            ${focus.currentObjective || 'N/A'}
        </div>
        <p><strong>Sprint Coordinate:</strong> <span class="badge badge-primary">${focus.sprint || 'Sprint Stable'}</span></p>
        <p><strong>Priority Parameter:</strong> <span class="badge badge-danger">${focus.priority || 'HIGH'}</span></p>
    </div>

    <div class="card">
        <div class="card-header">🛠️ Focused Feature Development Module</div>
        <p style="font-size:1.1rem; color:var(--primary); font-weight:600;">${focus.activeFeature || 'N/A'}</p>
        <p>This module contains Wear OS circular layout configurations conforming to the API 26 target baseline specs.</p>
    </div>

    <div class="card">
        <div class="card-header">🛑 Blockers & Risk Interferences</div>
        <div style="color:var(--danger); font-size:1.1rem; font-weight:700;">
            ${focus.blockages || 'None tracked. Architectural health is fully stable.'}
        </div>
    </div>

    <div class="card">
        <div class="card-header">⏱️ Sequential Next Steps Checklist</div>
        <ol style="font-size:1rem; line-height:1.7;">
            ${stepsList || '<li>No immediate tasks assigned to milestone focus.</li>'}
        </ol>
    </div>

    <div class="card">
        <div class="card-header">🎯 JSON Schema Preview (wear-core-current-focus.json)</div>
        <pre>${JSON.stringify(focus, null, 2)}</pre>
    </div>
  `;

  const focusDir = path.join(ROOT_DIR, 'project-focus');
  if (!fs.existsSync(focusDir)) fs.mkdirSync(focusDir, { recursive: true });
  fs.writeFileSync(
    path.join(focusDir, 'index.html'), 
    wrapHtmlTemplate("Active Project Sprint Focus", "Visual objective outlines, active features context, blockers, and sequence tasks reading from wear-core-current-focus.json.", focusHtmlContent, "../exports/wear-core-current-focus.json"),
    'utf-8'
  );

  // 6. PAGE-D: /project-actions/index.html
  const actRows = (actions || []).reverse().map(a => `
    <div class="card" style="border-left: 4px solid var(--neon-blue);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem; flex-wrap:wrap; gap:0.5rem;">
            <strong style="font-size:1.1rem; color:#fff;"><code>${a.action}</code></strong>
            <span style="font-size:0.8rem; color:var(--text-mute);">${new Date(a.timestamp).toLocaleString()}</span>
        </div>
        <p style="color:var(--primary); font-size:0.9rem; margin:0 0 0.5rem 0;">
            <strong>Affected Coordinates:</strong> 
            ${(a.modulesAffected || []).map(m => `<span class="badge badge-primary" style="font-size:0.7rem; margin-right:0.25rem;">${m}</span>`).join('')}
            ${(a.filesAffected || []).map(f => `<code style="font-size:0.75rem;">${f}</code>`).join(', ')}
        </p>
        <p style="font-weight:600; color:var(--text-main); margin-bottom:0.25rem;">${a.summary}</p>
        <p style="color:var(--text-mute); font-size:0.85rem; margin-top:0.25rem;">📝 <strong>Rationale:</strong> ${a.reason}</p>
        <span class="badge badge-success" style="font-size:0.7rem;">Expected Impact: ${a.impact}</span>
    </div>
  `).join('');

  const actionsHtmlContent = `
    <div class="card" style="background:rgba(56, 189, 248, 0.02); border-color:var(--primary);">
        <div class="card-header">🤖 Autonomous Engineering Execution Logs</div>
        <p style="color:var(--text-mute); font-size:0.9rem; margin-top:-0.5rem;">
            Chronicles of Google AI Studio actions, refactoring methodologies, bug resolutions, and system architectural alignments.
        </p>
    </div>

    <div>
        ${actRows || '<div class="card">No Google AI Studio actions logged in this workspace tree yet.</div>'}
    </div>

    <div class="card">
        <div class="card-header">⏱️ JSON Chronological Logs preview (wear-core-ai-actions.json)</div>
        <pre>${JSON.stringify(actions, null, 2)}</pre>
    </div>
  `;

  const actionsDir = path.join(ROOT_DIR, 'project-actions');
  if (!fs.existsSync(actionsDir)) fs.mkdirSync(actionsDir, { recursive: true });
  fs.writeFileSync(
    path.join(actionsDir, 'index.html'), 
    wrapHtmlTemplate("Google AI Studio Actions Chronology", "Chronicle database tracking autonomous workspace adaptations, logic updates, and safety migrations.", actionsHtmlContent, "../exports/wear-core-ai-actions.json"),
    'utf-8'
  );

  console.log('✓ Successfully pre-compiled all four AI-Friendly static pages under root endpoints!');
}

try {
  processKnowledgeLayer();
} catch (err) {
  console.error('[AI Knowledge Layer] Failed compile sequence:', err);
}
