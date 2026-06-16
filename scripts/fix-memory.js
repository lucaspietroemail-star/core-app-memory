const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname);

function replaceWrite(filename, regex, replacement) {
    const p = path.join(scriptsDir, filename);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(p, content);
}

// 1. breaking-change-detector.js
replaceWrite('breaking-change-detector.js', /if \(fs\.existsSync\(MATURITY_PATH\)\) {[\s\S]*?const maturityData[^}]+}/, "const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} };");

// 2. quality-gate.js
replaceWrite('quality-gate.js', /if \(fs\.existsSync\(MATURITY_PATH\)\) {[\s\S]*?const maturityData[^}]+}/, "const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} };");

// 3. governance-audit.js
replaceWrite('governance-audit.js', /const registryData = JSON.parse[^;]+;/, "const registryData = require('./combinenet').getCombinedState().registry || { modules: {} };");
replaceWrite('governance-audit.js', /const debtData = JSON.parse[^;]+;/, "const debtData = require('./combinenet').getCombinedState().technicalDebt || { technicalDebt: {} };");
replaceWrite('governance-audit.js', /const roadmapData = JSON.parse[^;]+;/, "const roadmapData = require('./combinenet').getCombinedState().roadmap || { roadmap: {} };");
replaceWrite('governance-audit.js', /const maturityData = JSON.parse[^;]+;/, "const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} };");
replaceWrite('governance-audit.js', /const blueprintData = JSON.parse[^;]+;/, "const blueprintData = require('./combinenet').getCombinedState().blueprint || { blueprint: {} };");

// 4. self-evolution.js
replaceWrite('self-evolution.js', /if \(!fs.existsSync\(MEMORY_PATH\)\)[^}]+}[^}]+}/, "");
replaceWrite('self-evolution.js', /const memory = JSON.parse[^;]+;/, "let memory = require('./combinenet').getCombinedState().memory.adrState || { decisions: [] };");
replaceWrite('self-evolution.js', /const rules = JSON.parse[^;]+;/, "let rules = require('./combinenet').getCombinedState().memory.rules || { activeRules: [] };");
replaceWrite('self-evolution.js', /const depReport = JSON.parse[^;]+;/, "const depReport = require('./combinenet').getCombinedState().dependency || {violations: []};");
replaceWrite('self-evolution.js', /fs.writeFileSync\(MEMORY_PATH, JSON.stringify\(memory, null, 2\), 'utf-8'\);/, "require('./combinenet').updateSection('memory', { ...require('./combinenet').getCombinedState().memory, adrState: memory });");
replaceWrite('self-evolution.js', /fs.writeFileSync\(RULES_PATH, JSON.stringify\(rules, null, 2\), 'utf-8'\);/, "require('./combinenet').updateSection('memory', { ...require('./combinenet').getCombinedState().memory, rules: rules });");

// 5. promote-module.js
replaceWrite('promote-module.js', /if \(!fs.existsSync\(MATURITY_PATH\)\)[^}]+}/, "");
replaceWrite('promote-module.js', /const maturityData = JSON.parse[^;]+;/, "let maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {}, history: [] };");
replaceWrite('promote-module.js', /fs.writeFileSync\(MATURITY_PATH, JSON.stringify\(maturityData, null, 2\), 'utf-8'\);/, "require('./combinenet').updateSection('memory', { ...require('./combinenet').getCombinedState().memory, evolution: maturityData });");
replaceWrite('promote-module.js', /const memory = JSON.parse[^;]+;/, "let memory = require('./combinenet').getCombinedState().memory.adrState || { decisions: [] };");
replaceWrite('promote-module.js', /fs.writeFileSync\(MEMORY_PATH, JSON.stringify\(memory, null, 2\), 'utf-8'\);/, "require('./combinenet').updateSection('memory', { ...require('./combinenet').getCombinedState().memory, adrState: memory });");

console.log("Memory paths fixed");
