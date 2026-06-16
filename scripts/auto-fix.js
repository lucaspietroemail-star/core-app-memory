const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const LINT_REPORT_PATH = path.join(ROOT_DIR, 'ais', 'reports', 'lint-report.json');

function runAutoFix() {
  console.log('Running Architectural Auto-Fix System...');

  

  const lintReport = require('./combinenet').getCombinedState().lint;
  const fixesApplied = [];

  // Fix: Missing structural directories
  if (lintReport.structuralViolations) {
    for (const v of lintReport.structuralViolations) {
      if (v.type === 'MISSING_STRUCTURAL_DIRECTORY') {
        const mod = v.module;
        // Search in reports/lint-report.json for the missing folder description or compute path.
        // E.g., folder is 'ui', 'vm', or 'state'. Match it.
        const match = v.message.match(/folder:\s*(\w+)/);
        const folder = match ? match[1] : null;

        if (folder) {
          const modName = mod.replace('feature-', '');
          const targetPath = path.join(
            ROOT_DIR,
            mod,
            'src',
            'main',
            'java',
            'com',
            'example',
            'feature',
            modName,
            folder
          );

          if (!fs.existsSync(targetPath)) {
            fs.mkdirSync(targetPath, { recursive: true });
            fixesApplied.push({
              module: mod,
              action: `Created missing standard directory: ${folder}`,
              path: path.relative(ROOT_DIR, targetPath)
            });
            console.log(`[Auto-Fix] Created missing directory: ${targetPath}`);
          }
        }
      }
    }
  }

  // Write the auto-fix-report.json
  const reportsDir = path.join(ROOT_DIR, 'ais', 'reports');
  const fixReportPath = path.join(reportsDir, 'auto-fix-report.json');
  const fixOutput = {
    timestamp: new Date().toISOString(),
    fixesApplied,
    count: fixesApplied.length
  };

  require('./combinenet').updateSection('autoFix', fixOutput);
  console.log(`Auto-Fix Completed. Applied ${fixesApplied.length} safe structural adjustments.`);
}

runAutoFix();
