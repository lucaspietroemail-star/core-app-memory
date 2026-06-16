const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const AIS_DIR = path.join(ROOT_DIR, 'ais');
const EXPORT_DIR = path.join(AIS_DIR, 'exports');

if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

function generateSummary() {
  const versionPath = path.join(ROOT_DIR, 'VERSION.json');
  let versionData = { versionName: 'Unknown', versionCode: 0 };
  if (fs.existsSync(versionPath)) {
    try {
      versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    } catch (_) {}
  }

  const combinedState = require('./combinenet').getCombinedState();

  const kpis = combinedState.kpis || { kpis: [] };
  const latestKpi = (kpis.kpis && kpis.kpis.length > 0) ? kpis.kpis[kpis.kpis.length - 1] : {};
  const architectureScore = combinedState.qualityGate?.score ?? latestKpi.architectureScore ?? 100;

  const debtData = combinedState.technicalDebt || { technicalDebt: {} };
  let totalDebt = 0;
  if (debtData.technicalDebt) {
    Object.values(debtData.technicalDebt).forEach(arr => {
      if (Array.isArray(arr)) totalDebt += arr.length;
    });
  }

  const riskData = combinedState.risk || { risks: {} };
  let criticalRisks = 0;
  if (riskData.risks) {
    Object.values(riskData.risks).forEach(r => {
      if (r === 'CRITICAL') criticalRisks++;
    });
  }

  const pCore = combinedState.protectedCore || { modules: [] };
  const protectedModules = pCore.protectedModules || pCore.modules || [];

  const summary = `# Architecture Summary

Version: ${versionData.versionName} (${versionData.versionCode})
Architecture Score: ${architectureScore}%
Technical Debt Items: ${totalDebt}
Critical Risks: ${criticalRisks}

## Protected Core System
${protectedModules.length > 0 ? protectedModules.map(m => '- ' + m).join('\n') : 'No protected modules registered'}

Generated at: ${new Date().toISOString()}
`;

  return summary;
}

function runExporter() {
  console.log('--- Generating AI Context Exports ---');
  const summary = generateSummary();
  fs.writeFileSync(path.join(EXPORT_DIR, 'architecture-summary.md'), summary);
  fs.writeFileSync(path.join(EXPORT_DIR, 'project-status.md'), `# Project Status\n\nSee architecture-summary.md for overall status.\n`);
  fs.writeFileSync(path.join(EXPORT_DIR, 'gemini-context.md'), `# Gemini Context\n\n${summary}`);
  fs.writeFileSync(path.join(EXPORT_DIR, 'chatgpt-context.md'), `# ChatGPT Context\n\n${summary}`);
  console.log('✓ Created AI context files out of AIS memory state.');
}

runExporter();
