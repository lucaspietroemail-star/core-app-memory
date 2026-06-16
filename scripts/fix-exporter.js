const fs = require('fs');
const path = require('path');

const p = path.join(__dirname, 'ai-context-exporter.js');
if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Instead of reading the missing JSONs, read from combinenet.
    content = content.replace(/const kpisPath = path\.join[^;]+;/, "const kpis = require('./combinenet').getCombinedState().kpis || {};");
    content = content.replace(/if \(fs\.existsSync\(kpisPath\)\) [^\n]+/, "");
    
    content = content.replace(/const debtPath = path\.join[^;]+;/, "const debtData = require('./combinenet').getCombinedState().technicalDebt || {technicalDebt: {}};");
    content = content.replace(/if \(!fs\.existsSync\(debtPath\)\)[^;]+;/g, "");
    content = content.replace(/const debtData = JSON.parse[^;]+;/, "");
    
    content = content.replace(/const riskPath = path\.join[^;]+;/, "const riskData = require('./combinenet').getCombinedState().risk || {modules: {}};");
    content = content.replace(/if \(!fs\.existsSync\(riskPath\)\)[^;]+;/g, "");
    content = content.replace(/const riskData = JSON.parse[^;]+;/, "");

    content = content.replace(/const pCorePath = path\.join[^;]+;/, "const pCore = require('./combinenet').getCombinedState().protectedCore || {modules: []};");
    content = content.replace(/if \(fs\.existsSync\(pCorePath\)\) [^\n]+/, "");

    fs.writeFileSync(p, content);
}
console.log("ai-context-exporter fixed");
