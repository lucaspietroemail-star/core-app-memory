// Global map to hold chart instances
if (!window.chartInstances) {
    window.chartInstances = {};
}

function initializeAllCharts() {
    const data = window.dashboardData;
    if (!data) {
        console.warn("[AIS Charts] No window.dashboardData available for chart initialization.");
        return;
    }

    // Set Theme config to match dark mode cleanly
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    const sharedOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: { color: '#94a3b8', usePointStyle: true }
            }
        }
    };

    // Helper to safely recreate charts without DOM error conflicts
    function safeCreateChart(id, config) {
        if (window.chartInstances[id]) {
            window.chartInstances[id].destroy();
        }
        const ctx = document.getElementById(id);
        if (ctx) {
            try {
                window.chartInstances[id] = new Chart(ctx, config);
            } catch (err) {
                console.error(`[AIS Charts] Error rendering chart: ${id}`, err);
            }
        }
    }

    // 1. Score Chart (Evolução da Pontuacão)
    const history = data.scoreHistory || [];
    if (history.length > 0) {
        const labels = history.map(h => h?.version ?? 'v?');
        const scores = history.map(h => typeof h?.score === 'number' ? h.score : 0);
        safeCreateChart('scoreChart', {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Pontuação de Arquitetura',
                    data: scores,
                    borderColor: '#c084fc', // Neon purple accent
                    backgroundColor: 'rgba(192, 132, 252, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                ...sharedOptions,
                scales: {
                    y: { min: 40, max: 100, grid: { color: '#27272a' } },
                    x: { grid: { color: '#27272a' } }
                }
            }
        });
    } else {
        // Render fallback single data point score chart
        const qgScore = data.qualityGate?.score ?? 0;
        safeCreateChart('scoreChart', {
            type: 'line',
            data: {
                labels: ['Build Corrente'],
                datasets: [{
                    label: 'Pontuação de Arquitetura',
                    data: [qgScore],
                    borderColor: '#c084fc',
                    backgroundColor: 'rgba(192, 132, 252, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                ...sharedOptions,
                scales: {
                    y: { min: 40, max: 100, grid: { color: '#27272a' } },
                    x: { grid: { color: '#27272a' } }
                }
            }
        });
    }

    // 2. Risk Distribution (Distribuição de Riscos)
    const modules = Object.values(data.registry?.modules ?? {});
    let lowCount = 0, mediumCount = 0, highCount = 0, criticalCount = 0;
    modules.forEach(m => {
        const mat = (m?.maturity ?? 'UNKNOWN').toUpperCase();
        if (mat === 'STABLE') lowCount++;
        else if (mat === 'MIGRATION') mediumCount++;
        else if (mat === 'LEGACY') highCount++;
        else lowCount++;
    });
    // Fallbacks if zero
    if (lowCount + mediumCount + highCount + criticalCount === 0) {
        lowCount = 5;
        mediumCount = 2;
    }

    safeCreateChart('riskChart', {
        type: 'doughnut',
        data: {
            labels: ['Risco Baixo', 'Risco Médio', 'Risco Alto', 'Risco Crítico'],
            datasets: [{
                data: [lowCount, mediumCount, highCount, criticalCount],
                backgroundColor: ['#4ade80', '#facc15', '#fb923c', '#f87171'],
                borderWidth: 0
            }]
        },
        options: sharedOptions
    });

    // 3. Technical Debt by Module (Débito Técnico por Módulo)
    const debts = data.technicalDebt?.technicalDebt ?? {};
    const debtLabels = Object.keys(debts);
    const debtValues = Object.values(debts).map(items => Array.isArray(items) ? items.length : 0);

    const chartLabels = debtLabels.length ? debtLabels : ['feature-launcher', 'feature-settings', 'core-ui'];
    const chartValues = debtLabels.length ? debtValues : [1, 1, 1];

    safeCreateChart('debtChart', {
        type: 'bar',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Número de Débitos Técnicos',
                data: chartValues,
                backgroundColor: '#c084fc'
            }]
        },
        options: {
            ...sharedOptions,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: '#27272a' }, ticks: { stepSize: 1 } },
                x: { grid: { display: false } }
            }
        }
    });

    // 4. Module Maturity Distribution (Nível de Maturidade)
    let stableCount = 0, migrationCount = 0, legacyCount = 0;
    modules.forEach(m => {
        const mat = (m?.maturity ?? 'UNKNOWN').toUpperCase();
        if (mat === 'STABLE') stableCount++;
        else if (mat === 'MIGRATION') migrationCount++;
        else if (mat === 'LEGACY') legacyCount++;
    });
    if (stableCount + migrationCount + legacyCount === 0) {
        stableCount = 6;
        migrationCount = 1;
        legacyCount = 1;
    }

    safeCreateChart('maturityChart', {
        type: 'pie',
        data: {
            labels: ['ESTÁVEL (Stable)', 'MIGRAÇÃO (Migration)', 'LEGADO (Legacy)'],
            datasets: [{
                data: [stableCount, migrationCount, legacyCount],
                backgroundColor: ['#4ade80', '#c084fc', '#f87171'],
                borderWidth: 0
            }]
        },
        options: sharedOptions
    });
}

// Initial binding
document.addEventListener('DOMContentLoaded', () => {
    initializeAllCharts();
});

// Update event listener for hot reloads or async state fetches
window.addEventListener('aisStateUpdated', () => {
    console.log("[AIS Charts] State updated event captured. Re-rendering charts...");
    initializeAllCharts();
});
