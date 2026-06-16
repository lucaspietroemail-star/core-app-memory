const fs = require('fs');

let content = fs.readFileSync('ais/scripts/self-evolution.js', 'utf8');
content = content.replace(/require\('\.\/combinenet'\)\.getCombinedState\(\)\.memory\.adrState/g, "(require('./combinenet').getCombinedState().memory || {}).adrState");
content = content.replace(/require\('\.\/combinenet'\)\.getCombinedState\(\)\.memory\.rules/g, "(require('./combinenet').getCombinedState().memory || {}).rules");
fs.writeFileSync('ais/scripts/self-evolution.js', content);

let c2 = fs.readFileSync('ais/scripts/promote-module.js', 'utf8');
c2 = c2.replace(/require\('\.\/combinenet'\)\.getCombinedState\(\)\.memory\.evolution/g, "(require('./combinenet').getCombinedState().memory || {}).evolution");
c2 = c2.replace(/require\('\.\/combinenet'\)\.getCombinedState\(\)\.memory\.adrState/g, "(require('./combinenet').getCombinedState().memory || {}).adrState");
fs.writeFileSync('ais/scripts/promote-module.js', c2);

let cx = fs.readFileSync('ais/scripts/ai-context-exporter.js', 'utf8');
cx = cx.replace(/const pCore = require\('\.\/combinenet'\)\.getCombinedState\(\)\.protectedCore \|\| \{modules: \[\]\};/, "const pCore = require('./combinenet').getCombinedState().protectedCore || {modules: []};\n  let kpis = require('./combinenet').getCombinedState().kpis || { kpis: [{}] };");
fs.writeFileSync('ais/scripts/ai-context-exporter.js', cx);

console.log("Memory chaining fixed.");
