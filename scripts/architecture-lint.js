const fs = require('fs');
const path = require('path');

// Target directories and feature modules inside the project root
const ROOT_DIR = path.resolve(__dirname, '../..');
const EXP_MODULES = [
  'feature-launcher',
  'feature-drawer',
  'feature-notifications',
  'feature-media',
  'feature-settings',
  'feature-sensors',
  'feature-debug'
];

/**
 * Helper to recursively find files with a specific extension
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
 * Parse Kotlin file imports
 */
function checkKotlinFile(filePath) {
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

  const relativePath = path.relative(ROOT_DIR, filePath);
  const violations = [];

  // Architecture flow validations based on paths
  if (relativePath.includes('domain/')) {
    // Domain must not depend on Android framework or Data layered models
    imports.forEach(imp => {
      if (imp.startsWith('android.') && !imp.startsWith('android.util.Log')) {
        violations.push({
          type: 'DOMAIN_DEPENDS_ON_ANDROID',
          message: `Domain file imports Android framework component: ${imp}`,
          severity: 'error'
        });
      }
      if (imp.startsWith('androidx.')) {
        violations.push({
          type: 'DOMAIN_DEPENDS_ON_ANDROIDX',
          message: `Domain file imports Jetpack/AndroidX component: ${imp}`,
          severity: 'error'
        });
      }
      if (imp.includes('.data.') || imp.includes('com.example.data')) {
        violations.push({
          type: 'DOMAIN_DEPENDS_ON_DATA',
          message: `Domain layer depends on Data implementation layer: ${imp}`,
          severity: 'error'
        });
      }
    });
  }

  if (relativePath.includes('/vm/') || relativePath.includes('/viewmodel/')) {
    // ViewModel must not import Compose UI details
    imports.forEach(imp => {
      if (imp.startsWith('androidx.compose.') || imp.startsWith('androidx.wear.compose.')) {
        violations.push({
          type: 'VIEWMODEL_HOARDS_UI_DEPENDENCIES',
          message: `ViewModel contains direct Jetpack Compose UI dependencies: ${imp}`,
          severity: 'error'
        });
      }
    });
  }

  if (relativePath.includes('/ui/')) {
    // UI must not depend on Data layer (Repositories, DBs) directly
    imports.forEach(imp => {
      if (imp.includes('com.example.data') || imp.endsWith('Repository')) {
        violations.push({
          type: 'UI_DIRECT_ACCESS_DATA',
          message: `UI layer references Data layer or Repository directly: ${imp}`,
          severity: 'error'
        });
      }
    });
  }

  // Prevent domain depending on features
  if (relativePath.includes('domain/')) {
    imports.forEach(imp => {
      if (imp.includes('.feature.')) {
        violations.push({
          type: 'DOMAIN_DEPENDS_ON_FEATURE',
          message: `Domain layer contains direct feature dependencies: ${imp}`,
          severity: 'error'
        });
      }
    });
  }

  // Check for potential personal sensitive information (e.g. personal email addresses)
  const personalEmailRegex = /\b(?!support|engineering|devops|info|this|return|super|break|continue|throw)(?!.*\.toPx)(?!.*\.dp)(?!.*\.sp)[A-Za-z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
  const emailMatches = content.match(personalEmailRegex);
  if (emailMatches) {
    emailMatches.forEach(email => {
      // Filter out typical false positives in Kotlin labels and extension functions
      const isKotlinLabel = /^(this|return|super|break|continue|throw)@/i.test(email) || 
                            /\.(toPx|dp|sp|px|kt)\b/i.test(email) || 
                            email.includes('@toPx') || 
                            email.includes('@dp') || 
                            email.includes('@sp');

      if (!isKotlinLabel && !email.startsWith('android') && !email.includes('example.com') && !email.includes('example.org')) {
        violations.push({
          type: 'PERSONAL_SENSITIVE_INFO_WARNING',
          message: `Potential personal sensitive info detected: Email address '${email}'. Verify that no public codebase exposed personal attributes.`,
          severity: 'warning'
        });
      }
    });
  }

  return {
    file: relativePath,
    violations
  };
}

function runLint() {
  console.log('Running Architecture Lint scan...');
  const reports = [];
  let totalFilesScanned = 0;
  let totalViolations = 0;

  // 1. Run checks on all modules' Kotlin files
  const kotlinFiles = findFiles(ROOT_DIR, '.kt');
  for (const file of kotlinFiles) {
    if (file.includes('/build/') || file.includes('/.gradle/')) continue;
    totalFilesScanned++;
    const result = checkKotlinFile(file);
    if (result.violations.length > 0) {
      reports.push(result);
      totalViolations += result.violations.length;
    }
  }

  // 2. Validate structural constraints of feature modules
  const structuralViolations = [];
  for (const mod of EXP_MODULES) {
    const modDir = path.join(ROOT_DIR, mod, 'src', 'main', 'java', 'com', 'example', 'feature', mod.replace('feature-', ''));
    if (!fs.existsSync(modDir)) {
      continue;
    }

    const expectedDirs = ['ui', 'vm', 'state'];
    for (const expected of expectedDirs) {
      const subDirPath = path.join(modDir, expected);
      if (!fs.existsSync(subDirPath)) {
        structuralViolations.push({
          module: mod,
          type: 'MISSING_STRUCTURAL_DIRECTORY',
          message: `Feature module "${mod}" is missing standard directory structure folder: ${expected}`,
          severity: 'warning'
        });
      }
    }
  }

  const finalOutput = {
    scanTime: new Date().toISOString(),
    summary: {
      totalFilesScanned,
      totalViolations: totalViolations + structuralViolations.length,
      fileViolationsCount: totalViolations,
      structuralViolationsCount: structuralViolations.length
    },
    fileViolations: reports,
    structuralViolations
  };

  const reportsDir = path.join(ROOT_DIR, 'ais', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const combinenet = require('./combinenet');
  combinenet.updateSection('lint', finalOutput);

  console.log(`Lint Completed. Scanned ${totalFilesScanned} files. Found ${finalOutput.summary.totalViolations} violations.`);
}

runLint();
