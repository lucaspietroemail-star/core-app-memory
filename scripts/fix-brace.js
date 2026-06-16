const fs = require('fs');
let c = fs.readFileSync('ais/scripts/quality-gate.js', 'utf8');
c = c.replace(/const maturityData = require\('\.\/combinenet'\)\.getCombinedState\(\)\.memory\.evolution \|\| \{ modules: \{\} \}; maturityMap = maturityData\.modules \|\| \{\};\n\s*\}/, "const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} }; maturityMap = maturityData.modules || {};");
fs.writeFileSync('ais/scripts/quality-gate.js', c);
