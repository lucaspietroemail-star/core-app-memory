const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const LINT_REPORT_PATH = path.join(ROOT_DIR, 'ais', 'reports', 'lint-report.json');
const DEP_REPORT_PATH = path.join(ROOT_DIR, 'ais', 'reports', 'dependency-report.json');
const BREAKING_REPORT_PATH = path.join(ROOT_DIR, 'ais', 'reports', 'breaking-change-report.json');
const MATURITY_PATH = path.join(ROOT_DIR, 'ais', 'memory', 'module-maturity.json');

const ACTIVE_MODULES = [
  'feature-launcher',
  'feature-drawer',
  'feature-notifications',
  'feature-media',
  'feature-settings',
  'feature-sensors',
  'feature-debug'
];

function getModuleNameFromPath(filePath) {
  if (!filePath) return 'global';
  for (const mod of ACTIVE_MODULES) {
    if (filePath.includes(mod)) {
      return mod;
    }
  }
  // If it's a core/domain/data/ui component, mark as core architecture
  if (filePath.includes('domain/') || filePath.includes('data/') || filePath.includes('core/')) {
    return 'core-architecture';
  }
  return 'global';
}

function runQualityGate() {
  console.log('Running Architecture Quality Gate V2 evaluation...');

  

  const lintReport = require('./combinenet').getCombinedState().lint;
  
  // Load module maturity data
  let maturityMap = {};
  const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} }; maturityMap = maturityData.modules || {};

  let score = 100;
  let totalErrors = 0;
  let totalWarnings = 0;
  
  let blockedByProtectedError = false;
  let blockedByGlobalContractBreak = false;
  let blockedByCriticalDependencyGuard = false;

  let details = [];

  // Helper to process violation impact
  function processViolation(sourcePath, severity, type, message) {
    const mod = getModuleNameFromPath(sourcePath);
    const maturity = maturityMap[mod] || 'STABLE';

    if (maturity === 'LEGACY') {
      // Ignored for error blocks, only small impact on score
      score -= (severity === 'error' ? 2 : 1);
      totalWarnings++;
      details.push({ module: mod, maturity, severity: 'warning', message: `[LEGACY WARNING] ${message}` });
    } else if (maturity === 'MIGRATION') {
      // Treated as light warnings, small penalty
      score -= (severity === 'error' ? 3 : 1);
      totalWarnings++;
      details.push({ module: mod, maturity, severity: 'warning', message: `[MIGRATION WARNING] ${message}` });
    } else {
      // STABLE, PROTECTED, or GLOBAL/CORE
      if (severity === 'error') {
        score -= 5;
        totalErrors++;
        
        if (maturity === 'PROTECTED') {
          blockedByProtectedError = true;
          details.push({ module: mod, maturity, severity: 'error', message: `[PROTECTED BLOCK] ${message}` });
        } else if (mod === 'core-architecture' || mod === 'global') {
          blockedByGlobalContractBreak = true;
          details.push({ module: mod, maturity, severity: 'error', message: `[GLOBAL CONTRACT BREAK] ${message}` });
        } else {
          details.push({ module: mod, maturity, severity: 'error', message: `[STABLE ERROR] ${message}` });
        }
      } else {
        score -= 2;
        totalWarnings++;
        details.push({ module: mod, maturity, severity: 'warning', message: `[WARNING] ${message}` });
      }
    }
  }

  // 1. Evaluate file level violations from lint
  lintReport.fileViolations.forEach(v => {
    v.violations.forEach(violation => {
      processViolation(v.file, violation.severity, violation.type, `${violation.type} inside file ${v.file}: ${violation.message}`);
    });
  });

  // Evaluate structural level violations from lint
  lintReport.structuralViolations.forEach(v => {
    processViolation(v.module, v.severity, 'STRUCTURAL_VIOLATION', `Structural anomaly in module ${v.module}: ${v.message}`);
  });

  // 2. Evaluate Dependency Guard violations
  let dependencyViolations = 0;
  if (fs.existsSync(DEP_REPORT_PATH)) {
    const depReport = require('./combinenet').getCombinedState().dependency || {violations: []};
    const reports = depReport.violations || [];
    
    reports.forEach(fileEntry => {
      const mod = getModuleNameFromPath(fileEntry.file);
      const maturity = maturityMap[mod] || 'STABLE';
      
      fileEntry.violations.forEach(v => {
        dependencyViolations++;
        if (maturity === 'PROTECTED' || maturity === 'STABLE' || mod === 'core-architecture' || mod === 'global') {
          blockedByCriticalDependencyGuard = true;
          score -= 8;
          totalErrors++;
          details.push({ module: mod, maturity, severity: 'error', message: `[CRITICAL DEP GUARD BREAK] File ${fileEntry.file} has illegal dependency '${v.import}'` });
        } else {
          score -= 3;
          totalWarnings++;
          details.push({ module: mod, maturity, severity: 'warning', message: `[DEP GUARD WARN] File ${fileEntry.file} has unaligned dependency '${v.import}'` });
        }
      });
    });
  }

  // 3. Evaluate Breaking Change findings
  let breakingChangesCount = 0;
  if (fs.existsSync(BREAKING_REPORT_PATH)) {
    const breakingReport = require('./combinenet').getCombinedState().breakingChanges || {status: 'PASSED', findings: []};
    const findings = breakingReport.findings || [];
    findings.forEach(finding => {
      const mod = finding.module || 'global';
      const maturity = maturityMap[mod] || 'STABLE';
      
      if (finding.severity === 'error') {
        breakingChangesCount++;
        score -= 10;
        
        if (maturity === 'PROTECTED') {
          blockedByProtectedError = true;
        } else if (mod === 'global' || mod === 'core-architecture') {
          blockedByGlobalContractBreak = true;
        }
        
        totalErrors++;
        details.push({ module: mod, maturity, severity: 'error', message: `[BREAKING CHANGE ERROR] ${finding.message}` });
      } else if (finding.severity === 'warning') {
        score -= 3;
        totalWarnings++;
        details.push({ module: mod, maturity, severity: 'warning', message: `[BREAKING CHANGE WARN] ${finding.message}` });
      }
    });
  }

  // Ensure score bounds
  score = Math.max(0, score);

  let status = 'APPROVED';
  if (blockedByProtectedError || blockedByGlobalContractBreak || blockedByCriticalDependencyGuard || score < 60) {
    status = 'BLOCKED';
  } else if (score < 85 || totalErrors > 0) {
    status = 'WARNING';
  }

  const evaluation = {
    evaluatedAt: new Date().toISOString(),
    score,
    status,
    blockedReasons: {
      blockedByProtectedError,
      blockedByGlobalContractBreak,
      blockedByCriticalDependencyGuard,
      scoreTooLow: score < 60
    },
    metrics: {
      totalViolations: totalErrors + totalWarnings,
      errors: totalErrors,
      warnings: totalWarnings,
      dependencyGuardViolations: dependencyViolations,
      breakingChangesBlocked: breakingChangesCount
    },
    gates: {
      perfectScore: score === 100,
      passingScore: score >= 60,
      zeroErrors: totalErrors === 0
    },
    findingsLog: details
  };

  require('./combinenet').updateSection('qualityGate', evaluation);

  console.log(`\n============================================================`);
  console.log(`Quality Gate V2: ${status} (Score: ${score}/100)`);
  console.log(`Errors: ${totalErrors}, Warnings: ${totalWarnings}, Dependency Violations: ${dependencyViolations}`);
  console.log(`Protected block: ${blockedByProtectedError}, Core contract break: ${blockedByGlobalContractBreak}, Critical dep: ${blockedByCriticalDependencyGuard}`);
  console.log(`============================================================\n`);

  if (status === 'BLOCKED') {
    console.error('Core Architecture Quality Gate failed!');
    if (blockedByProtectedError) console.error('  -> Blocked because an error was found in a PROTECTED module.');
    if (blockedByGlobalContractBreak) console.error('  -> Blocked because a global architecture/core modular contract was broken.');
    if (blockedByCriticalDependencyGuard) console.error('  -> Blocked because a critical Dependency Guard violation was detected.');
    if (score < 60) console.error(`  -> Blocked because score (${score}) fell below minimum required (60).`);
    // Non-blocking now. It will be failed by fail-build.js instead.
  }
}

runQualityGate();
