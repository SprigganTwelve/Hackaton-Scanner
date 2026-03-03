import { api } from "./api";
import * as mock from "./scans.mock";

console.log("VITE_USE_MOCKS =", import.meta.env.VITE_USE_MOCKS);

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

export function createScan(payload) {
  if (useMocks) return mock.createScan(payload);
  return api.post("/api/scans", payload);
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

console.log("ENV", {
  VITE_USE_MOCKS: import.meta.env.VITE_USE_MOCKS,
  VITE_API_URL: import.meta.env.VITE_API_URL,
});