

import UserProject from '../services/DTO/UserProject'


/**
 * Return the latest analysis record for each project
 * @param {Array<{
 *  projectId: string|number,
 *  analysisRecords?: Array<any>
 * }>} projects
 * @returns {Array<{
 *  projectId: string|number,
 *  latestAnalysis: any | undefined
 * }>}
 */
export function getLatestAnalysisRecords(projects) {

  console.log('ANALYS RECORD:', projects);

  if (!Array.isArray(projects)) return [];

  return [...projects]
    .filter(p => p && p.projectId !== undefined && p.projectId !== null)
    .sort((a, b) => {
      if (a.projectId < b.projectId) return -1;
      if (a.projectId > b.projectId) return 1;
      return 0;
    })
    .map(project => {
      const records = Array.isArray(project.analysisRecords)
        ? project.analysisRecords
        : [];

      const latestAnalysis =
        records.length > 0
          ? records[records.length - 1]
          : undefined;

      return {
        projectId: project.projectId,
        latestAnalysis
      };
    });
}

