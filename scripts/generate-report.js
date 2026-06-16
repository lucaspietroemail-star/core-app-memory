const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.join(ROOT_DIR, 'ais', 'reports');

const PATHS = {
  lint: path.join(REPORTS_DIR, 'lint-report.json'),
  combinedState: path.join(ROOT_DIR, 'ais', 'aggregate', 'combined-state.json'),
  fix: path.join(REPORTS_DIR, 'auto-fix-report.json'),
  dep: path.join(REPORTS_DIR, 'dependency-report.json'),
  breaking: path.join(REPORTS_DIR, 'breaking-change-report.json'),
  registry: path.join(ROOT_DIR, 'component-registry.json'),
  memory: path.join(ROOT_DIR, 'ais', 'memory', 'architectural-memory.json'),
  finalReport: path.join(REPORTS_DIR, 'final-architecture-report.md')
};

function generateMarkdownReport() {
  console.log('Generating Final Architecture Quality Report...');

  const now = new Date().toISOString();
  let score = 'N/A';
  let status = 'UNKNOWN';
  let totalViolations = 0;
  let errorCount = 0;
  let warningCount = 0;
  let dependencyViolationsCount = 0;
  let breakingChangesBlockedCount = 0;

  let fileViolationsMd = '_Nenhuma violação encontrada._';
  let structuralViolationsMd = '_Nenhuma violação estrutural encontrada._';
  let dependencyViolationsMd = '_Todas as dependências estão robustas e em conformidade._';
  let breakingChangesMd = '_Nenhuma mudança perigosa ou quebra de contrato detectada._';
  let componentRegistryMd = '_Nenhum componente registrado de forma modular._';
  let fixesMd = '_Nenhum ajuste necessário._';
  let decisionsMd = '_Nenhuma decisão cadastrada._';
  let activeRulesMd = '_Nenhuma regra de persistência identificada._';

// 1. Read Quality Gate
  let blockedReasonsMd = '';
  let maturityStatusTableMd = '_Nenhum mapeamento de maturidade configurado._';

  const combinedState = require('./combinenet').getCombinedState();
  const gate = combinedState.qualityGate;
  if (gate && gate.status) {
    score = `${gate.score}/100`;
    status = gate.status;
    errorCount = gate.metrics?.errors ?? 0;
    warningCount = gate.metrics?.warnings ?? 0;
    totalViolations = gate.metrics?.totalViolations ?? 0;
    dependencyViolationsCount = gate.metrics?.dependencyGuardViolations ?? 0;
    breakingChangesBlockedCount = gate.metrics?.breakingChangesBlocked ?? 0;

    if (gate.blockedReasons) {
      blockedReasonsMd = Object.entries(gate.blockedReasons)
        .filter(([_, active]) => active)
        .map(([reason, _]) => `  - 🚨 **Causa de Bloqueio**: \`${reason}\``)
        .join('\n');
      if (!blockedReasonsMd) {
        blockedReasonsMd = `  - 🟢 **Condição de Escopo**: Nenhuma regra de impedimento ativa.`;
      }
    }
  }

  // Load Module Maturity
  const maturityPath = path.join(ROOT_DIR, 'ais', 'memory', 'module-maturity.json');
  if (fs.existsSync(maturityPath)) {
    const maturityData = JSON.parse(fs.readFileSync(maturityPath, 'utf-8'));
    maturityStatusTableMd = `| Nome do Módulo | Nível de Maturidade | Status de Bloqueio |\n|---|---|---|\n` +
      Object.entries(maturityData.modules).map(([modName, rating]) => {
        let blockStr = '🔴 Não Bloqueia';
        if (rating === 'PROTECTED') blockStr = '🔒 Bloqueia Imediatamente (PROTECTED)';
        if (rating === 'STABLE') blockStr = '⚠️ Bloqueia se queda de Score';
        return `| \`${modName}\` | **${rating}** | ${blockStr} |`;
      }).join('\n');
  }

  // 2. Read Violations (Lint)
  if (fs.existsSync(PATHS.lint)) {
    const lint = require('./combinenet').getCombinedState().lint;
    
    if (lint.fileViolations && lint.fileViolations.length > 0) {
      fileViolationsMd = lint.fileViolations.map(fileEntry => {
        const pathLine = `**Arquivo:** \`${fileEntry.file}\`\n`;
        const details = fileEntry.violations.map(v => `  - [${v.severity.toUpperCase()}] **${v.type}**: ${v.message}`).join('\n');
        return pathLine + details;
      }).join('\n\n');
    }

    if (lint.structuralViolations && lint.structuralViolations.length > 0) {
      structuralViolationsMd = lint.structuralViolations.map(v => {
        return `- **Módulo \`${v.module}\`**: ${v.message} (${v.severity})`;
      }).join('\n');
    }
  }

  // 3. Read Dependency Guard
  if (fs.existsSync(PATHS.dep)) {
    const dep = require('./combinenet').getCombinedState().dependency;
    if (dep.violations && dep.violations.length > 0) {
      dependencyViolationsMd = dep.violations.map(fileEntry => {
        const pathLine = `**Arquivo de Fluxo:** \`${fileEntry.file}\`\n`;
        const details = fileEntry.violations.map(v => `  - **Erro de Acoplamento**: Import '${v.import}' viola a camada '${v.layer}'`).join('\n');
        return pathLine + details;
      }).join('\n\n');
    }
  }

  // 4. Read Breaking Changes
  if (fs.existsSync(PATHS.breaking)) {
    const breaking = require('./combinenet').getCombinedState().breakingChanges;
    if (breaking.findings && breaking.findings.length > 0) {
      breakingChangesMd = breaking.findings.map(f => {
        const emoji = f.severity === 'error' ? '❌' : '⚠️';
        return `${emoji} **[${f.severity.toUpperCase()}] ${f.type}** (${f.module || 'Global'}): ${f.message}`;
      }).join('\n\n');
    }
  }

  // 5. Read Component Registry
  if (fs.existsSync(PATHS.registry)) {
    const registry = JSON.parse(fs.readFileSync(PATHS.registry, 'utf-8'));
    if (registry.components && registry.components.length > 0) {
      componentRegistryMd = `| Nome | Pacote de UI | Dependência | Status de Maturação |\n|---|---|---|---|\n` + 
        registry.components.map(c => {
          return `| **${c.name}** | \`${c.package}\` | \`${c.dependencies.join(', ')}\` | \`Ver: ${c.version}\` |`;
        }).join('\n');
    }
  }

  // 6. Read Auto-fixes
  if (fs.existsSync(PATHS.fix)) {
    const fix = require('./combinenet').getCombinedState().autoFix || {};
    if (fix.fixesApplied && fix.fixesApplied.length > 0) {
      fixesMd = fix.fixesApplied.map(f => {
        return `- **Módulo \`${f.module}\`**: ${f.action} em \`${f.path}\``;
      }).join('\n');
    }
  }

  // 7. Read memory and rules
  if (fs.existsSync(PATHS.memory)) {
    const memory = JSON.parse(fs.readFileSync(PATHS.memory, 'utf-8'));
    
    if (memory.decisions && memory.decisions.length > 0) {
      decisionsMd = memory.decisions.map(d => {
        return `| ${d.id} | ${d.date} | **${d.topic}** | ${d.description} | \`${d.status}\` |`;
      }).join('\n');
    }

    if (memory.learnedRules && memory.learnedRules.length > 0) {
      activeRulesMd = memory.learnedRules.map(r => {
        return `- **${r.name}** (\`${r.ruleId}\`): ${r.description}`;
      }).join('\n');
    }
  }

  // Determine status color/emoji
  let statusBadge = '🔴 BLOCKED';
  if (status === 'APPROVED') {
    statusBadge = '🟢 APPROVED';
  } else if (status === 'WARNING') {
    statusBadge = '🟡 WARNING';
  }

  const markdownContent = `# Architecture Intelligence System (AIS) - Final Report

Este relatório condensa o estado atual de integridade arquitetural do projeto. O sistema de automação valida constantemente o fluxo de dados entre camadas e a legibilidade da interface circular Wear OS.

---

## 📊 Módulos de Qualidade (Quality Gate)

| Métrica | Status / Valor |
|---------|----------------|
| **Status Final** | **${statusBadge}** |
| **Score Arquitetural** | **${score}** |
| **Erros Críticos** | \`${errorCount}\` |
| **Avisos (Warnings)** | \`${warningCount}\` |
| **Acoplamentos Inválidos** | \`${dependencyViolationsCount}\` |
| **Quebras de Contrato** | \`${breakingChangesBlockedCount}\` |
| **Total de Violações** | \`${totalViolations}\` |

### 🛠️ Condição Geral sobre Impedimentos de Build:
${blockedReasonsMd}

### 📦 Matriz de Maturidade de Módulos (Maturity Map):
${maturityStatusTableMd}

---

## 🛡️ Proteção de Dependências (Dependency Guard)

O Dependency Guard monitora proativamente acoplamentos ilegais entre componentes gráficos e de persistência:

### Violações Identificadas:
${dependencyViolationsMd}

---

## 🚨 Detector de Mudanças Destrutivas (Breaking Change Detector)

Análise de modificações de APIs públicas, assinaturas de dados ou remoções de classes estruturais:

### Eventos de Risco:
${breakingChangesMd}

---

## 🎨 Registro de Componentes Globais (Component Registry)

Catalogação dos componentes base do Design System visando mitigar redundâncias visuais:

${componentRegistryMd}

---

## 🛠️ Correções Realizadas (Auto-Fix)

Abaixo estão descritas as reestruturações automatizadas aplicadas para conformidade estrutural imediata:

${fixesMd}

---

## ⚠️ Violações de Code Styling (Lint Report)

Esta seção detalha desvios identificados em importações ou dependências circulares entre camadas.

### Arquivos Com Problemas:
${fileViolationsMd}

### Deficiências de Estrutura de Módulos (Packages):
${structuralViolationsMd}

---

## 🧠 Soluções Aprendidas & Memórias (Architectural Memory)

O sistema mantém um buffer de memória de aprendizado contínuo para evitar recorrência de erros estruturais:

### Regras de Ouro Sólidas Ativas:
${activeRulesMd}

### Histórico de Decisões Arquiteturais Relevantes (ADRs):

| ID | Data | Assunto | Escopo Prático | Status |
|----|------|---------|----------------|--------|
${decisionsMd}

---

## 📋 Diagnóstico de Saúde do Sistema
- **Integridade das Camadas**: O fluxo obrigatório \`UI → ViewModel → UseCase → Repository\` é monitorado de perto.
- **Nível de Risco**: ${status === 'APPROVED' ? 'Mínimo (Ambiente de Produção Seguro)' : 'Moderado/Alto (Requer inspeção manual de desvios)'}
- **Última Atualização**: \`${now}\`
`;

  fs.writeFileSync(PATHS.finalReport, markdownContent, 'utf-8');
  console.log(`Markdown report written to: ${PATHS.finalReport}`);
}

generateMarkdownReport();
