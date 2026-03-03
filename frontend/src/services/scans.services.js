import { api } from "./api";
import * as mock from "./scans.mock";

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

export function createScanFromRepo(repoUrl) {
  if (useMocks) return mock.createScanFromRepo(repoUrl);
  return api.post("/api/scans", { repoUrl });
}

export function getScanSummary(scanId) {
  if (useMocks) return mock.getScanSummary(scanId);
  return api.get(`/api/scans/${scanId}/summary`);
}

export function listFindings(scanId) {
  if (useMocks) return mock.listFindings(scanId);
  return api.get(`/api/scans/${scanId}/findings`);
}

export function listFixes(scanId) {
  if (useMocks) return mock.listFixes(scanId);
  return api.get(`/api/scans/${scanId}/fixes`);
}