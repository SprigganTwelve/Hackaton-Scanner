const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createScan(payload) {
  console.log("Mock createScan payload:", payload);

  return {
    id: Math.floor(Math.random() * 1000),
    status: "queued",
  };
}

export async function getScanSummary(scanId) {
  await sleep(400);

  const severities = { critical: 2, high: 5, medium: 9, low: 14 };

  // Total erreurs (pour KPI et pour gauge)
  const totalErrors =
    (severities.critical ?? 0) +
    (severities.high ?? 0) +
    (severities.medium ?? 0) +
    (severities.low ?? 0);

  return {
    scanId,
    score: 78,
    grade: "A", // ✅ tu as dit lettre uniquement, on colle au Figma (A)
    stats: {
      totalErrors, // KPI "Erreurs détectées"
      vulnerableDependencies: 18, // KPI "Dépendances vulnérables"
      recommendedFixes: 18, // KPI "Correctifs recommandés"
    },
    severities,

    // ✅ Format recommandé (plus simple côté UI)
    owasp: [
      { code: "A01", label: "Broken Access Control", count: 8 },
      { code: "A04", label: "Cryptographic Failure", count: 6 },
      { code: "A05", label: "Injection (SQL/XSS)", count: 3 },
      { code: "A07", label: "Authentication Failure", count: 1 },
    ],
  };
}

export async function listFindings(scanId) {
  await sleep(500);
  return [
    {
      id: "1",
      tool: "semgrep",
      severity: "high",
      owasp: "A05",
      file: "src/routes/login.js",
      line: 42,
      title: "SQL Injection via string concat",
      description: "User input concatenated into SQL query.",
    },
    {
      id: "2",
      tool: "trufflehog",
      severity: "critical",
      owasp: "A04",
      file: ".env",
      line: 1,
      title: "Secret exposed",
      description: "API key detected in repository.",
    },
    {
      id: "3",
      tool: "npm audit",
      severity: "medium",
      owasp: "A03",
      file: "package.json",
      line: 1,
      title: "Vulnerable dependency lodash < 4.17.21",
      description: "Known CVE found in dependency tree.",
    },
  ];
}

export async function listFixes(scanId) {
  await sleep(500);
  return [
    {
      id: "5",
      findingId: "1",
      type: "sql-injection",
      title: "Use parameterized query",
      diff:
        "--- a/login.js\n+++ b/login.js\n@@\n- query = 'SELECT ... ' + user\n+ query = 'SELECT ... WHERE user = ?'\n",
      status: "proposed",
    },
  ];
}

// Optionnel si tu ajoutes du polling plus tard
export async function getScanStatus(scanId) {
  await sleep(250);
  return { id: scanId, status: "done" };
}