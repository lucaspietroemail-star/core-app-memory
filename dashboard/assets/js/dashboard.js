document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const links = document.querySelectorAll('.nav-link');
  const panes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      // Use currentTarget to ensure we always get the <a> element even if an emoji inside was clicked
      const clickedLink = e.currentTarget;
      
      links.forEach(l => l.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      
      const targetId = clickedLink.getAttribute('data-target');
      clickedLink.classList.add('active');
      
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
          targetPane.classList.add('active');
      }
      
      // Clean emoji of title and preserve accented characters (pt-BR)
      pageTitle.textContent = clickedLink.textContent.replace(/^[\s\p{Emoji}📈💡🗂️📦⏱️🗺️🤖🧠📖🏥⚠️📜⏳🟢🔴]+/gu, '').trim();
    });
  });

  // Safe initialization of dashboard
  initDashboard();
});

/**
 * Normalizes status values based on the requested rules:
 * ONLINE -> 🟢 Online
 * OFFLINE -> 🔴 Offline
 * FAILED -> ⚠️ Erro
 * LOADING -> ⏳ Carregando
 */
function formatStatusLabel(status) {
  if (!status) return '⏳ Carregando';
  const uStatus = status.toString().trim().toUpperCase();
  if (uStatus === 'ONLINE' || uStatus === 'PASSED' || uStatus === 'APPROVED' || uStatus === 'SUCESSO' || uStatus === 'SUCCESS') {
    return '🟢 Online';
  }
  if (uStatus === 'OFFLINE' || uStatus === 'DESCONECTADO' || uStatus === 'DISCONNECTED') {
    return '🔴 Offline';
  }
  if (uStatus === 'FAILED' || uStatus === 'BLOCKED' || uStatus === 'ERRO' || uStatus === 'ERROR' || uStatus === 'DANGER' || uStatus === 'PERIGO') {
    return '⚠️ Erro';
  }
  if (uStatus === 'LOADING' || uStatus === 'CARREGANDO' || uStatus === 'PROCESSANDO' || uStatus === 'PROCESSING') {
    return '⏳ Carregando';
  }
  // Generic fallback checks
  if (uStatus === 'UNKNOWN') return '⏳ Carregando';
  return status;
}

/**
 * Normalizes state data to protect against undefined errors, supporting both old and new schemas.
 */
function normalizeDashboardState(data) {
  if (!data) data = {};
  
  // Normalize Quality Gate / Gate
  const qualityGateObj = data.qualityGate || data.gate || {};
  const normalizedQualityGate = {
    status: qualityGateObj.status ?? "UNKNOWN",
    evaluatedAt: qualityGateObj.evaluatedAt ?? qualityGateObj.checkedAt ?? new Date().toISOString(),
    score: typeof qualityGateObj.score === 'number' ? qualityGateObj.score : 0,
    blockedReasons: {
      blockedByProtectedError: qualityGateObj.blockedReasons?.blockedByProtectedError ?? false,
      blockedByGlobalContractBreak: qualityGateObj.blockedReasons?.blockedByGlobalContractBreak ?? false,
      blockedByCriticalDependencyGuard: qualityGateObj.blockedReasons?.blockedByCriticalDependencyGuard ?? false,
      scoreTooLow: qualityGateObj.blockedReasons?.scoreTooLow ?? false,
      missingLintReport: qualityGateObj.blockedReasons?.missingLintReport ?? false
    },
    metrics: {
      totalViolations: qualityGateObj.metrics?.totalViolations ?? 0,
      errors: qualityGateObj.metrics?.errors ?? 0,
      warnings: qualityGateObj.metrics?.warnings ?? 0,
      dependencyGuardViolations: qualityGateObj.metrics?.dependencyGuardViolations ?? 0,
      breakingChangesBlocked: qualityGateObj.metrics?.breakingChangesBlocked ?? 0
    },
    gates: {
      perfectScore: qualityGateObj.gates?.perfectScore ?? false,
      passingScore: qualityGateObj.gates?.passingScore ?? false,
      zeroErrors: qualityGateObj.gates?.zeroErrors ?? false
    },
    findingsLog: qualityGateObj.findingsLog || []
  };

  // Normalize Lint Report / Lint
  const lintObj = data.lintReport || data.lint || {};
  const normalizedLint = {
    status: lintObj.status ?? "UNKNOWN",
    scanTime: lintObj.scanTime ?? new Date().toISOString(),
    summary: {
      totalFilesScanned: lintObj.summary?.totalFilesScanned ?? 0,
      totalViolations: lintObj.summary?.totalViolations ?? 0,
      fileViolationsCount: lintObj.summary?.fileViolationsCount ?? 0,
      structuralViolationsCount: lintObj.summary?.structuralViolationsCount ?? 0
    },
    fileViolations: lintObj.fileViolations || [],
    structuralViolations: lintObj.structuralViolations || []
  };

  // Normalize Dependency Report / Dependency
  const depObj = data.dependencyReport || data.dependency || {};
  const normalizedDep = {
    status: depObj.status ?? "UNKNOWN",
    executedAt: depObj.executedAt ?? new Date().toISOString(),
    totalFilesChecked: depObj.totalFilesChecked ?? 0,
    totalDependencyViolations: depObj.totalDependencyViolations ?? 0,
    violations: depObj.violations || []
  };

  // Normalize Breaking Change Report / Breaking
  const bcObj = data.breakingChangeReport || data.breakingChanges || data.breaking || {};
  const normalizedBC = {
    status: bcObj.status ?? "UNKNOWN",
    checkedAt: bcObj.checkedAt ?? new Date().toISOString(),
    totalModifications: bcObj.totalModifications ?? 0,
    findings: bcObj.findings || []
  };

  // Normalize Registry
  const registryObj = data.registry || {};
  const normalizedRegistry = {
    modules: registryObj.modules || {}
  };

  // Normalize Technical Debt
  const tdObj = data.technicalDebt || {};
  const normalizedTD = {
    technicalDebt: tdObj.technicalDebt || {}
  };

  // Normalize Score History
  const scoreHist = Array.isArray(data.scoreHistory) ? data.scoreHistory : (Array.isArray(data.history) ? data.history : []);

  // Return full guaranteed structure to shield UI from undefined access issues
  return {
    generatedAt: data.generatedAt ?? new Date().toISOString(),
    version: {
      versionCode: data.version?.versionCode ?? 0,
      versionName: data.version?.versionName ?? "0.0.0-unknown",
      releaseChannel: data.version?.releaseChannel ?? "unknown",
      buildDate: data.version?.buildDate ?? "unknown"
    },
    qualityGate: normalizedQualityGate,
    gate: normalizedQualityGate, // Mapping compatibility
    lintReport: normalizedLint,
    lint: normalizedLint,       // Mapping compatibility
    dependencyReport: normalizedDep,
    dependency: normalizedDep,   // Mapping compatibility
    breakingChangeReport: normalizedBC,
    breakingChanges: normalizedBC, // Mapping compatibility
    breaking: normalizedBC,       // Mapping compatibility
    registry: normalizedRegistry,
    technicalDebt: normalizedTD,
    scoreHistory: scoreHist,
    history: scoreHist,           // Mapping compatibility
    components: data.components || { components: [] },
    decisions: data.decisions || { architectural_decisions: [] },
    architecturalMemory: data.architecturalMemory || [],
    recommendations: data.recommendations || [],
    snapshotIndex: data.snapshotIndex || { snapshots: [] },
    roadmap: data.roadmap || { roadmap: {} },
    activeRules: data.activeRules || { activeRules: [] },
    deprecatedRules: data.deprecatedRules || { deprecatedRules: [] },
    ruleHistory: data.ruleHistory || { ruleHistory: [] },
    wearCoreArchive: data.wearCoreArchive || {}
  };
}

/**
 * Dynamically resolves the root path of the AIS application, accounting for optional '/ais/' prefix
 * and subpath hosting (e.g. GitHub Pages).
 */
function getAisRootPath() {
  const pathname = window.location.pathname;
  const lowerPath = pathname.toLowerCase();
  
  // Possible entry points for the dashboard
  const triggers = ['/ais/dashboard', '/dashboard'];
  
  for (const trigger of triggers) {
    const index = lowerPath.indexOf(trigger);
    if (index !== -1) {
      return pathname.substring(0, index);
    }
  }
  
  return "";
}

/**
 * Checks if the application is running with the '/ais/' directory prefix.
 */
function hasAisPrefix() {
  return window.location.pathname.toLowerCase().includes('/ais/dashboard');
}

/**
 * Resolves a path relative to the AIS root, handling protocols and subpaths.
 * @param {string} relativeTarget - The target path relative to AIS root (e.g. 'exports/ai-index.json')
 */
function resolveAisUrl(relativeTarget) {
  const origin = window.location.origin;
  const protocol = window.location.protocol;
  
  // Local file testing fallback
  if (protocol === 'file:' || !origin || origin === 'null') {
    return '../' + relativeTarget;
  }
  
  const basePath = getAisRootPath();
  const prefix = hasAisPrefix() ? '/ais' : '';
  
  // Remove leading slash if present in target to prevent double slashes
  const cleanTarget = relativeTarget.startsWith('/') ? relativeTarget.substring(1) : relativeTarget;
  
  const finalUrl = `${origin}${basePath}${prefix}/${cleanTarget}`;
  console.log(`[AIS Resolver] Resolved: ${relativeTarget} -> ${finalUrl}`);
  return finalUrl;
}

/**
 * Dynamically resolves the single, correct absolute URL scheme for the combined-state.json.
 */
function resolveGlobalStateUrl() {
  return resolveAisUrl('aggregate/combined-state.json');
}

/**
 * Initializes and loads the dashboard data dynamically through local script or a SINGLE secure fetch fallback.
 */
function initDashboard() {
  if (typeof window.dashboardData !== 'undefined') {
    console.log("[AIS] Found window.dashboardData statically pre-loaded; using it to prevent extra fetch / 404s.");
    window.dashboardData = normalizeDashboardState(window.dashboardData);
    populateDashboard(window.dashboardData);
    triggerChartsUpdate();
    return; // Completely stop loader, zero extra network traffic
  }

  console.warn("[AIS] window.dashboardData is not loaded. Initiating dynamic fetch...");
  
  const targetUrl = resolveGlobalStateUrl();
  console.log(`[AIS] Single target dynamic state URL: ${targetUrl}`);

  fetch(targetUrl)
    .then(response => {
      if (!response.ok) throw new Error("HTTP Status Error " + response.status);
      return response.json();
    })
    .then(fetchedData => {
      console.log("[AIS] Dynamic state fetch request succeeded.");
      window.dashboardData = normalizeDashboardState(fetchedData);
      populateDashboard(window.dashboardData);
      triggerChartsUpdate();
    })
    .catch(err => {
      console.error("[AIS] State file retrieval failed. Initializing empty fallback state object to prevent crash.", err);
      window.dashboardData = normalizeDashboardState({});
      populateDashboard(window.dashboardData);
      triggerChartsUpdate();
      
      const statBanner = document.getElementById('build-status-banner');
      if (statBanner) {
        statBanner.style.display = 'block';
        statBanner.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
        statBanner.style.color = '#f87171';
        statBanner.style.border = '1px solid #f87171';
        statBanner.textContent = '⚠️ ERRO DE LEITURA DO ESTADO: Fallback padrão carregado de forma offline';
      }
    });
}

/**
 * Safely populates all visual widgets inside the dashboard.
 */
function populateDashboard(data) {
  // Check build status
  const statBanner = document.getElementById('build-status-banner');
  if (statBanner) {
    const status = data.qualityGate?.status ?? "UNKNOWN";
    if (status === 'BLOCKED') {
      statBanner.style.display = 'block';
      statBanner.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
      statBanner.style.color = '#f87171';
      statBanner.style.border = '1px solid #f87171';
      statBanner.textContent = '⚠️ Erro (Compilação Bloqueada)';
    } else if (status === 'APPROVED' || status === 'PASSED') {
      statBanner.style.display = 'block';
      statBanner.style.backgroundColor = 'rgba(74, 222, 128, 0.2)';
      statBanner.style.color = '#4ade80';
      statBanner.style.border = '1px solid #4ade80';
      statBanner.textContent = '🟢 Online (Arquitetura Aprovada)';
    } else {
      statBanner.style.display = 'block';
      statBanner.style.backgroundColor = 'rgba(63, 63, 70, 0.3)';
      statBanner.style.color = '#cbd5e1';
      statBanner.style.border = '1px solid #27272a';
      statBanner.textContent = `⏳ Carregando Estado: ${status}`;
    }
  }

  // Map general stats
  const score = data.scoreHistory?.length 
    ? (data.scoreHistory[data.scoreHistory.length - 1]?.score ?? data.qualityGate?.score ?? 0) 
    : (data.qualityGate?.score ?? 0);
  
  const scoreEl = document.getElementById('kpi-score');
  if (scoreEl) scoreEl.textContent = score + '%';

  const lintEl = document.getElementById('health-lint');
  if (lintEl) {
    const rawStatus = data.lintReport?.status ?? 'UNKNOWN';
    lintEl.textContent = formatStatusLabel(rawStatus === 'PASSED' ? 'ONLINE' : (rawStatus === 'UNKNOWN' ? 'LOADING' : (rawStatus === 'FAILED' ? 'FAILED' : rawStatus)));
  }

  const depEl = document.getElementById('health-dep');
  if (depEl) {
    const rawStatus = data.dependencyReport?.status ?? 'UNKNOWN';
    depEl.textContent = formatStatusLabel(rawStatus === 'PASSED' ? 'ONLINE' : (rawStatus === 'UNKNOWN' ? 'LOADING' : (rawStatus === 'FAILED' ? 'FAILED' : rawStatus)));
  }

  // Count active technical debts safely
  let totalDebtCount = 0;
  const debtTbody = document.querySelector('#debt-table tbody');
  if (debtTbody) {
    debtTbody.innerHTML = ''; // Keep safe, clear previous rows
    
    const debts = data.technicalDebt?.technicalDebt || {};
    Object.entries(debts).forEach(([mod, items]) => {
      if (Array.isArray(items)) {
        items.forEach(debt => {
          totalDebtCount++;
          const tr = document.createElement('tr');
          const severity = debt.severity ?? 'MEDIUM';
          const severityClass = severity.toLowerCase() === 'high' ? 'critical' : (severity.toLowerCase() === 'medium' ? 'medium' : 'low');
          
          tr.innerHTML = `
            <td><span class="badge" style="background:#121214; color:#fff; border:1px solid var(--border); font-size:0.82rem;">${mod}</span></td>
            <td style="color:#f4f4f5; font-size:0.88rem; line-height:1.4;">${debt.description ?? debt.title ?? 'Dívida técnica não preenchida'}</td>
            <td><span class="badge ${severityClass}">${severity.toUpperCase()}</span></td>
            <td><span style="font-size:0.82rem; color:var(--text-muted);">${debt.age ?? 'N/A'}</span></td>
          `;
          debtTbody.appendChild(tr);
        });
      }
    });

    if (totalDebtCount === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4" style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:1.5rem;">Nenhum item de dívida técnica em aberto! Compilação limpa.</td>`;
      debtTbody.appendChild(tr);
    }
  }
  const kpiDebtEl = document.getElementById('kpi-debt');
  if (kpiDebtEl) kpiDebtEl.textContent = totalDebtCount;

  // Process module risk dynamically based on module definitions or default fallbacks
  let criticalCount = 0;
  const modTbody = document.querySelector('#modules-table tbody');
  if (modTbody) {
    modTbody.innerHTML = '';
    const modules = data.registry?.modules ?? {};
    const entries = Object.entries(modules);
    
    entries.forEach(([mod, info]) => {
      const maturity = info?.maturity ?? 'UNKNOWN';
      const risk = maturity === 'STABLE' ? 'BAIXO' : (maturity === 'MIGRATION' ? 'MÉDIO' : 'ALTO'); 
      if (risk === 'ALTO') criticalCount++;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${mod}</strong></td>
        <td><span class="badge ${maturity.toLowerCase()}">${maturity}</span></td>
        <td><span class="badge ${risk === 'BAIXO' ? 'low' : (risk === 'MÉDIO' ? 'medium' : 'critical')}">${risk}</span></td>
        <td>${info?.lastAudited ?? 'N/A'}</td>
        <td><span style="color:var(--success); font-weight:600; font-size:0.85rem;">Conforme</span></td>
      `;
      modTbody.appendChild(tr);
    });

    if (entries.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); font-size:0.85rem; padding:1.5rem;">Nenhum módulo registrado no estado atual.</td>`;
      modTbody.appendChild(tr);
    }
  }
  const kpiRiskEl = document.getElementById('kpi-risk');
  if (kpiRiskEl) kpiRiskEl.textContent = criticalCount;

  // 1. Lint summary & Dependency status labels
  const lintSummaryEl = document.getElementById('health-lint-summary');
  if (lintSummaryEl) {
    const totalViolations = data.lintReport?.summary?.totalViolations ?? 0;
    lintSummaryEl.textContent = `${totalViolations} violações identificadas`;
  }

  const depSummaryEl = document.getElementById('health-dep-summary');
  if (depSummaryEl) {
    const totalViolations = data.dependencyReport?.totalDependencyViolations ?? data.dependencyReport?.summary?.totalViolations ?? 0;
    depSummaryEl.textContent = `${totalViolations} violações identificadas`;
  }

  // 2. Populate Architecture Decisions List (ADRs)
  const adrList = document.getElementById('adr-list');
  if (adrList) {
    adrList.innerHTML = '';
    const decisions = data.decisions?.architectural_decisions || [];
    decisions.forEach(dec => {
      const li = document.createElement('li');
      li.style.marginBottom = '1rem';
      
      const badgeStyle = (dec.status ?? 'APPROVED').toUpperCase() === 'APPROVED' ? 'low' : 'medium';
      
      li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
          <strong style="color:#fff; font-size:0.95rem;">${dec.id ?? 'ADR'}: ${dec.title}</strong>
          <span class="badge ${badgeStyle}">${dec.status ?? 'APROVADA'}</span>
        </div>
        <p style="margin:0 0 0.25rem 0; font-size:0.85rem; color:var(--text-muted); line-height:1.45;">${dec.decision ?? 'Nenhuma descrição estipulada'}</p>
        <span style="font-size:0.75rem; color:var(--primary); font-weight:bold;">Módulo: ${dec.module || 'Global'}</span>
      `;
      adrList.appendChild(li);
    });

    if (decisions.length === 0) {
      adrList.innerHTML = `<li style="text-align:center; color:var(--text-muted); list-style:none; padding:1.5rem; font-size:0.85rem;">Nenhuma decisão de arquitetura registrada nos sistemas ativos.</li>`;
    }
  }

  // 3. Populate Evolution Timeline
  const timelineList = document.getElementById('timeline-list');
  if (timelineList) {
    timelineList.innerHTML = '';
    const scoreHistory = data.scoreHistory || [];
    scoreHistory.forEach(item => {
      const li = document.createElement('li');
      li.style.marginBottom = '0.8rem';
      li.innerHTML = `
        <div style="display:flex; justify-content:space-between;">
          <strong style="color:#fff; font-size:0.9rem;">Versão ${item.version ?? '0.0.0'} (${item.releaseChannel || 'Beta'})</strong>
          <span style="color:var(--text-muted); font-size:0.82rem;">${item.date ?? 'N/A'}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.25rem;">
          <span style="color:#a1a1aa; font-size:0.82rem;">Total de Arquivos Mapeados: ${item.scannedFiles ?? 0}</span>
          <span class="badge approved">Score: ${item.score ?? 0}%</span>
        </div>
      `;
      timelineList.appendChild(li);
    });

    if (scoreHistory.length === 0) {
      timelineList.innerHTML = `<li style="text-align:center; color:var(--text-muted); list-style:none; font-size:0.85rem; padding:1.5rem;">Nenhuma certificação de lançamento rastreada nos logs de histórico.</li>`;
    }
  }

  // 4. Populate Dependency Violations Detail Table
  const bdepTbody = document.querySelector('#health-dep-table tbody');
  if (bdepTbody) {
    bdepTbody.innerHTML = '';
    const violations = data.dependencyReport?.violations || [];
    violations.forEach(v => {
      const fileName = v.file ?? 'N/A';
      const innerV = v.violations || [];
      innerV.forEach(iv => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><code>${fileName}</code></td>
          <td><span class="badge danger">${iv.layer ?? 'N/A'}</span></td>
          <td><span style="color:#ef4444; font-size:0.85rem;">${iv.message ?? iv.import ?? 'N/A'}</span></td>
        `;
        bdepTbody.appendChild(tr);
      });
    });
    if (violations.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.85rem;">Nenhuma violação de dependência encontrada. Arquitetura de sistema belamente modular!</td>`;
      bdepTbody.appendChild(tr);
    }
  }

  // 5. Populate Structural Breaking Changes Detail Table
  const bbcTbody = document.querySelector('#health-bc-table tbody');
  if (bbcTbody) {
    bbcTbody.innerHTML = '';
    const findings = data.breakingChangeReport?.findings || [];
    findings.forEach(f => {
      const tr = document.createElement('tr');
      const sev = f.severity ?? 'warning';
      tr.innerHTML = `
        <td><span class="badge ${sev.toLowerCase()}">${sev.toUpperCase()}</span></td>
        <td><code>${f.module ?? 'N/A'}</code></td>
        <td style="color:#cbd5e1; font-size:0.88rem; line-height:1.4;">${f.message ?? f.description ?? 'Anomalia identificada'}</td>
      `;
      bbcTbody.appendChild(tr);
    });
    if (findings.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.85rem;">Nenhuma anomalia estrutural ou configuração de quebra de camada detectada.</td>`;
      bbcTbody.appendChild(tr);
    }
  }

  // Populate new Wear Core Intelligence Archive System panels
  populateArchiveTelemetrySystem(data);
  populateWearCoreInsights(data);
  populateAiKnowledgeCenterSystem(data);
}

/**
 * Renders the interactive, fully queryable Archive, Tracker, and AI pages.
 */
function populateArchiveTelemetrySystem(data) {
  const archData = data.wearCoreArchive || {
    currentFocus: {},
    stateExportSnapshot: {},
    knowledgeExportSnapshot: {},
    versionedCatalog: [],
    inventoryCount: 0
  };

  // 1. Current Wear Core Sprint Focus UI Binding
  const focus = archData.currentFocus || {};
  const focusPriorityEl = document.getElementById('focus-priority');
  if (focusPriorityEl) {
    const rawPriority = focus.priority ?? 'HIGH';
    focusPriorityEl.textContent = rawPriority === 'HIGH' ? 'ALTA PRIORIDADE' : 'MÉDIA PRIORIDADE';
    focusPriorityEl.className = `badge ${rawPriority.toLowerCase() === 'high' ? 'danger' : 'warning'}`;
  }
  const focusObjectiveEl = document.getElementById('focus-objective');
  if (focusObjectiveEl) {
    focusObjectiveEl.textContent = focus.currentObjective ?? "Habilitar arquivos inteligentes automatizados, inventário de arquivos e registros de ações do Google AI Studio.";
  }
  const focusFeatureEl = document.getElementById('focus-feature');
  if (focusFeatureEl) {
    focusFeatureEl.textContent = focus.activeFeature ?? "Sistema de Arquivamento Inteligente do Wear Core";
  }
  const focusBlockersEl = document.getElementById('focus-blockers');
  if (focusBlockersEl) {
    focusBlockersEl.textContent = focus.blockages ?? "Nenhum. Todo o sistema de módulos está compilando de forma limpa.";
  }

  const focusStepsEl = document.getElementById('focus-steps');
  if (focusStepsEl) {
    focusStepsEl.innerHTML = '';
    const steps = focus.nextSteps || [
      "Construir visualizações de páginas responsivas no painel AIS apresentando explorador de arquivos e ações de IA.",
      "Garantir downloads seguros pré-carregados das saídas em JSON state-export e knowledge-export.",
      "Demonstrar regressão zero código utilizando regras consolidadas do sistema."
    ];
    steps.forEach(st => {
      const li = document.createElement('li');
      li.style.marginBottom = '0.4rem';
      li.innerHTML = `<strong>[Pendente]</strong> ${st}`;
      focusStepsEl.appendChild(li);
    });
  }

  // 2. Project Explorer Files list
  const explorerTbody = document.querySelector('#explorer-table tbody');
  const inventory = archData.knowledgeExportSnapshot?.inventory || [];
  
  // Render search-filtered file inventory rows
  const renderExplorerRows = (files, filterTerm = '') => {
    if (!explorerTbody) return;
    explorerTbody.innerHTML = '';
    
    const filtered = files.filter(f => {
      if (!filterTerm) return true;
      const term = filterTerm.toLowerCase();
      return (
        f.path.toLowerCase().includes(term) ||
        f.module.toLowerCase().includes(term) ||
        f.type.toLowerCase().includes(term) ||
        f.name.toLowerCase().includes(term) ||
        f.technicalSummary.toLowerCase().includes(term) ||
        f.aiSummary.toLowerCase().includes(term)
      );
    });

    filtered.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span class="badge" style="background:#1e293b; color:#cbd5e1; border:1px solid #334155; font-size:0.82rem;">${f.module}</span></td>
        <td><code style="color:#60a5fa; font-size:0.85rem;">${f.path}</code></td>
        <td><span style="font-size:0.82rem; color:#94a3b8;">${f.type}</span></td>
        <td><code>${(f.size / 1024).toFixed(2)} KB</code></td>
        <td style="color:#e2e8f0; font-size:0.88rem; line-height:1.4;">${f.technicalSummary}</td>
        <td style="color:#cbd5e1; font-size:0.88rem; line-height:1.4; font-style:italic;">${f.aiSummary}</td>
      `;
      explorerTbody.appendChild(tr);
    });

    if (filtered.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem; font-size:0.85rem;">Nenhum arquivo corresponde ao termo do filtro de busca.</td>`;
      explorerTbody.appendChild(tr);
    }
  };

  renderExplorerRows(inventory);

  // Set up explorer key stats KPIs
  const filesCountEl = document.getElementById('explorer-kpi-files');
  if (filesCountEl) filesCountEl.textContent = inventory.length;

  const modulesCountEl = document.getElementById('explorer-kpi-modules');
  if (modulesCountEl) {
    const mods = [...new Set(inventory.map(f => f.module))];
    modulesCountEl.textContent = mods.length;
  }

  const avgSizeEl = document.getElementById('explorer-kpi-size');
  if (avgSizeEl) {
    if (inventory.length > 0) {
      const totalBytes = inventory.reduce((acc, current) => acc + current.size, 0);
      avgSizeEl.textContent = `${((totalBytes / inventory.length) / 1024).toFixed(1)} KB`;
    } else {
      avgSizeEl.textContent = '0 KB';
    }
  }

  // Active live binding of the Explorer search element
  const searchInput = document.getElementById('explorer-search');
  if (searchInput) {
    // Clear previous event listener mappings by cloning
    const cloned = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(cloned, searchInput);
    
    cloned.addEventListener('input', (e) => {
      renderExplorerRows(inventory, e.target.value);
    });
  }

  // 3. File Level History Tracking Visualizer
  const fileHistoryTbody = document.querySelector('#file-history-table tbody');
  if (fileHistoryTbody) {
    fileHistoryTbody.innerHTML = '';
    const fileHistory = archData.knowledgeExportSnapshot?.fileHistory || [];
    
    fileHistory.reverse().forEach(ev => {
      const tr = document.createElement('tr');
      
      let actionTranslated = ev.action;
      let actionBadgeColor = '#3b82f6';
      if (ev.action === 'CREATION') {
        actionTranslated = 'CRIAÇÃO';
        actionBadgeColor = '#10b981';
      } else if (ev.action === 'DELETION') {
        actionTranslated = 'EXCLUSÃO';
        actionBadgeColor = '#ef4444';
      } else if (ev.action === 'MODIFICATION') {
        actionTranslated = 'EDIÇÃO';
        actionBadgeColor = '#c084fc';
      }

      tr.innerHTML = `
        <td style="font-size:0.82rem; color:#64748b; white-space:nowrap;">${new Date(ev.timestamp).toLocaleString()}</td>
        <td><span class="badge" style="background:${actionBadgeColor}; color:#fff; font-size:0.75rem;">${actionTranslated}</span></td>
        <td><code style="color:#60a5fa; font-size:0.85rem;">${ev.path}</code></td>
        <td style="font-weight:600; color:#cbd5e1; font-size:0.85rem;">${ev.author}</td>
        <td style="color:#cbd5e1; font-size:0.88rem; line-height:1.4;">${ev.description}</td>
      `;
      fileHistoryTbody.appendChild(tr);
    });

    if (fileHistory.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.85rem;">Nenhuma modificação de arquivo registrada nesta sessão ainda. Execute operações nos arquivos para visualizar o histórico.</td>`;
      fileHistoryTbody.appendChild(tr);
    }
  }

  // 4. Structure evolution timeline list
  const structureTimelineEl = document.getElementById('structure-evolution-timeline');
  if (structureTimelineEl) {
    structureTimelineEl.innerHTML = '';
    const timeline = archData.knowledgeExportSnapshot?.structureTimeline || [];
    
    timeline.reverse().forEach(item => {
      const li = document.createElement('li');
      li.style.listStyle = 'none';
      li.style.marginBottom = '1.2rem';
      li.style.paddingLeft = '1.5rem';
      li.style.borderLeft = '3px solid #10b981';
      li.style.position = 'relative';
      
      const dot = document.createElement('div');
      dot.style.position = 'absolute';
      dot.style.left = '-7px';
      dot.style.top = '5px';
      dot.style.width = '11px';
      dot.style.height = '11px';
      dot.style.borderRadius = '50%';
      dot.style.background = '#10b981';
      li.appendChild(dot);
      
      li.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
          <strong style="color:#f8fafc; font-size:0.95rem;">Atualização de Estrutura Física / Pasta</strong>
          <span style="font-size:0.82rem; color:#64748b;">${new Date(item.timestamp).toLocaleString()}</span>
        </div>
        <p style="margin: 0.25rem 0; color:#cbd5e1; font-size:0.9rem; line-height:1.4;">${item.description}</p>
        <span class="badge" style="background:#121214; color:#10b981; border:1px solid #10b981; font-size:0.75rem;">Módulo: ${item.module || 'root'}</span>
      `;
      structureTimelineEl.appendChild(li);
    });

    if (timeline.length === 0) {
      structureTimelineEl.innerHTML = `<li style="text-align:center; color:var(--text-muted); list-style:none; font-size:0.85rem;">Nenhuma reorganização estrutural registrada ainda.</li>`;
    }
  }

  // 5. Google AI Studio actions logger Visualizer
  const aiActionsTbody = document.querySelector('#ai-actions-table tbody');
  if (aiActionsTbody) {
    aiActionsTbody.innerHTML = '';
    const aiActions = archData.knowledgeExportSnapshot?.aiActionsLog || [];
    
    aiActions.reverse().forEach(act => {
      const tr = document.createElement('tr');
      
      let modulesBadges = (act.modulesAffected || []).map(m => 
        `<span class="badge" style="background:#111827; color:#cbd5e1; border:1px solid #374151; font-size:0.7rem; margin-right:0.2rem; display:inline-block;">${m}</span>`
      ).join('');

      let filesFormat = (act.filesAffected || []).map(f => 
        `<div style="font-size:0.75rem; color:#60a5fa; font-family:monospace; margin-bottom:0.2rem;">• ${f}</div>`
      ).join('');

      tr.innerHTML = `
        <td style="font-size:0.82rem; color:#64748b; white-space:nowrap;">${new Date(act.timestamp).toLocaleString()}</td>
        <td><strong style="color:#f87171; font-size:0.85rem;"><code>${act.action}</code></strong></td>
        <td>
          <div style="margin-bottom:0.4rem;">${modulesBadges}</div>
          <div style="max-height:100px; overflow-y:auto;">${filesFormat}</div>
        </td>
        <td style="color:#cbd5e1; font-size:0.88rem; line-height:1.4;">${act.summary}</td>
        <td style="color:#94a3b8; font-size:0.85rem; line-height:1.4;">${act.reason}</td>
        <td><span class="badge approved" style="font-size:0.78rem; text-align:center;">${act.impact}</span></td>
      `;
      aiActionsTbody.appendChild(tr);
    });

    if (aiActions.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="6" style="text-align:center; color:var(--text-muted); padding:1rem; font-size:0.85rem;">Nenhuma ação do Google AI Studio catalogada.</td>`;
      aiActionsTbody.appendChild(tr);
    }
  }

  // 6. Project Snapshot Schema View
  const stateRawEl = document.getElementById('state-raw-view');
  if (stateRawEl && archData.stateExportSnapshot) {
    stateRawEl.textContent = JSON.stringify(archData.stateExportSnapshot, null, 2);
  }

  // 7. Project Memory Schema View + Comparative Catalog Selector
  const knowledgeRawEl = document.getElementById('knowledge-raw-view');
  if (knowledgeRawEl && archData.knowledgeExportSnapshot) {
    knowledgeRawEl.textContent = JSON.stringify(archData.knowledgeExportSnapshot, null, 2);
  }

  const verSelect = document.getElementById('export-version-select');
  if (verSelect && archData.versionedCatalog) {
    // Filter and display distinct knowledge-export version names in selector
    const knowledgeVersions = archData.versionedCatalog.filter(c => c.type === 'knowledge');
    
    // Clear and build options
    verSelect.innerHTML = '<option value="">Último Estado em Tempo de Execução</option>';
    knowledgeVersions.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.version;
      opt.textContent = `Versão ${v.version} (Instantâneo do Histórico)`;
      verSelect.appendChild(opt);
    });

    // Add visual listener to enable absolute comparative downloads
    verSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const knowledgeTitleEl = document.getElementById('knowledge-title');
      
      if (!val) {
        knowledgeRawEl.textContent = JSON.stringify(archData.knowledgeExportSnapshot, null, 2);
        if (knowledgeTitleEl) knowledgeTitleEl.textContent = "Conteúdo do Arquivo de Conhecimento: wear-core-knowledge-export.json";
      } else {
        const historicalUrl = resolveAisUrl(`exports/wear-core-knowledge-export-${val}.json`);
        knowledgeRawEl.textContent = `// Contatando o banco inteligente para carregar o instantâneo histórico da versão ${val}...`;
        
        fetch(historicalUrl)
          .then(r => {
            if (!r.ok) throw new Error(`HTTP Status ${r.status}`);
            return r.json();
          })
          .then(histData => {
            knowledgeRawEl.textContent = JSON.stringify(histData, null, 2);
            if (knowledgeTitleEl) knowledgeTitleEl.textContent = `Payload Histórico do Lançamento de Arquivos wear-core-knowledge-export-${val}.json`;
          })
          .catch(err => {
            knowledgeRawEl.textContent = `// Falha ao obter relatórios históricos na subpasta de versão ${val}\n// Erro: ${err.message}\n// O arquivo pode estar sendo consolidado ou compactado temporariamente no servidor remetente. `;
          });
      }
    });
  }
}

/**
 * Triggers safe chart redraw/update event
 */
function triggerChartsUpdate() {
  const event = new CustomEvent('aisStateUpdated');
  window.dispatchEvent(event);
}

/**
 * Renders Wear Core Insights Engine diagnostic findings, issues, corrections, and advancement opportunities.
 */
function populateWearCoreInsights(data) {
  const archData = data.wearCoreArchive || {};
  const insights = archData.insights || {
    issues: [],
    corrections: [],
    improvements: { ux: [], ui: [], documentation: [], architecture: [], performance: [], history: [], exportation: [], aiFriendly: [] },
    suggestedKpis: []
  };

  // KPIs
  const kpiIssues = document.getElementById('insights-kpi-issues');
  if (kpiIssues) kpiIssues.textContent = insights.issues?.length || 0;

  const kpiCritical = document.getElementById('insights-kpi-critical');
  if (kpiCritical) {
    const criticalCount = (insights.issues || []).filter(i => i.priority === 'CRITICAL' || i.priority === 'HIGH').length;
    kpiCritical.textContent = criticalCount;
  }

  const kpiCorrections = document.getElementById('insights-kpi-corrections');
  if (kpiCorrections) kpiCorrections.textContent = insights.corrections?.length || 0;

  const kpiOpportunities = document.getElementById('insights-kpi-opportunities');
  if (kpiOpportunities) {
    let optCount = 0;
    const imp = insights.improvements || {};
    Object.keys(imp).forEach(k => {
      optCount += (imp[k] || []).length;
    });
    kpiOpportunities.textContent = optCount;
  }

  // Issues Table
  const issuesTbody = document.getElementById('insights-issues-tbody');
  if (issuesTbody) {
    issuesTbody.innerHTML = '';
    const issues = insights.issues || [];
    issues.forEach(issue => {
      const tr = document.createElement('tr');
      
      let mappedPriorityText = issue.priority;
      if (issue.priority === 'CRITICAL') mappedPriorityText = 'CRÍTICA';
      if (issue.priority === 'HIGH') mappedPriorityText = 'ALTA';
      if (issue.priority === 'MEDIUM') mappedPriorityText = 'MÉDIA';
      if (issue.priority === 'LOW') mappedPriorityText = 'BAIXA';

      const priorityClass = issue.priority === 'CRITICAL' ? 'danger' : (issue.priority === 'HIGH' ? 'warning' : 'info');
      tr.innerHTML = `
        <td><span class="badge ${priorityClass}" style="font-size:0.75rem; font-weight:bold;">${mappedPriorityText}</span></td>
        <td>
          <strong style="color:#f1f5f9; font-size:0.92rem;">${issue.title}</strong>
          <div style="font-size:0.82rem; color:#94a3b8; margin-top:0.25rem;">${issue.description}</div>
        </td>
        <td><span style="font-size:0.85rem; color:#cbd5e1; line-height:1.4;">${issue.impact}</span></td>
        <td><code style="color:#fdba74; font-size:0.82rem;">${issue.cause}</code></td>
        <td><span style="font-size:0.85rem; color:#34d399; font-weight:500;">Ver regras de correção de ${issue.id}</span></td>
      `;
      issuesTbody.appendChild(tr);
    });

    if (issues.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem; font-size:0.85rem;">✨ Todo o sistema está sanitizado! Nenhuma desobediência identificada.</td>`;
      issuesTbody.appendChild(tr);
    }
  }

  // Corrections Table
  const correctionsTbody = document.getElementById('insights-corrections-tbody');
  if (correctionsTbody) {
    correctionsTbody.innerHTML = '';
    const corrections = insights.corrections || [];
    corrections.forEach(corr => {
      const tr = document.createElement('tr');
      
      const filesFormatted = (corr.filesInvolved || []).map(f => 
        `<div style="font-family:monospace; font-size:0.75rem; color:#60a5fa; margin-bottom:0.2rem;">• ${f}</div>`
      ).join('');

      tr.innerHTML = `
        <td><span class="badge" style="background:#3b82f6; color:#fff; font-size:0.75rem; font-family:monospace;">${corr.issueId}</span></td>
        <td style="color:#f8fafc; font-size:0.88rem; font-weight:500;">${corr.suggestedCorrection}</td>
        <td><span class="badge approved" style="font-size:0.75rem;">${corr.complexity}</span></td>
        <td><div style="max-height:100px; overflow-y:auto;">${filesFormatted || '<span style="color:#64748b; font-size:0.8rem;">Geral / Modular</span>'}</div></td>
        <td style="color:#4ade80; font-size:0.85rem; line-height:1.4;"><span style="font-size:1.1rem; vertical-align:middle; margin-right:0.25rem;">⚡</span>${corr.benefitExpected}</td>
      `;
      correctionsTbody.appendChild(tr);
    });

    if (corrections.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem; font-size:0.85rem;">Nenhuma correção ativa recomendada pelo sistema.</td>`;
      correctionsTbody.appendChild(tr);
    }
  }

  // Improvements Grid builder helper
  const renderImprovementCategory = (containerId, items) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem; text-align:center; font-style:italic;">Nenhuma evolução lançada para esta categoria.</div>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.style.background = '#18181b';
      card.style.border = '1px solid var(--border)';
      card.style.padding = '1rem';
      card.style.borderRadius = '8px';
      card.style.transition = 'all 0.2s';
      
      card.innerHTML = `
        <div style="font-weight:600; font-size:0.9rem; color:#fff; margin-bottom:0.25rem;">${item.title}</div>
        <p style="margin:0 0 0.5rem 0; font-size:0.82rem; color:#a1a1aa; line-height:1.4;">${item.description}</p>
        <span style="font-size:0.75rem; color:#4ade80; font-weight:500; display:flex; align-items:center; gap:0.25rem;">
          <span>🚀 Benefício:</span>
          <span>${item.benefit}</span>
        </span>
      `;
      container.appendChild(card);
    });
  };

  const imp = insights.improvements || {};
  // UX/UI combined
  const uxUiCombined = [...(imp.ux || []), ...(imp.ui || [])];
  renderImprovementCategory('insights-ux-container', uxUiCombined);

  // Performance & Architecture combined
  const perfArchCombined = [...(imp.performance || []), ...(imp.architecture || [])];
  renderImprovementCategory('insights-perf-container', perfArchCombined);

  // Records / History
  renderImprovementCategory('insights-history-container', imp.history || []);

  // AI-Friendly & exports combined
  const aiFriendlyCombined = [...(imp.exportation || []), ...(imp.aiFriendly || [])];
  renderImprovementCategory('insights-ai-container', aiFriendlyCombined);
}

/**
 * Exposes dynamic discovery indexing state details and handles comparisons inside the AI Knowledge Center.
 */
function populateAiKnowledgeCenterSystem(data) {
  const payloadPre = document.getElementById('ai-index-payload');
  if (payloadPre) {
    payloadPre.textContent = "// Iniciando mapeamento inteligente ativo na raiz ai-index.json ...";
    const targetUrl = resolveAisUrl('exports/ai-index.json');
    
    fetch(targetUrl)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP Status ${r.status}`);
        return r.json();
      })
      .then(indexData => {
        payloadPre.textContent = JSON.stringify(indexData, null, 2);
      })
      .catch(err => {
        payloadPre.textContent = JSON.stringify({
          name: "Wear Core AI Knowledge Index",
          status: "Offline",
          error: "Não foi possível carregar a matriz de índice ativo: " + err.message,
          fallback_links: {
            "ai-index": "/exports/ai-index.json",
            "state-export": "/exports/wear-core-state-export.json",
            "knowledge-export": "/exports/wear-core-knowledge-export.json",
            "focus-export": "/exports/wear-core-current-focus.json",
            "actions-export": "/exports/wear-core-ai-actions.json"
          }
        }, null, 2);
      });
  }

  const selector = document.getElementById('knowledge-selector');
  if (selector) {
    selector.innerHTML = '<option value="">-- Escolher Instantâneo Histórico --</option>';
    
    const archData = data.wearCoreArchive || {};
    const versionedCatalog = archData.versionedCatalog || [];
    const knowledgeVersions = versionedCatalog.filter(c => c.type === 'knowledge');
    
    if (knowledgeVersions.length > 0) {
      knowledgeVersions.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.version;
        opt.textContent = `Versão ${v.version} Snapshot (${v.date})`;
        selector.appendChild(opt);
      });
    } else {
      const scoreHistory = data.scoreHistory || [];
      scoreHistory.forEach(s => {
        const vName = s.version.replace(/^v/, '');
        const opt = document.createElement('option');
        opt.value = vName;
        opt.textContent = `Versão ${vName} Snapshot (${s.date})`;
        selector.appendChild(opt);
      });
    }
  }
}

/**
 * Fetch and compare historical versions of files and quality scores
 */
window.compareMetadataVersions = function(version) {
  const panel = document.getElementById('comparative-metrics-panel');
  if (!version) {
    if (panel) panel.style.display = 'none';
    return;
  }
  
  if (panel) panel.style.display = 'block';
  
  const live = window.dashboardData;
  const currentVer = live?.version?.versionName || "1.2.1-wc";
  const currentFiles = live?.wearCoreArchive?.knowledgeExportSnapshot?.inventory?.length || 
                       live?.wearCoreArchive?.inventoryCount || 0;
  const currentScore = live?.qualityGate?.score || 100;
  
  document.getElementById('comp-live-ver').textContent = currentVer;
  document.getElementById('comp-live-files').textContent = currentFiles;
  document.getElementById('comp-live-score').textContent = currentScore + '%';
  
  document.getElementById('comp-past-ver').textContent = version;
  document.getElementById('comp-past-files').textContent = "Buscando...";
  document.getElementById('comp-past-score').textContent = "Buscando...";
  
  const historicalUrl = resolveAisUrl(`exports/wear-core-knowledge-export-${version}.json`);
  fetch(historicalUrl)
    .then(r => {
      if (!r.ok) throw new Error(`HTTP Status ${r.status}`);
      return r.json();
    })
    .then(h => {
      const pastFiles = h?.inventory?.length || 0;
      const pastScore = h?.insights?.suggestedKpis?.find(k => k.name === 'Architecture Score')?.value || 
                       live.scoreHistory?.find(s => s.version === version || s.version === `v${version}`)?.score || "N/A";
      
      document.getElementById('comp-past-files').textContent = pastFiles;
      document.getElementById('comp-past-score').textContent = typeof pastScore === 'number' ? pastScore + '%' : pastScore;
    })
    .catch(err => {
      console.warn("Failed comparison fetch:", err);
      const matchedRecord = live.scoreHistory?.find(s => s.version === version || s.version === `v${version}`);
      if (matchedRecord) {
        document.getElementById('comp-past-files').textContent = "Histórico (Sem Índice)";
        document.getElementById('comp-past-score').textContent = matchedRecord.score + '%';
      } else {
        document.getElementById('comp-past-files').textContent = "N/A";
        document.getElementById('comp-past-score').textContent = "N/A";
      }
    });
}

/**
 * Copy fully-resolved absolute page links or payloads to sharing buffer clipboards
 */
window.shareLink = function(relativeUrl) {
  const origin = window.location.origin;
  const locationPath = window.location.pathname;
  
  let targetUrl = '';
  if (window.location.protocol === 'file:' || !origin || origin === 'null') {
    targetUrl = `https://wear-core-governance.local${relativeUrl}`;
  } else {
    const aisIndex = locationPath.toLowerCase().indexOf('/ais/dashboard');
    if (aisIndex !== -1) {
      const basePath = locationPath.substring(0, aisIndex);
      targetUrl = `${origin}${basePath}${relativeUrl}`;
    } else {
      targetUrl = `${origin}${relativeUrl}`;
    }
  }
  
  navigator.clipboard.writeText(targetUrl)
    .then(() => alert(`Link de Sincronia IA de Wear Core copiado com sucesso:\n${targetUrl}`))
    .catch(() => alert(`Link: ${targetUrl}`));
}
