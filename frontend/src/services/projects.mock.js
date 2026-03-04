export async function listProjects(){
  return [
    { id: 1, name: "demo-repo", repoUrl: "https://github.com/acme/demo-repo", lastAnalysisId: 101 },
    { id: 2, name: "payments-api", repoUrl: "https://github.com/acme/payments-api", lastAnalysisId: 98 },
  ];
}

export async function getProjectAnalysis(projectId) {
  return [
    { analysisId: 101, projectId, createdAt: "2026-03-03T12:00:00Z", score: 78, grade: "B" },
    { analysisId: 98, projectId, createdAt: "2026-02-28T10:00:00Z", score: 63, grade: "C" },
  ];
}