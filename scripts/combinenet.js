const fs = require('fs');
const path = require('path');

const COMBINED_STATE_PATH = path.join(__dirname, '..', 'aggregate', 'combined-state.json');

/**
 * 🧪 VALIDATION ENGINE (OBRIGATÓRIO NO COMBINENET v3)
 * Nenhum estado pode ser salvo sem validação contra o schema v3.
 */
function validateSection(sectionName, data) {
    if (!data) {
        throw new Error("INVALID_STATE: missing data");
    }

    // Default status handling: "Nenhum status pode ser inventado" -> default to UNKNOWN
    let status = data.status;
    if (!status) {
        status = "UNKNOWN";
    }

    // Base validated object structure matching Schema v3
    let normalized = {
        status,
        ...data
    };

    // Deep structural defaults to avoid undefined property access in other subsystems or dashboard
    if (sectionName === "qualityGate") {
        normalized.score = typeof data.score === 'number' ? data.score : 0;
        normalized.evaluatedAt = data.evaluatedAt ?? new Date().toISOString();
        normalized.blockedReasons = {
            blockedByProtectedError: !!data.blockedReasons?.blockedByProtectedError,
            blockedByGlobalContractBreak: !!data.blockedReasons?.blockedByGlobalContractBreak,
            blockedByCriticalDependencyGuard: !!data.blockedReasons?.blockedByCriticalDependencyGuard,
            scoreTooLow: !!data.blockedReasons?.scoreTooLow,
            ...(data.blockedReasons || {})
        };
    } else if (sectionName === "lint") {
        normalized.summary = {
            totalFilesScanned: data.summary?.totalFilesScanned ?? 0,
            totalViolations: data.summary?.totalViolations ?? 0,
            ...(data.summary || {})
        };
        normalized.fileViolations = data.fileViolations ?? [];
        normalized.structuralViolations = data.structuralViolations ?? [];
    } else if (sectionName === "dependency") {
        normalized.totalFilesChecked = data.totalFilesChecked ?? 0;
        normalized.totalDependencyViolations = data.totalDependencyViolations ?? 0;
        normalized.violations = data.violations ?? [];
    } else if (sectionName === "breakingChanges") {
        normalized.findings = data.findings ?? [];
    } else if (sectionName === "registry") {
        normalized.modules = data.modules ?? {};
    } else if (sectionName === "technicalDebt") {
        normalized.items = data.items ?? [];
        normalized.total = data.total ?? (normalized.items ? normalized.items.length : 0);
    } else if (sectionName === "memory") {
        normalized.rules = data.rules ?? [];
        normalized.adrState = data.adrState ?? [];
        normalized.evolution = data.evolution ?? [];
    } else if (sectionName === "roadmap") {
        normalized.timeline = data.timeline ?? [];
    } else if (sectionName === "dashboard") {
        normalized.lastSync = data.lastSync ?? new Date().toISOString();
    }

    return normalized;
}

/**
 * 🛡️ ANTI-FAKE STATUS ENGINE
 * Evita inferências artificiais ou fictícias sem evidência computável real.
 */
function deriveStatus(section, data) {
    if (!data || Object.keys(data).length === 0) {
        return "UNKNOWN";
    }

    if (section === "dependency") {
        return data.totalDependencyViolations > 0 ? "VIOLATIONS" : "OK";
    }

    if (section === "qualityGate") {
        return data.score >= 90 ? "APPROVED" : "BLOCKED";
    }

    if (section === "lint") {
        if (data.summary && typeof data.summary.totalViolations === 'number') {
            if (data.summary.totalViolations > 0) return "ERROR";
            if (data.summary.totalFilesScanned > 0) return "OK";
        }
        return "UNKNOWN";
    }

    if (section === "breakingChanges") {
        if (Array.isArray(data.findings)) {
            return data.findings.length > 0 ? "FAIL" : "OK";
        }
        return "UNKNOWN";
    }

    if (section === "technicalDebt") {
        if (Array.isArray(data.items)) {
            return data.items.length > 0 ? "DEGRADED" : "OK";
        }
        return "UNKNOWN";
    }

    if (section === "memory") {
        const hasEvidence = (Array.isArray(data.rules) && data.rules.length > 0) ||
                            (Array.isArray(data.adrState) && data.adrState.length > 0) ||
                            (Array.isArray(data.evolution) && data.evolution.length > 0);
        return hasEvidence ? "OK" : "UNKNOWN";
    }

    if (section === "roadmap") {
        return (Array.isArray(data.timeline) && data.timeline.length > 0) ? "OK" : "UNKNOWN";
    }

    if (section === "dashboard") {
        return data.lastSync ? "SYNCED" : "UNKNOWN";
    }

    if (section === "system") {
        if (typeof data.score === 'number') {
            return data.score >= 90 ? "PRODUCTION_READY" : "DEGRADED";
        }
        return "UNKNOWN";
    }

    // Default fallback to "UNKNOWN" when evidence cannot be parsed or status is absent
    return data.status ?? "UNKNOWN";
}

/**
 * Loads the complete consolidated AIS memory state.
 * Employs safe deep merges to ensure schema integrity and prevent undefined-property access crashes.
 */
function getCombinedState() {
    const defaults = {
        meta: {
            generatedAt: new Date().toISOString(),
            version: "1.0.0",
            contractVersion: "v3",
            environment: "production"
        },
        system: {
            status: "UNKNOWN",
            score: 0
        },
        qualityGate: {
            status: "UNKNOWN",
            score: 0,
            evaluatedAt: new Date().toISOString(),
            blockedReasons: {
                blockedByProtectedError: false,
                blockedByGlobalContractBreak: false,
                blockedByCriticalDependencyGuard: false,
                scoreTooLow: false
            }
        },
        lint: {
            status: "UNKNOWN",
            summary: {
                totalFilesScanned: 0,
                totalViolations: 0
            },
            fileViolations: [],
            structuralViolations: []
        },
        dependency: {
            status: "UNKNOWN",
            totalFilesChecked: 0,
            totalDependencyViolations: 0,
            violations: []
        },
        breakingChanges: {
            status: "UNKNOWN",
            findings: []
        },
        registry: {
            modules: {}
        },
        technicalDebt: {
            status: "UNKNOWN",
            items: [],
            total: 0
        },
        memory: {
            status: "UNKNOWN",
            rules: [],
            adrState: [],
            evolution: []
        },
        roadmap: {
            status: "UNKNOWN",
            timeline: []
        },
        dashboard: {
            status: "UNKNOWN",
            lastSync: new Date().toISOString()
        }
    };

    if (fs.existsSync(COMBINED_STATE_PATH)) {
        try {
            const parsed = JSON.parse(fs.readFileSync(COMBINED_STATE_PATH, 'utf8'));
            const deepMerge = (target, source) => {
                for (const key of Object.keys(source)) {
                    if (source[key] instanceof Object && !Array.isArray(source[key])) {
                        if (!target[key]) target[key] = {};
                        deepMerge(target[key], source[key]);
                    } else {
                        if (target[key] === undefined) {
                            target[key] = source[key];
                        }
                    }
                }
                return target;
            };
            return deepMerge(parsed, defaults);
        } catch (e) {
            console.error("Error parsing combined-state.json", e);
        }
    }
    return defaults;
}

/**
 * Persists the entire integrated CombineNet state, injecting standard metadata.
 */
function saveCombinedState(state) {
    const dir = path.dirname(COMBINED_STATE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    if (!state.meta) {
        state.meta = {};
    }
    state.meta.generatedAt = new Date().toISOString();
    state.meta.version = "1.0.0";
    state.meta.contractVersion = "v3";
    state.meta.environment = "production";

    // System aggregate resolution based on evidence (qualityGate evaluations)
    if (state.qualityGate) {
        if (!state.system) {
            state.system = {};
        }
        state.system.score = typeof state.qualityGate.score === 'number' ? state.qualityGate.score : 0;
        if (state.qualityGate.status === "UNKNOWN") {
            state.system.status = "UNKNOWN";
        } else {
            state.system.status = state.qualityGate.score >= 90 ? "PRODUCTION_READY" : "DEGRADED";
        }
    }

    fs.writeFileSync(COMBINED_STATE_PATH, JSON.stringify(state, null, 2), 'utf8');
}

/**
 * 🔁 COMBINENET UPDATE RULE (v3) - CONTRATO DE ESCRITA OBRIGATÓRIO (updateSection)
 */
function updateSection(sectionName, data) {
    try {
        const state = getCombinedState();
        
        // 1. Validate data against schema
        const safeData = validateSection(sectionName, data);

        // 2. Derive true evidence-based status
        const finalData = {
            ...safeData,
            status: deriveStatus(sectionName, safeData)
        };

        // 3. Save standard structure
        state[sectionName] = finalData;
        saveCombinedState(state);
    } catch (err) {
        console.error(`[CombineNet Error] Failed to update section '${sectionName}':`, err);
        
        // ⚠️ ERROR HANDLING CONTRACT
        const state = getCombinedState();
        state[sectionName] = {
            status: "ERROR",
            message: err.message || String(err),
            fallback: "UNKNOWN_STATE"
        };
        saveCombinedState(state);
    }
}

module.exports = {
    getCombinedState,
    saveCombinedState,
    updateSection
};
