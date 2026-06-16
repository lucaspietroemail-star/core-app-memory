const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '../..');
const CONTRACTS_PATH = path.join(ROOT_DIR, 'contracts', 'architecture-contracts.json');
const MATURITY_PATH = path.join(ROOT_DIR, 'ais', 'memory', 'module-maturity.json');
const REPORT_PATH = path.join(ROOT_DIR, 'ais', 'reports', 'breaking-change-report.json');

const ACTIVE_MODULES = [
  'feature-launcher',
  'feature-drawer',
  'feature-notifications',
  'feature-media',
  'feature-settings',
  'feature-sensors',
  'feature-debug'
];

function runBreakingChangeDetector() {
  console.log('Running AIS Breaking Change Detector V2...');

  if (!fs.existsSync(CONTRACTS_PATH)) {
    console.error('Architecture Contracts file not found! Writing fallback report.');
    const failReport = {
      status: 'BLOCKED',
      findings: [{
        module: 'global',
        type: 'SYSTEM_FAILURE',
        severity: 'error',
        message: 'Architecture Contracts file not found.'
      }]
    };
    const reportsDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    require('./combinenet').updateSection('breakingChanges', failReport);
    return;
  }

  // Load contracts
  const contracts = JSON.parse(fs.readFileSync(CONTRACTS_PATH, 'utf-8'));
  const mandatoryComponents = contracts.mandatoryComponents || [];
  const expectedFolders = contracts.layers.moduleFolders || [];

  // Load maturity configuration
  let maturityMap = {};
  
  const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} };
  maturityMap = maturityData.modules || {};
  console.log('Successfully loaded Module Maturity Map:', JSON.stringify(maturityMap));


  // Helper to adjust severity based on module maturity status
  function getAdjustedSeverity(moduleName, baseSeverity) {
    const maturity = maturityMap[moduleName] || 'STABLE';
    if (maturity === 'LEGACY') {
      return 'info';
    }
    if (maturity === 'MIGRATION') {
      return 'warning';
    }
    if (maturity === 'PROTECTED') {
      return 'error'; // Any warning/error inside a PROTECTED module escalates to a block
    }
    return baseSeverity; // Keep 'error' or 'warning' for STABLE
  }

  const changes = [];

  // Check Git status for deleted architectural files if possible
  let deletedFiles = [];
  try {
    const gitDiff = execSync('git diff --name-only origin/main --diff-filter=D', { encoding: 'utf-8', stdio: [] });
    deletedFiles = gitDiff.split('\n').filter(Boolean);
    console.log(`Detected ${deletedFiles.length} deleted files via git comparison.`);
  } catch (e) {
    console.log('Git comparison with origin/main not available/initialized. Falling back to local consistency audits.');
  }

  // 1. Audit deleted structural paths we cannot afford to lose
  deletedFiles.forEach(file => {
    const isCritical = mandatoryComponents.some(comp => file.includes(comp)) || 
                       expectedFolders.some(fol => file.includes(`/${fol}/`));
    if (isCritical) {
      // Find which module this file belonged to, if any
      let resolvedModule = 'global';
      for (const mod of ACTIVE_MODULES) {
        if (file.includes(mod)) {
          resolvedModule = mod;
          break;
        }
      }

      const severity = getAdjustedSeverity(resolvedModule, 'error');

      changes.push({
        severity,
        type: 'CRITICAL_FILE_DELETION',
        file,
        module: resolvedModule,
        message: `Architectural element deleted: '${file}'. Module maturity represents '${maturityMap[resolvedModule] || 'STABLE'}'.`
      });
    }
  });

  // 2. Audit current active modules folder structure against contracts
  ACTIVE_MODULES.forEach(mod => {
    const javaModPath = path.join(ROOT_DIR, mod, 'src', 'main', 'java', 'com', 'example', 'feature', mod.replace('feature-', ''));
    if (!fs.existsSync(javaModPath)) {
      return; 
    }

    expectedFolders.forEach(folder => {
      const folderPath = path.join(javaModPath, folder);
      if (!fs.existsSync(folderPath)) {
        const severity = getAdjustedSeverity(mod, 'error');
        changes.push({
          severity,
          type: 'MISSING_CONTRACT_LAYER',
          module: mod,
          message: `Breaking Change: Folder layer '${folder}' has been removed/is missing from module '${mod}'`
        });
      }
    });

    // Look for essential components inside each main package group
    // Each feature must contain ViewModel, State, and UI representations
    const kotlinSourceFiles = findFiles(javaModPath, '.kt');
    const hasViewModel = kotlinSourceFiles.some(f => f.includes('ViewModel'));
    const hasState = kotlinSourceFiles.some(f => f.includes('State') || f.includes('UiState'));
    
    if (kotlinSourceFiles.length > 0) {
      if (!hasViewModel) {
        const severity = getAdjustedSeverity(mod, 'warning');
        changes.push({
          severity,
          type: 'MISSING_VIEWMODEL_REPRESENTATION',
          module: mod,
          message: `Architectural anomaly: No active ViewModel representation discovered inside module '${mod}'`
        });
      }
      if (!hasState) {
        const severity = getAdjustedSeverity(mod, 'warning');
        changes.push({
          severity,
          type: 'MISSING_STATE_REPRESENTATION',
          module: mod,
          message: `Architectural anomaly: No matching state modeling structures declared inside module '${mod}'`
        });
      }
    }
  });

  // Block only if a true error was raised (which can only happen for STABLE or PROTECTED modules as per maturity rules)
  const isBlocked = changes.some(change => change.severity === 'error');

  const output = {
    checkedAt: new Date().toISOString(),
    status: isBlocked ? 'FAIL' : 'PASS',
    totalModifications: changes.length,
    findings: changes
  };

  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  require('./combinenet').updateSection('breakingChanges', output);
  console.log(`Breaking Change V2 scan finished with ${changes.length} events logged. Unified status: ${output.status}`);
}

function findFiles(dir, ext, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findFiles(filePath, ext, fileList);
    } else if (filePath.endsWith(ext)) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

runBreakingChangeDetector();
