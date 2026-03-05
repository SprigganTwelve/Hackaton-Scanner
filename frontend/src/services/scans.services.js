import { api } from "./API";
import * as mock from "./scans.mock";


import AnalysisFinding from "./DTO/AnalysisFinding";  //For js-doc

console.log("VITE_USE_MOCKS =", import.meta.env.VITE_USE_MOCKS);

const useMocks = import.meta.env.VITE_USE_MOCKS === "true";

export function createScan(payload) {
  if (useMocks) return mock.createScan(payload);
  return api.post("/api/scans", payload);
}

/**
 * @param scanId - analysis id
 */
export async function getLastScanSummary(scanId) {
  try{
    // if (useMocks) return mock.getScanSummary(scanId); // /:analysisId/stats/kpi
    const response = await api.get(`/api/users/${scanId}/stats/kpi`);
    /**
     * @type {{
     *  score: string,
     *  quantityError: number,
     *  quantityVulnerableDependences: number,
     *  quantityRecommandedSolution: number
     * }}
     */
    const {
      score,
      quantityError,
      quantityVulnerableDependences,
      quantityRecommandedSolution
    } = response;

    return {
            score,
            quantityError,
            quantityVulnerableDependences,
            quantityRecommandedSolution
    }
  }
  catch(error)
  {
    console.warn('[login] didn\'t work as expected')
    return { success: false, message: 'Une erreur inattendue est survenue coté client' }
  }
}



/**
 * @param analisis_id - analysis id
 */
export async function listFindings(analysis_id)
{
  // if (useMocks) return mock.listFindings(scanId);
  try{
    // if (useMocks) return mock.getScanSummary(scanId); // /analysis/:analysisId/findings
    const response = await api.get(`/api/users/analysis/${analysis_id}/findings`);
    /**
     * @type {{
     *  success?: boolean,
     *  message?: string
     *  data?: AnalysisFinding[]
     * }}
     */
    const {
      success,
      message,
      data
    } = response;

    return {
      success: success ??true,
      data,
      message
    }
  }
  catch(error)
  {
    console.warn('[login] didn\'t work as expected')
    return { 
      success: false,
      message: 'Une erreur inattendue est survenue coté client'
    }
  }
}



export function listFixes(scanId) {
  if (useMocks) return mock.listFixes(scanId);
  return api.get(`/api/scans/${scanId}/fixes`);
}

console.log("ENV", {
  VITE_USE_MOCKS: import.meta.env.VITE_USE_MOCKS,
  VITE_API_URL: import.meta.env.VITE_API_URL,
});