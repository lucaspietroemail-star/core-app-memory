const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname);

function replaceRead(filename, regex, replacement) {
    const p = path.join(scriptsDir, filename);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(p, content);
    console.log(`Updated reads in ${filename}`);
}

// quality-gate
replaceRead('quality-gate.js', /const lintReport = JSON\.parse\(fs\.readFileSync\(LINT_REPORT_PATH, 'utf-8'\)\);/g, "const lintReport = require('./combinenet').getCombinedState().lint;");
replaceRead('quality-gate.js', /const depReport = JSON\.parse\(fs\.readFileSync\(DEP_REPORT_PATH, 'utf-8'\)\);/g, "const depReport = require('./combinenet').getCombinedState().dependency || {violations: []};");
replaceRead('quality-gate.js', /const breakingReport = JSON\.parse\(fs\.readFileSync\(BREAKING_REPORT_PATH, 'utf-8'\)\);/g, "const breakingReport = require('./combinenet').getCombinedState().breakingChanges || {status: 'PASSED', findings: []};");

// auto-fix
replaceRead('auto-fix.js', /const lintReport = JSON\.parse\(fs\.readFileSync\(LINT_REPORT_PATH, 'utf-8'\)\);/g, "const lintReport = require('./combinenet').getCombinedState().lint;");

// generate-report
replaceRead('generate-report.js', /const gate = JSON\.parse\(fs\.readFileSync\(PATHS\.gate, 'utf-8'\)\);/g, "const gate = require('./combinenet').getCombinedState().qualityGate;");
replaceRead('generate-report.js', /const lint = JSON\.parse\(fs\.readFileSync\(PATHS\.lint, 'utf-8'\)\);/g, "const lint = require('./combinenet').getCombinedState().lint;");
replaceRead('generate-report.js', /const dep = JSON\.parse\(fs\.readFileSync\(PATHS\.dep, 'utf-8'\)\);/g, "const dep = require('./combinenet').getCombinedState().dependency;");
replaceRead('generate-report.js', /const breaking = JSON\.parse\(fs\.readFileSync\(PATHS\.breaking, 'utf-8'\)\);/g, "const breaking = require('./combinenet').getCombinedState().breakingChanges;");
replaceRead('generate-report.js', /const fix = JSON\.parse\(fs\.readFileSync\(PATHS\.fix, 'utf-8'\)\);/g, "const fix = require('./combinenet').getCombinedState().autoFix || {};");

// fail-build
replaceRead('fail-build.js', /const report = JSON\.parse\(fs\.readFileSync\(GATE_REPORT_PATH, 'utf-8'\)\);/g, "const report = require('./combinenet').getCombinedState().qualityGate;");
