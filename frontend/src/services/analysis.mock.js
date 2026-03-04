const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function listFindings(analysisId) {
  await sleep(400);
  return [
    {
      id: "f1",
      tool: "semgrep",
      severity: "high",
      owasp: "A05",
      file: "src/routes/login.js",
      line: 42,
      title: "Possible SQL Injection",
      description: "User input concatenated into SQL query.",
    },
  ];
}

export async function listReports(analysisId) {
  await sleep(300);
  return [
    {
      id: "r1",
      date: "2026-03-03",
      repoUrl: "https://github.com/acme/demo-repo",
      commit: "a3fe29c",
    },
  ];
}

export async function listFixes(analysisId) {
  await sleep(300);
  return [
    { id: "fx1", repoUrl: "src/App.js", codeCorrompu: true },
    { id: "fx2", repoUrl: "src/LoginForm.jsx", codeCorrompu: false },
  ];
}