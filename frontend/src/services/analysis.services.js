import { api } from "./API";
import * as mock from "./analysis.mock";

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

// Findings
export async function listFindings(analysisId) {
  if (useMocks) return mock.listFindings(analysisId);
  return api.get(`/api/users/analysis/${analysisId}/findings`);
}

// Reports list
export async function listReports(analysisId) {
  if (useMocks) return mock.listReports(analysisId);
  return api.get(`/api/users/analysis/${analysisId}/reports`);
}

// Fixes (pour l’instant mock)
export async function listFixes(analysisId) {
  if (useMocks) return mock.listFixes(analysisId);
  // ⚠️ backend: pas d’endpoint fixes dans tes routers pour l’instant
  // donc on laisse mock le temps que backend soit prêt
  return [];
}