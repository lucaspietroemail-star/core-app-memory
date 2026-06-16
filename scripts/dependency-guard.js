const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const CONTRACTS_PATH = path.join(ROOT_DIR, 'contracts', 'architecture-contracts.json');
const REPORT_PATH = path.join(ROOT_DIR, 'ais', 'reports', 'dependency-report.json');

/**
 * Finds all files recursively with specific extensions
 */
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

/**
 * Parses and returns imports from a Kotlin source code file
 */
function getKotlinImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const imports = [];
  let isInsideComment = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('/*')) isInsideComment = true;
    if (trimmed.endsWith('*/')) {
      isInsideComment = false;
      continue;
    }
    if (isInsideComment) continue;

    if (trimmed.startsWith('import ')) {
      const imp = trimmed.replace('import ', '').replace(';', '').trim();
      imports.push(imp);
    }
  }
  return imports;
}

function runDependencyGuard() {
  console.log('Running AIS Dependency Guard analysis...');

  if (!fs.existsSync(CONTRACTS_PATH)) {
    console.error('Core Architecture Contracts file not found! Writing fallback report.');
    const failReport = {
      executedAt: new Date().toISOString(),
      totalFilesChecked: 0,
      totalDependencyViolations: 1,
      violations: [{ 
        file: 'AIS_SYSTEM', 
        severity: 'blocked', 
        message: 'Core Architecture Contracts file not found. Dependency Guard skipped.' 
      }]
    };
    const reportsDir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
    require('./combinenet').updateSection('dependency', failReport);
    return;
  }

  const contracts = JSON.parse(fs.readFileSync(CONTRACTS_PATH, 'utf-8'));
  const rules = contracts.layerRules || [];
  const reports = [];
  let totalViolations = 0;

  const kotlinFiles = findFiles(ROOT_DIR, '.kt');
  
  for (const file of kotlinFiles) {
    if (file.includes('/build/') || file.includes('/.gradle/')) continue;

    const relativePath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
    const imports = getKotlinImports(file);
    const fileViolations = [];

    // Map file path to the corresponding architectural layer
    let matchedRule = null;
    for (const rule of rules) {
      // Check if file relative path contains layer suffix or subdirectory matching rules
      // e.g., "feature-settings/src/main/java/com/example/feature/settings/ui/" contains "/ui/"
      if (relativePath.includes(`/${rule.layer}/`) || relativePath.includes(`/${rule.layer}.`)) {
        matchedRule = rule;
        break;
      }
    }

    if (matchedRule) {
      const forbiddenList = matchedRule.forbiddenImports || [];
      imports.forEach(imp => {
        forbiddenList.forEach(forbidden => {
          // Check if import contains the forbidden identifier (case sensitive or generic matching)
          if (imp.includes(forbidden) || imp.endsWith(forbidden)) {
            // Check exception for android.util.Log inside Pure Domain
            if (matchedRule.layer === 'domain' && imp === 'android.util.Log') {
              return; // Allow simple debug logger utilities
            }
            fileViolations.push({
              layer: matchedRule.layer,
              import: imp,
              forbiddenPattern: forbidden,
              message: `Layer '${matchedRule.layer}' is forbidden from importing '${imp}' (${forbidden})`
            });
          }
        });
      });
    }

    if (fileViolations.length > 0) {
      reports.push({
        file: relativePath,
        violations: fileViolations
      });
      totalViolations += fileViolations.length;
    }
  }

  const summary = {
    executedAt: new Date().toISOString(),
    totalFilesChecked: kotlinFiles.length,
    totalDependencyViolations: totalViolations,
    violations: reports
  };

  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  require('./combinenet').updateSection('dependency', summary);
  console.log(`Dependency Guard Complete! Scanned ${kotlinFiles.length} files. Found ${totalViolations} violations.`);
}

runDependencyGuard();
