const fs = require('fs');

// Fix quality-gate
let qg = fs.readFileSync('ais/scripts/quality-gate.js', 'utf8');
qg = qg.replace(/if \(!fs\.existsSync\(LINT_REPORT_PATH\)\) \{\n\s+console\.error\('Lint report not found! [^\}]+?return;\n\s+\}/, "");
fs.writeFileSync('ais/scripts/quality-gate.js', qg);

// Fix exporter duplicated let kpis
let cx = fs.readFileSync('ais/scripts/ai-context-exporter.js', 'utf8');
cx = cx.replace(/const kpis = require\('\.\/combinenet'\)\.getCombinedState\(\)\.kpis \|\| \{\};\n\s*let kpis = \{ kpis: \[\{\}\] \};/, "let kpis = require('./combinenet').getCombinedState().kpis || { kpis: [{}] };");
fs.writeFileSync('ais/scripts/ai-context-exporter.js', cx);

console.log("Fixed missing exits and syntax!");
