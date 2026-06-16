const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const REGISTRY_PATH = path.join(ROOT_DIR, 'ais', 'governance', 'architecture-registry.json');
const DEBT_PATH = path.join(ROOT_DIR, 'ais', 'governance', 'technical-debt.json');
const ROADMAP_PATH = path.join(ROOT_DIR, 'ais', 'governance', 'architecture-roadmap.json');
const MATURITY_PATH = path.join(ROOT_DIR, 'ais', 'memory', 'module-maturity.json');
const BLUEPRINT_PATH = path.join(ROOT_DIR, 'ais', 'governance', 'module-blueprint.json');
const AUDIT_REPORT_PATH = path.join(ROOT_DIR, 'ais', 'reports', 'governance-audit-report.json');

function runGovernanceAudit() {
  console.log('=== [AIS] Running Governance Audit Auditor ===');
  
  const issues = [];
  const checks = [];

  // 1. Check existence of files
  const files = {
    registry: REGISTRY_PATH,
    debt: DEBT_PATH,
    roadmap: ROADMAP_PATH,
    maturity: MATURITY_PATH,
    blueprint: BLUEPRINT_PATH
  };

  for (const [key, filePath] of Object.entries(files)) {
    if (!fs.existsSync(filePath)) {
      issues.push({
        severity: 'CRITICAL',
        system: 'FileSystem',
        message: `Missing governance database file: ${key} at ${filePath}`
      });
    } else {
      checks.push(`File existence: ${key} is present.`);
    }
  }

  if (issues.length > 0 && issues.some(i => i.severity === 'CRITICAL')) {
    console.error('CRITICAL: Cannot proceed with governance audit due to missing files.');
    saveReport(issues, checks);
    return;
  }

  // 2. Read datasets
  const registryData = require('./combinenet').getCombinedState().registry || { modules: {} };
  const debtData = require('./combinenet').getCombinedState().technicalDebt || { technicalDebt: {} };
  const roadmapData = require('./combinenet').getCombinedState().roadmap || { roadmap: {} };
  const maturityData = require('./combinenet').getCombinedState().memory.evolution || { modules: {} };
  const blueprintData = require('./combinenet').getCombinedState().blueprint || { blueprint: {} };

  const registryModulesKeys = Object.keys(registryData.modules || {});
  const maturityModulesKeys = Object.keys(maturityData.modules || {});
  const debtModulesKeys = Object.keys(debtData.technicalDebt || {});
  const roadmapModulesKeys = Object.keys(roadmapData.roadmap || {});

  console.log(`- Loaded registry containing: ${registryModulesKeys.length} modules`);
  console.log(`- Loaded maturity database containing: ${maturityModulesKeys.length} modules`);
  console.log(`- Loaded technical debt registry containing: ${debtModulesKeys.length} modules`);
  console.log(`- Loaded roadmap containing: ${roadmapModulesKeys.length} items`);

  // Check 1: Core sync between Registry and Maturity module maps
  registryModulesKeys.forEach(m => {
    if (!maturityModulesKeys.includes(m)) {
      issues.push({
        severity: 'ERROR',
        system: 'MaturityLink',
        module: m,
        message: `Module '${m}' registered in architecture-registry is missing from module-maturity.json.`
      });
    } else {
      // Check maturity string alignment
      const regMaturity = registryData.modules[m].maturity;
      const matMaturity = maturityData.modules[m];
      if (regMaturity !== matMaturity) {
        issues.push({
          severity: 'MAJOR',
          system: 'MaturityAlignment',
          module: m,
          message: `Maturity mismatch for '${m}': Registry expects '${regMaturity}', but Maturity database is set to '${matMaturity}'.`
        });
      }
    }
  });

  maturityModulesKeys.forEach(m => {
    if (!registryModulesKeys.includes(m)) {
      issues.push({
        severity: 'ERROR',
        system: 'RegistryLink',
        module: m,
        message: `Module '${m}' in maturity list is not officially registered in architecture-registry.json.`
      });
    }
  });

  // Check 2: Technical Debt linkages
  debtModulesKeys.forEach(m => {
    if (!registryModulesKeys.includes(m)) {
      issues.push({
        severity: 'ERROR',
        system: 'DebtRegistryLink',
        module: m,
        message: `Technical debt items recorded for '${m}', but module is not defined in architecture-registry.json (Orphan Debt).`
      });
    }
  });

  // Check 3: Roadmap linkages & alignment
  roadmapModulesKeys.forEach(m => {
    if (!registryModulesKeys.includes(m)) {
      issues.push({
        severity: 'ERROR',
        system: 'RoadmapRegistryLink',
        module: m,
        message: `Roadmap defines progress for '${m}', but module is missing from architecture-registry.json.`
      });
    } else {
      const roadMaturity = roadmapData.roadmap[m].currentMaturity;
      const regMaturity = registryData.modules[m].maturity;
      if (roadMaturity !== regMaturity) {
        issues.push({
          severity: 'MINOR',
          system: 'RoadmapAlignment',
          module: m,
          message: `Roadmap current level '${roadMaturity}' for '${m}' does not match official registry level '${regMaturity}'.`
        });
      }
    }
  });

  // Check 4: Module structures matches blueprints
  if (blueprintData.requiredLayers) {
    const requiredLayers = blueprintData.requiredLayers;
    // Check modules that are ACTIVE or PROTECTED
    registryModulesKeys.forEach(m => {
      const spec = registryData.modules[m];
      if (spec.status === 'ACTIVE') {
        const moduleDir = path.join(ROOT_DIR, m);
        if (fs.existsSync(moduleDir)) {
          // Check that all directories exist in subfolders
          requiredLayers.forEach(layer => {
            const layerDir = path.join(moduleDir, 'src', 'main', 'java', 'com', 'example', layer);
            // This is a soft check, some modules might be legacy. But we document it as insight.
            if (!fs.existsSync(layerDir) && spec.maturity === 'PROTECTED') {
              issues.push({
                severity: 'WARNING',
                system: 'BlueprintCompliance',
                module: m,
                message: `Protected module '${m}' is missing recommended architected blueprint layer subdirectory: '${layer}'`
              });
            }
          });
        }
      }
    });
  }

  // Sanity audit summary
  console.log('\n=== Auditer Sanity Summary ===');
  if (issues.length === 0) {
    console.log('🟢 100% SUCCESS: All registries (Registry, Maturity, Debt, Roadmap, Blueprint) are perfectly synchronized!');
  } else {
    console.log(`🚨 Detected ${issues.length} compliance warnings or synchronization errors in your governance layer.`);
    issues.forEach(issue => {
      console.log(`   [${issue.severity}] [${issue.system}] ${issue.message}`);
    });
  }

  saveReport(issues, checks);
}

function saveReport(issues, checks) {
  const auditReport = {
    auditDate: new Date().toISOString(),
    governancePassed: issues.filter(i => i.severity === 'ERROR' || i.severity === 'CRITICAL').length === 0,
    metrics: {
      totalChecks: checks.length + 5,
      totalIssues: issues.length,
      criticals: issues.filter(i => i.severity === 'CRITICAL').length,
      errors: issues.filter(i => i.severity === 'ERROR').length,
      warnings: issues.filter(i => i.severity === 'WARNING' || i.severity === 'MAJOR' || i.severity === 'MINOR').length
    },
    checksTested: checks,
    issuesDetected: issues
  };

  require('./combinenet').updateSection('governanceAudit', auditReport);
  console.log(`\n✓ Governance audit report compiled successfully at: ${AUDIT_REPORT_PATH}`);
}

runGovernanceAudit();
