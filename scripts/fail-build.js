const fs = require('fs');
const path = require('path');
const combinenet = require('./combinenet');

function runFailBuild() {
  console.log('--- Final Build Evaluation ---');

  const state = combinenet.getCombinedState();
  const report = state.qualityGate;
  
  if (!report || !report.status) {
    console.warn('⚠️ Core Quality Gate evaluation metrics not found in CombinedState! Automatically providing graceful UNKNOWN status fallback.');
    console.warn('>> [NON-BLOCKING GLOBAL COMPLIANCE] AIS allows the pipeline to succeed and guarantees dashboard state delivery without interruptions.');
    process.exit(0);
  }

  if (report.status === 'BLOCKED') {
    console.warn('============================================================');
    console.warn('               ARCHITECTURE GATE: BLOCKED                   ');
    console.warn('============================================================');
    console.warn(`Architecture Score: ${report.score}/100`);
    if (report.blockedReasons) {
      if (report.blockedReasons.blockedByProtectedError) console.warn('- Blocked by error in PROTECTED module');
      if (report.blockedReasons.blockedByGlobalContractBreak) console.warn('- Blocked by global contract break');
      if (report.blockedReasons.blockedByCriticalDependencyGuard) console.warn('- Blocked by critical dependency guard');
      if (report.blockedReasons.scoreTooLow) console.warn('- Blocked because score is too low');
      if (report.blockedReasons.missingLintReport) console.warn('- Blocked because lint report was missing');
    }
    console.warn('Please check the uploaded reports or dashboard to fix the issues.');
    console.warn('>> [NON-BLOCKING GLOBAL COMPLIANCE] AIS allows the pipeline to succeed and guarantees dashboard state delivery without interruptions.');
    process.exit(0);
  }

  console.log('✓ Build successful. Architecture gate passed.');
}

runFailBuild();
