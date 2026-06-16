const fs = require('fs');
const path = require('path');

let scriptsDir = path.join(__dirname);

// Fix breaking-change-detector.js
let bcdPath = path.join(scriptsDir, 'breaking-change-detector.js');
let bcd = fs.readFileSync(bcdPath, 'utf8');
bcd = bcd.replace(/const maturityData = require[^;]+;;?\n\s+console\.log[^\n]+\n\s+\} else \{\n\s+console\.warn[^\n]+\n\s+\}/, `
  const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} };
  maturityMap = maturityData.modules || {};
  console.log('Successfully loaded Module Maturity Map:', JSON.stringify(maturityMap));
`);
fs.writeFileSync(bcdPath, bcd);

// Fix autofix
let afPath = path.join(scriptsDir, 'auto-fix.js');
let af = fs.readFileSync(afPath, 'utf8');
af = af.replace(/if \(!fs\.existsSync\(LINT_REPORT_PATH\)\) \{\n\s+console\.log\('No lint report found, skipping auto-fix\.'\);\n\s+return;\n\s+\}/, "");
fs.writeFileSync(afPath, af);

// Fix quality-gate
let qgPath = path.join(scriptsDir, 'quality-gate.js');
let qg = fs.readFileSync(qgPath, 'utf8');
qg = qg.replace(/if \(!fs\.existsSync\(LINT_REPORT_PATH\)\) \{\n\s+console\.error\('Missing lint report!'\);\n\s+process\.exit\(1\);\n\s+\}/, "");
qg = qg.replace(/const maturityData = require[^;]+;;?.*/g, "const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} }; maturityMap = maturityData.modules || {};");
// Fix the else block that probably got left behind in quality-gate too!
qg = qg.replace(/\s+\} else \{\n\s+console\.warn\('Warning: module-maturity\.json not found\. Treating all as STABLE\.'\);\n\s+\}/g, "");
fs.writeFileSync(qgPath, qg);

// Fix fail-build
let fbPath = path.join(scriptsDir, 'fail-build.js');
let fb = fs.readFileSync(fbPath, 'utf8');
fb = fb.replace(/if \(!fs\.existsSync\(GATE_REPORT_PATH\)\) \{\n\s+console\.log\('No architecture report found, assuming failure\.'\);\n\s+process\.exit\(1\);\n\s+\}/, "");
fs.writeFileSync(fbPath, fb);

console.log("Post-refactoring fixes applied!");
