import { api } from "./API";
import * as mock from "./reports.mock";

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

export async function listReports(analysisId) {
  if (useMocks) return mock.listReports(analysisId);
  return api.get(`/api/users/analysis/${analysisId}/reports`);
}

// Download PDF (returns Blob when real backend available)
export async function downloadReport(analysisId, reportId) {
  if (useMocks) {
    // simulate download
    const blob = new Blob([`Report ${reportId} (mock)`], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `securescan-report-${reportId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return;
  }

  const res = await fetch(`/api/users/analysis/${analysisId}/reports/${reportId}?format=pdf`, {
    method: "GET",
    credentials: "include",
    headers: { Accept: "application/pdf" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `securescan-report-${reportId}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}