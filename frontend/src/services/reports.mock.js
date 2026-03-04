export async function listReports(analysisId){
  return [
    { id: "r1", commit: "a3fe29c", repoUrl: "https://github.com/acme/demo-repo", date: "2026-03-03", scanId: analysisId }
  ];
}