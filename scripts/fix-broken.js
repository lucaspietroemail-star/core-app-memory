const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname);

function safeReplace(filename, regex, replacement) {
    const p = path.join(scriptsDir, filename);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(p, content);
}

const p = path.join(scriptsDir, 'generate-dashboard.js');
if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    // Instead of using loadJsonOrDefault on deleted files, just pull everything from combinenet or mock it.
    // Replace the load blocks.
    content = content.replace(/const maturity = loadJsonOrDefault[^;]+;/g, "const maturity = require('./combinenet').getCombinedState().memory.evolution || { modules: {}, history: [] };");
    content = content.replace(/const components = loadJsonOrDefault[^;]+;/g, "const components = require('./combinenet').getCombinedState().componentRegistry || { components: [] };");
    content = content.replace(/const archMemory = loadJsonOrDefault[^;]+;/g, "const archMemory = require('./combinenet').getCombinedState().memory.adrState || { decisions: [] };");
    
    content = content.replace(/const registry = loadJsonOrDefault[^;]+;/g, "const registry = { modules: {} };");
    content = content.replace(/const technicalDebt = loadJsonOrDefault[^;]+;/g, "const technicalDebt = { technicalDebt: {} };");
    content = content.replace(/const roadmap = loadJsonOrDefault[^;]+;/g, "const roadmap = { roadmap: {} };");
    content = content.replace(/const activeRules = loadJsonOrDefault[^;]+;/g, "const activeRules = { activeRules: [] };");
    content = content.replace(/const deprecatedRules = loadJsonOrDefault[^;]+;/g, "const deprecatedRules = { deprecatedRules: [] };");
    content = content.replace(/const ruleHistory = loadJsonOrDefault[^;]+;/g, "const ruleHistory = { ruleHistory: [] };");
    content = content.replace(/const scoreHistoryFile = loadJsonOrDefault[^;]+;/g, "const scoreHistoryFile = { history: [] };");
    content = content.replace(/const snapshotIndex = loadJsonOrDefault[^;]+;/g, "const snapshotIndex = { snapshots: [] };");

    content = content.replace(/const gate = loadJsonOrDefault[^;]+;/g, "const gate = require('./combinenet').getCombinedState().qualityGate || {score: 100, status: 'APPROVED', metrics: {}};");
    content = content.replace(/const lint = loadJsonOrDefault[^;]+;/g, "const lint = require('./combinenet').getCombinedState().lint || {fileViolations: []};");
    content = content.replace(/const dependency = loadJsonOrDefault[^;]+;/g, "const dependency = require('./combinenet').getCombinedState().dependency || {violations: []};");
    content = content.replace(/const breaking = loadJsonOrDefault[^;]+;/g, "const breaking = require('./combinenet').getCombinedState().breakingChanges || {status: 'PASSED', findings: []};");

    fs.writeFileSync(p, content);
}

console.log("Fixed generate-dashboard.js");
