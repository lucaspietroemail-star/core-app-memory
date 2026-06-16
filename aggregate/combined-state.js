window.dashboardData = {
  "generatedAt": "2026-06-14T23:36:47.090Z",
  "version": {
    "versionCode": 24,
    "versionName": "1.1.0-wc",
    "releaseChannel": "stable",
    "buildDate": "2026-06-14"
  },
  "qualityGate": {
    "status": "APPROVED",
    "evaluatedAt": "2026-06-14T23:36:45.365Z",
    "score": 100,
    "blockedReasons": {
      "blockedByProtectedError": false,
      "blockedByGlobalContractBreak": false,
      "blockedByCriticalDependencyGuard": false,
      "scoreTooLow": false
    },
    "metrics": {
      "totalViolations": 0,
      "errors": 0,
      "warnings": 0,
      "dependencyGuardViolations": 0,
      "breakingChangesBlocked": 0
    },
    "gates": {
      "perfectScore": true,
      "passingScore": true,
      "zeroErrors": true
    },
    "findingsLog": []
  },
  "lintReport": {
    "status": "OK",
    "scanTime": "2026-06-14T23:36:35.925Z",
    "summary": {
      "totalFilesScanned": 211,
      "totalViolations": 0,
      "fileViolationsCount": 0,
      "structuralViolationsCount": 0
    },
    "fileViolations": [],
    "structuralViolations": []
  },
  "dependencyReport": {
    "status": "VIOLATIONS",
    "executedAt": "2026-06-14T23:36:40.088Z",
    "totalFilesChecked": 217,
    "totalDependencyViolations": 1,
    "violations": [
      {
        "file": "feature-debug/src/main/java/com/example/feature/debug/vm/DebugViewModel.kt",
        "violations": [
          {
            "layer": "vm",
            "import": "com.example.data.datasource.FakeSensorDataSource",
            "forbiddenPattern": "DataSource",
            "message": "Layer 'vm' is forbidden from importing 'com.example.data.datasource.FakeSensorDataSource' (DataSource)"
          }
        ]
      }
    ]
  },
  "breakingChangeReport": {
    "status": "FAIL",
    "checkedAt": "2026-06-14T23:36:41.033Z",
    "totalModifications": 17,
    "findings": [
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-launcher",
        "message": "Breaking Change: Folder layer 'domain' has been removed/is missing from module 'feature-launcher'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-launcher",
        "message": "Breaking Change: Folder layer 'data' has been removed/is missing from module 'feature-launcher'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-drawer",
        "message": "Breaking Change: Folder layer 'domain' has been removed/is missing from module 'feature-drawer'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-drawer",
        "message": "Breaking Change: Folder layer 'data' has been removed/is missing from module 'feature-drawer'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-notifications",
        "message": "Breaking Change: Folder layer 'domain' has been removed/is missing from module 'feature-notifications'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-notifications",
        "message": "Breaking Change: Folder layer 'data' has been removed/is missing from module 'feature-notifications'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-media",
        "message": "Breaking Change: Folder layer 'domain' has been removed/is missing from module 'feature-media'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-media",
        "message": "Breaking Change: Folder layer 'data' has been removed/is missing from module 'feature-media'"
      },
      {
        "severity": "warning",
        "type": "MISSING_STATE_REPRESENTATION",
        "module": "feature-media",
        "message": "Architectural anomaly: No matching state modeling structures declared inside module 'feature-media'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-settings",
        "message": "Breaking Change: Folder layer 'domain' has been removed/is missing from module 'feature-settings'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-settings",
        "message": "Breaking Change: Folder layer 'data' has been removed/is missing from module 'feature-settings'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-sensors",
        "message": "Breaking Change: Folder layer 'domain' has been removed/is missing from module 'feature-sensors'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-sensors",
        "message": "Breaking Change: Folder layer 'data' has been removed/is missing from module 'feature-sensors'"
      },
      {
        "severity": "warning",
        "type": "MISSING_STATE_REPRESENTATION",
        "module": "feature-sensors",
        "message": "Architectural anomaly: No matching state modeling structures declared inside module 'feature-sensors'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-debug",
        "message": "Breaking Change: Folder layer 'domain' has been removed/is missing from module 'feature-debug'"
      },
      {
        "severity": "error",
        "type": "MISSING_CONTRACT_LAYER",
        "module": "feature-debug",
        "message": "Breaking Change: Folder layer 'data' has been removed/is missing from module 'feature-debug'"
      },
      {
        "severity": "warning",
        "type": "MISSING_STATE_REPRESENTATION",
        "module": "feature-debug",
        "message": "Architectural anomaly: No matching state modeling structures declared inside module 'feature-debug'"
      }
    ]
  },
  "maturity": [],
  "components": {
    "components": []
  },
  "decisions": {
    "architectural_decisions": []
  },
  "architecturalMemory": [],
  "recommendations": [
    {
      "priority": "HIGH",
      "icon": "🛡️",
      "title": "Remediate 1 Dependency Guard Violations",
      "description": "Review structural contracts inside modules to remove illegal presentation imports or database leakage directly."
    }
  ],
  "scoreHistory": [
    {
      "version": "v0.1.0-beta",
      "score": 65,
      "date": "2026-06-11"
    },
    {
      "version": "v0.3.0-beta",
      "score": 78,
      "date": "2026-06-11"
    },
    {
      "version": "v0.5.0-beta",
      "score": 86,
      "date": "2026-06-12"
    },
    {
      "version": "v0.6.0-beta",
      "score": 92,
      "date": "2026-06-12"
    },
    {
      "version": "v1.1.0-wc",
      "score": 100,
      "date": "2026-06-14"
    }
  ],
  "registry": {
    "modules": {}
  },
  "technicalDebt": {
    "technicalDebt": {}
  },
  "roadmap": {
    "roadmap": {}
  },
  "activeRules": {
    "activeRules": []
  },
  "deprecatedRules": {
    "deprecatedRules": []
  },
  "ruleHistory": {
    "ruleHistory": []
  },
  "snapshotIndex": {
    "snapshots": []
  }
};