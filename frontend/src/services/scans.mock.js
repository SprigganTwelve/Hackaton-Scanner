const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createScanFromRepo(repoUrl) {
  await sleep(600);
  return { id: "123", status: "queued", repoUrl };
}

export async function getScanSummary(scanId) {
  await sleep(400);
  return {
    scanId,
    score: 78,
    grade: "B",
    severities: { critical: 2, high: 5, medium: 9, low: 14 },
    owasp: {
      A03: 6, // supply chain
      A05: 7, // injection
      A02: 4, // misconfig
      A04: 3, // crypto
      A10: 2, // exception handling
    },
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
      title: "Possible SQL Injection",
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
  ];
}

export async function listFixes(scanId) {
  await sleep(500);
  return [
    {
      id: "5",
      findingId: "f1",
      type: "sql-injection",
      title: "Use parameterized query",
      diff: "--- a/login.js\n+++ b/login.js\n@@\n- query = 'SELECT ... ' + user\n+ query = 'SELECT ... WHERE user = ?'\n",
      status: "proposed",
    },
  ];
}