const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const MEMORY_PATH = path.join(ROOT_DIR, 'ais', 'memory', 'architectural-memory.json');
const RULES_PATH = path.join(ROOT_DIR, 'ais', 'governance', 'generator-rules.json');
const DEP_REPORT_PATH = path.join(ROOT_DIR, 'ais', 'reports', 'dependency-report.json');

function runSelfEvolution() {
  console.log('Running Self-Evolution Engine...');

  

  let memory = (require('./combinenet').getCombinedState().memory || {}).adrState || { decisions: [] };
  let rules = (require('./combinenet').getCombinedState().memory || {}).rules || { activeRules: [] };

  let evolvedCount = 0;

  // 1. Derive new rules from historical violations
  if (memory.historicalViolations) {
    memory.historicalViolations.forEach((violation, index) => {
      const derivedRuleId = `EV-HIST-${index + 1}`;
      const exists = rules.evolutionDerivedRules.some(r => r.id === derivedRuleId);

      if (!exists) {
        const newRule = {
          id: derivedRuleId,
          derivedFromPattern: violation.type,
          rule: `To prevent historical errors like '${violation.message}', we enforce compliance with: ${violation.fixAction}`,
          severity: 'error'
        };
        rules.evolutionDerivedRules.push(newRule);
        evolvedCount++;
        console.log(`[Self-Evolution] Synthesized new rule: ${derivedRuleId} targeting ${violation.type}`);
      }
    });
  }

  // 2. Derive rules from detected patterns
  if (memory.detectedPatterns) {
    memory.detectedPatterns.forEach((pattern, index) => {
      const derivedRuleId = `EV-PAT-${index + 1}`;
      const exists = rules.evolutionDerivedRules.some(r => r.id === derivedRuleId);

      if (!exists) {
        const newRule = {
          id: derivedRuleId,
          derivedFromPattern: pattern.patternId,
          rule: pattern.remediation,
          severity: 'warning'
        };
        rules.evolutionDerivedRules.push(newRule);
        evolvedCount++;
        console.log(`[Self-Evolution] Synthesized pattern-based rule: ${derivedRuleId} targeting ${pattern.patternId}`);
      }
    });
  }

  // 3. Derive rules from dynamic dependency guard reports
  if (fs.existsSync(DEP_REPORT_PATH)) {
    const depReport = require('./combinenet').getCombinedState().dependency || {violations: []};
    if (depReport.violations && depReport.violations.length > 0) {
      depReport.violations.forEach((block, idx) => {
        block.violations.forEach((violation, vIdx) => {
          const derivedRuleId = `EV-DEP-${idx + 1}-${vIdx + 1}`;
          const exists = rules.evolutionDerivedRules.some(r => r.id === derivedRuleId);

          if (!exists) {
            const newRule = {
              id: derivedRuleId,
              derivedFromPattern: `FORBIDDEN_IMPORT_${violation.forbiddenPattern.toUpperCase()}`,
              rule: `Under no circumstances shall any package inside the layer '${violation.layer}' import containing pattern: '${violation.import}'`,
              severity: 'error'
            };
            rules.evolutionDerivedRules.push(newRule);
            evolvedCount++;
            console.log(`[Self-Evolution] Synthesized dependency-based rule: ${derivedRuleId} targeting forbidden import of ${violation.forbiddenPattern}`);
          }
        });
      });
    }
  }

  if (evolvedCount > 0) {
    rules.lastUpdated = new Date().toISOString();
    require('./combinenet').updateSection('memory', { ...require('./combinenet').getCombinedState().memory, rules: rules });
    console.log(`Self-Evolution completed successfully. ${evolvedCount} new architectural rules evolved.`);
  } else {
    console.log('Self-Evolution completed. Up to date, no new rules harvested from memory/reports.');
  }
}

runSelfEvolution();
