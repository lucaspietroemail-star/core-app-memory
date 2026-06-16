const fs = require('fs');
const path = require('path');

const scriptsDir = path.join(__dirname);

function replaceWrite(filename, regex, replacement) {
    const p = path.join(scriptsDir, filename);
    if (!fs.existsSync(p)) return;
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(regex, replacement);
    fs.writeFileSync(p, content);
    console.log(`Updated ${filename}`);
}

// dependency-guard
replaceWrite('dependency-guard.js', /fs\.writeFileSync\(REPORT_PATH, JSON\.stringify\(failReport, null, 2\), 'utf-8'\);/g, "require('./combinenet').updateSection('dependency', failReport);");
replaceWrite('dependency-guard.js', /fs\.writeFileSync\(REPORT_PATH, JSON\.stringify\(summary, null, 2\), 'utf-8'\);/g, "require('./combinenet').updateSection('dependency', summary);");

// quality-gate
replaceWrite('quality-gate.js', /fs\.writeFileSync\(GATE_REPORT_PATH, JSON\.stringify\(gateObj, null, 2\), 'utf-8'\);/g, "require('./combinenet').updateSection('qualityGate', gateObj);");
replaceWrite('quality-gate.js', /fs\.writeFileSync\(GATE_REPORT_PATH, JSON\.stringify\(evaluation, null, 2\), 'utf-8'\);/g, "require('./combinenet').updateSection('qualityGate', evaluation);");

// breaking-change-detector
replaceWrite('breaking-change-detector.js', /fs\.writeFileSync\(REPORT_PATH, JSON\.stringify\(failReport, null, 2\), 'utf-8'\);/g, "require('./combinenet').updateSection('breakingChanges', failReport);");
replaceWrite('breaking-change-detector.js', /fs\.writeFileSync\(REPORT_PATH, JSON\.stringify\(output, null, 2\), 'utf-8'\);/g, "require('./combinenet').updateSection('breakingChanges', output);");

// auto-fix 
replaceWrite('auto-fix.js', /fs\.writeFileSync\(fixReportPath, JSON\.stringify\(fixOutput, null, 2\), 'utf-8'\);/g, "require('./combinenet').updateSection('autoFix', fixOutput);");

// governance-audit
replaceWrite('governance-audit.js', /fs\.writeFileSync\(AUDIT_REPORT_PATH, JSON\.stringify\(auditReport, null, 2\), 'utf-8'\);/g, "require('./combinenet').updateSection('governanceAudit', auditReport);");
