document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const links = document.querySelectorAll('.nav-link');
  const panes = document.querySelectorAll('.tab-pane');
  const pageTitle = document.getElementById('page-title');

  links.forEach(link => {
    link.addEventListener('click', (e) => {
      links.forEach(l => l.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));
      
      const targetId = e.target.getAttribute('data-target');
      e.target.classList.add('active');
      document.getElementById(targetId).classList.add('active');
      pageTitle.textContent = e.target.textContent.replace(/[^\w\s]/gi, '').trim();
    });
  });

  // Safe initialization of dashboard
  initDashboard();
});

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
    ruleHistory: data.ruleHistory || { ruleHistory: [] }
  };
}

/**
 * Dynamically resolves the single, correct absolute URL scheme for the combined-state.json based on modern location protocols.
 */
function resolveGlobalStateUrl() {
  const origin = window.location.origin;
  const pathname = window.location.pathname;

  console.log("[AIS Path Resolver] Location details:", { origin, pathname, protocol: window.location.protocol });

  // If protocol is file:// (local testing without webserver), we use standard relative fallback
  if (window.location.protocol === 'file:' || !origin || origin === 'null') {
    return '../aggregate/combined-state.json';
  }

  const lowerPath = pathname.toLowerCase();
  
  // Case 1: Match "/ais/dashboard" or "/ais/dashboard/"
  const aisDashboardIndex = lowerPath.indexOf('/ais/dashboard');
  if (aisDashboardIndex !== -1) {
    const basePath = pathname.substring(0, aisDashboardIndex);
    const originalAis = pathname.substring(aisDashboardIndex + 1, aisDashboardIndex + 4);
    return `${origin}${basePath}/${originalAis}/aggregate/combined-state.json`;
  }

  // Case 2: Match "/dashboard"
  const dashboardIndex = lowerPath.indexOf('/dashboard');
  if (dashboardIndex !== -1) {
    const basePath = pathname.substring(0, dashboardIndex);
    return `${origin}${basePath}/aggregate/combined-state.json`;
  }

  // Case 3: Match "/ais"
  const aisIndex = lowerPath.indexOf('/ais');
  if (aisIndex !== -1) {
    const basePath = pathname.substring(0, aisIndex);
    const originalAis = pathname.substring(aisIndex + 1, aisIndex + 4);
    return `${origin}${basePath}/${originalAis}/aggregate/combined-state.json`;
  }

  // Final fallback path mapping
  return `${origin}/ais/aggregate/combined-state.json`;
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
        statBanner.style.color = '#ef4444';
        statBanner.style.border = '1px solid #ef4444';
        statBanner.textContent = '⚠️ STATE RETRIEVAL ERROR: Fallback default loaded';
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
      statBanner.style.color = '#ef4444';
      statBanner.style.border = '1px solid #ef4444';
      statBanner.textContent = '❌ BUILD BLOCKED (Architecture Violations)';
    } else if (status === 'APPROVED' || status === 'PASSED') {
      statBanner.style.display = 'block';
      statBanner.style.backgroundColor = 'rgba(16, 185, 129, 0.2)';
      statBanner.style.color = '#10b981';
      statBanner.style.border = '1px solid #10b981';
      statBanner.textContent = '✅ ARCHITECTURE PASSED';
    } else {
      statBanner.style.display = 'block';
      statBanner.style.backgroundColor = 'rgba(115, 115, 115, 0.2)';
      statBanner.style.color = '#a3a3a3';
      statBanner.style.border = '1px solid #a3a3a3';
      statBanner.textContent = `⚪ MODULE STATE: ${status}`;
    }
  }

  // Map general stats
  const score = data.scoreHistory?.length 
    ? (data.scoreHistory[data.scoreHistory.length - 1]?.score ?? data.qualityGate?.score ?? 0) 
    : (data.qualityGate?.score ?? 0);
  
  const scoreEl = document.getElementById('kpi-score');
  if (scoreEl) scoreEl.textContent = score + '%';

  const lintEl = document.getElementById('health-lint');
  if (lintEl) lintEl.textContent = data.lintReport?.status ?? 'UNKNOWN';

  const depEl = document.getElementById('health-dep');
  if (depEl) depEl.textContent = data.dependencyReport?.status ?? 'UNKNOWN';

  // Count active technical debts safely
  let totalDebtCount = 0;
  const debtTbody = document.querySelector('#debt-table tbody');
  if (debtTbody) {
    debtTbody.innerHTML = ''; // Keep safe, clear previous rows
    const tdMap = data.technicalDebt?.technicalDebt ?? {};
    Object.entries(tdMap).forEach(([mod, items]) => {
      if (Array.isArray(items)) {
        items.forEach(item => {
          totalDebtCount++;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td><code>${mod}</code></td>
            <td>${item?.description ?? "No details available"}</td>
            <td><span class="badge ${(item?.severity ?? 'LOW').toLowerCase()}">${item?.severity ?? 'LOW'}</span></td>
            <td>${item?.createdAt ?? 'N/A'}</td>
          `;
          debtTbody.appendChild(tr);
        });
      }
    });
    
    if (totalDebtCount === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="4" style="text-align:center; color:var(--text-muted);">No open technical debt items found! Clean build.</td>`;
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
      const risk = maturity === 'STABLE' ? 'LOW' : (maturity === 'MIGRATION' ? 'MEDIUM' : 'HIGH'); 
      if (risk === 'CRITICAL') criticalCount++;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${mod}</strong></td>
        <td><span class="badge ${maturity.toLowerCase()}">${maturity}</span></td>
        <td><span class="badge ${risk.toLowerCase()}">${risk}</span></td>
        <td>${info?.lastAudited ?? 'N/A'}</td>
        <td><span style="color:var(--success)">Conforme</span></td>
      `;
      modTbody.appendChild(tr);
    });

    if (entries.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted);">No modules registered in current state.</td>`;
      modTbody.appendChild(tr);
    }
  }
  const kpiRiskEl = document.getElementById('kpi-risk');
  if (kpiRiskEl) kpiRiskEl.textContent = criticalCount;

  // 1. Lint summary & Dependency status labels
  const lintSummaryEl = document.getElementById('health-lint-summary');
  if (lintSummaryEl) {
    const totalViolations = data.lintReport?.summary?.totalViolations ?? 0;
    lintSummaryEl.textContent = `${totalViolations} violations identified`;
  }

  const depSummaryEl = document.getElementById('health-dep-summary');
  if (depSummaryEl) {
    const totalViolations = data.dependencyReport?.totalDependencyViolations ?? 0;
    depSummaryEl.textContent = `${totalViolations} violations identified`;
  }

  // 2. Populate ADR (decision) list
  const adrList = document.getElementById('adr-list');
  if (adrList) {
    adrList.innerHTML = '';
    const decisions = data.decisions?.architectural_decisions || [];
    decisions.forEach(dec => {
      const li = document.createElement('li');
      li.style.listStyle = 'none';
      li.style.marginBottom = '1.25rem';
      li.style.padding = '1.2rem';
      li.style.background = 'rgba(30, 41, 59, 0.4)';
      li.style.border = '1px solid #334155';
      li.style.borderRadius = '8px';
      
      li.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem;">
          <strong style="color:#60a5fa; font-size:1.05rem;">${dec.id}: ${dec.topic}</strong>
          <span class="badge ${dec.status?.toLowerCase() ?? 'approved'}">${dec.status ?? 'APPROVED'}</span>
        </div>
        <p style="margin: 0.25rem 0; color:#cbd5e1; font-size:0.92rem; line-height:1.4;">${dec.description}</p>
        <p style="margin: 0.5rem 0 0 0; color:#94a3b8; font-size:0.85rem; line-height:1.4;"><strong>Rationale:</strong> ${dec.rationale || 'N/A'}</p>
        <div style="font-size:0.78rem; color:#64748b; margin-top:0.6rem; text-align:right;">Evaluated on: ${dec.date}</div>
      `;
      adrList.appendChild(li);
    });
    if (decisions.length === 0) {
      adrList.innerHTML = `<li style="text-align:center; color:var(--text-muted); list-style:none; padding:1.5rem;">No architecture decisions registered inside active systems.</li>`;
    }
  }

  // 3. Populate Evolution Timeline
  const timelineList = document.getElementById('timeline-list');
  if (timelineList) {
    timelineList.innerHTML = '';
    const history = data.scoreHistory || [];
    history.forEach(item => {
      const li = document.createElement('li');
      li.style.listStyle = 'none';
      li.style.marginBottom = '1.2rem';
      li.style.paddingLeft = '1.5rem';
      li.style.borderLeft = '3px solid #3b82f6';
      li.style.position = 'relative';
      
      const dot = document.createElement('div');
      dot.style.position = 'absolute';
      dot.style.left = '-7px';
      dot.style.top = '5px';
      dot.style.width = '11px';
      dot.style.height = '11px';
      dot.style.borderRadius = '50%';
      dot.style.background = item.score >= 95 ? '#10b981' : (item.score >= 80 ? '#3b82f6' : '#ef4444');
      li.appendChild(dot);
      
      li.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.3rem;">
          <strong style="color:#f8fafc; font-size:1rem;">Version ${item.version}</strong>
          <span style="font-size:0.82rem; color:#64748b;">${item.date}</span>
        </div>
        <div style="display:flex; gap:1.5rem; margin-top:0.3rem; font-size:0.85rem;">
          <span style="color:#94a3b8;">Score: <strong style="color:#60a5fa;">${item.score}%</strong></span>
          ${item.errors !== undefined ? `<span style="color:#94a3b8;">Errors: <strong style="color:#ef4444;">${item.errors}</strong></span>` : ''}
          ${item.warnings !== undefined ? `<span style="color:#94a3b8;">Warnings: <strong style="color:#f59e0b;">${item.warnings}</strong></span>` : ''}
        </div>
      `;
      timelineList.appendChild(li);
    });
    if (history.length === 0) {
      timelineList.innerHTML = `<li style="text-align:center; color:var(--text-muted); list-style:none;">No release certifications tracked in history logs.</li>`;
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
      tr.innerHTML = `<td colspan="3" style="text-align:center; color:var(--text-muted); padding:1rem;">No dependency violations found. Beautifully modular system architecture!</td>`;
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
        <td style="color:#cbd5e1; font-size:0.88rem; line-height:1.4;">${f.message ?? f.description ?? 'Anomaly identified'}</td>
      `;
      bbcTbody.appendChild(tr);
    });
    if (findings.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="3" style="text-align:center; color:var(--text-muted); padding:1rem;">No structural anomalies or breaking layer configurations detected.</td>`;
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
    focusPriorityEl.textContent = `${focus.priority ?? 'HIGH'} PRIORITY`;
    focusPriorityEl.className = `badge ${focus.priority?.toLowerCase() === 'high' ? 'danger' : 'warning'}`;
  }
  const focusObjectiveEl = document.getElementById('focus-objective');
  if (focusObjectiveEl) {
    focusObjectiveEl.textContent = focus.currentObjective ?? "Enable automated knowledge archives, file catalogs, and Google AI Studio action logging.";
  }
  const focusFeatureEl = document.getElementById('focus-feature');
  if (focusFeatureEl) {
    focusFeatureEl.textContent = focus.activeFeature ?? "Wear Core Intelligence Archive System";
  }
  const focusBlockersEl = document.getElementById('focus-blockers');
  if (focusBlockersEl) {
    focusBlockersEl.textContent = focus.blockages ?? "None. System structures are compiling cleanly.";
  }

  const focusStepsEl = document.getElementById('focus-steps');
  if (focusStepsEl) {
    focusStepsEl.innerHTML = '';
    const steps = focus.nextSteps || [
      "Construct responsive visual pages on AIS dashboard depicting file explorer and AI actions database.",
      "Ensure fully preloaded high-fidelity state-export and knowledge-export JSON downloads.",
      "Demonstrate zero code regression using unified module rules."
    ];
    steps.forEach(st => {
      const li = document.createElement('li');
      li.style.marginBottom = '0.4rem';
      li.innerHTML = `<strong>[Pending]</strong> ${st}`;
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
      tr.innerHTML = `<td colspan="6" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No files matched the search filter term.</td>`;
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
      const actionBadgeColor = ev.action === 'CREATION' ? '#10b981' : (ev.action === 'DELETION' ? '#ef4444' : '#3b82f6');
      tr.innerHTML = `
        <td style="font-size:0.82rem; color:#64748b; white-space:nowrap;">${new Date(ev.timestamp).toLocaleString()}</td>
        <td><span class="badge" style="background:${actionBadgeColor}; color:#fff; font-size:0.75rem;">${ev.action}</span></td>
        <td><code style="color:#60a5fa; font-size:0.85rem;">${ev.path}</code></td>
        <td style="font-weight:600; color:#cbd5e1; font-size:0.85rem;">${ev.author}</td>
        <td style="color:#cbd5e1; font-size:0.88rem; line-height:1.4;">${ev.description}</td>
      `;
      fileHistoryTbody.appendChild(tr);
    });

    if (fileHistory.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); padding:1rem;">No file modifications logged in this session yet. Execute file operations to view history.</td>`;
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
          <strong style="color:#f8fafc; font-size:0.95rem;">Module Action / Structure Update</strong>
          <span style="font-size:0.82rem; color:#64748b;">${new Date(item.timestamp).toLocaleString()}</span>
        </div>
        <p style="margin: 0.25rem 0; color:#cbd5e1; font-size:0.9rem; line-height:1.4;">${item.description}</p>
        <span class="badge" style="background:#1e293b; color:#10b981; border:1px solid #10b981; font-size:0.75rem;">${item.module || 'root'}</span>
      `;
      structureTimelineEl.appendChild(li);
    });

    if (timeline.length === 0) {
      structureTimelineEl.innerHTML = `<li style="text-align:center; color:var(--text-muted); list-style:none;">No structural reorganizations recorded yet.</li>`;
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
        <td><strong style="color:#ef4444; font-size:0.85rem;"><code>${act.action}</code></strong></td>
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
      tr.innerHTML = `<td colspan="6" style="text-align:center; color:var(--text-muted); padding:1rem;">No AI Studio actions cataloged.</td>`;
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
    verSelect.innerHTML = '<option value="">Latest Live Runtime State</option>';
    knowledgeVersions.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.version;
      opt.textContent = `Version ${v.version} Archive Snapshot`;
      verSelect.appendChild(opt);
    });

    // Add visual listener to enable absolute comparative downloads
    verSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      const knowledgeTitleEl = document.getElementById('knowledge-title');
      
      if (!val) {
        knowledgeRawEl.textContent = JSON.stringify(archData.knowledgeExportSnapshot, null, 2);
        if (knowledgeTitleEl) knowledgeTitleEl.textContent = "Active knowledge-export.json Payload Dynamic Content";
      } else {
        const historicalUrl = `../../ais/exports/wear-core-knowledge-export-${val}.json`;
        knowledgeRawEl.textContent = `// Contacting active database to fetch historical snapshot of version ${val}...`;
        
        fetch(historicalUrl)
          .then(r => {
            if (!r.ok) throw new Error(`HTTP Status ${r.status}`);
            return r.json();
          })
          .then(histData => {
            knowledgeRawEl.textContent = JSON.stringify(histData, null, 2);
            if (knowledgeTitleEl) knowledgeTitleEl.textContent = `Historical wear-core-knowledge-export-${val}.json Archive Payload`;
          })
          .catch(err => {
            knowledgeRawEl.textContent = `// Failed to retrieve historical archive of version ${val}\n// Error: ${err.message}\n// File may not be fully synced or is currently undergoing consolidation. Try again.`;
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
      const priorityClass = issue.priority === 'CRITICAL' ? 'danger' : (issue.priority === 'HIGH' ? 'warning' : 'info');
      tr.innerHTML = `
        <td><span class="badge ${priorityClass}" style="font-size:0.75rem; font-weight:bold;">${issue.priority}</span></td>
        <td>
          <strong style="color:#f1f5f9; font-size:0.92rem;">${issue.title}</strong>
          <div style="font-size:0.82rem; color:#94a3b8; margin-top:0.25rem;">${issue.description}</div>
        </td>
        <td><span style="font-size:0.85rem; color:#cbd5e1; line-height:1.4;">${issue.impact}</span></td>
        <td><code style="color:#fdba74; font-size:0.82rem;">${issue.cause}</code></td>
        <td><span style="font-size:0.85rem; color:#34d399; font-weight:500;">See ${issue.id} correction guidelines</span></td>
      `;
      issuesTbody.appendChild(tr);
    });

    if (issues.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">✨ Codebase is fully sanitised! No active compliance issues detected.</td>`;
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
        <td><div style="max-height:100px; overflow-y:auto;">${filesFormatted || '<span style="color:#64748b; font-size:0.8rem;">General files</span>'}</div></td>
        <td style="color:#34d399; font-size:0.85rem; line-height:1.4;"><span style="font-size:1.1rem; vertical-align:middle; margin-right:0.25rem;">⚡</span>${corr.benefitExpected}</td>
      `;
      correctionsTbody.appendChild(tr);
    });

    if (corrections.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center; color:var(--text-muted); padding:1.5rem;">No active corrections needed. Codebase compiles perfectly.</td>`;
      correctionsTbody.appendChild(tr);
    }
  }

  // Improvements Grid builder helper
  const renderImprovementCategory = (containerId, items) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    
    if (!items || items.length === 0) {
      container.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem; padding:0.5rem; text-align:center; font-style:italic;">No suggested advancements logged in this category.</div>`;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.style.background = '#1e293b';
      card.style.border = '1px solid #334155';
      card.style.padding = '1rem';
      card.style.borderRadius = '6px';
      card.style.transition = 'all 0.2s';
      
      card.innerHTML = `
        <div style="font-weight:600; font-size:0.9rem; color:#fff; margin-bottom:0.25rem;">${item.title}</div>
        <p style="margin:0 0 0.5rem 0; font-size:0.82rem; color:#94a3b8; line-height:1.4;">${item.description}</p>
        <span style="font-size:0.75rem; color:#10b981; font-weight:500; display:flex; align-items:center; gap:0.25rem;">
          <span>🚀 Benefit:</span>
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
    payloadPre.textContent = "// Initiating active discovery fetch of ai-index.json ...";
    const origin = window.location.origin;
    const locationPath = window.location.pathname;
    let targetUrl = '../../exports/ai-index.json';
    if (window.location.protocol !== 'file:' && origin && origin !== 'null') {
      const aisIndex = locationPath.toLowerCase().indexOf('/ais/dashboard');
      if (aisIndex !== -1) {
        const basePath = locationPath.substring(0, aisIndex);
        targetUrl = `${origin}${basePath}/exports/ai-index.json`;
      } else {
        targetUrl = `${origin}/exports/ai-index.json`;
      }
    }
    
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
          error: "Could not execute active index fetch: " + err.message,
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
    selector.innerHTML = '<option value="">-- Choose Historical Snapshot --</option>';
    
    const archData = data.wearCoreArchive || {};
    const versionedCatalog = archData.versionedCatalog || [];
    const knowledgeVersions = versionedCatalog.filter(c => c.type === 'knowledge');
    
    if (knowledgeVersions.length > 0) {
      knowledgeVersions.forEach(v => {
        const opt = document.createElement('option');
        opt.value = v.version;
        opt.textContent = `Version ${v.version} Snapshot (${v.date})`;
        selector.appendChild(opt);
      });
    } else {
      const scoreHistory = data.scoreHistory || [];
      scoreHistory.forEach(s => {
        const vName = s.version.replace(/^v/, '');
        const opt = document.createElement('option');
        opt.value = vName;
        opt.textContent = `Version ${vName} Snapshot (${s.date})`;
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
  document.getElementById('comp-past-files').textContent = "Retrieving...";
  document.getElementById('comp-past-score').textContent = "Retrieving...";
  
  const historicalUrl = `../../ais/exports/wear-core-knowledge-export-${version}.json`;
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
        document.getElementById('comp-past-files').textContent = "Historic (No Index)";
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
    .then(() => alert(`AI Shared Link copied to clipboard:\n${targetUrl}`))
    .catch(() => alert(`Link: ${targetUrl}`));
}

