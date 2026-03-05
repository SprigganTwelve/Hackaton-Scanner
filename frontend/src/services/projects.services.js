
// src/services/projects.services.js
import { api } from "./API";
import * as mock from "./projects.mock";

//For JS-DOC
import OwaspCategoryMap from './DTO/OwaspCategoryMap'
import  MappedIssue from './DTO/MappedIssue'
import  UserProject from './DTO/UserProject'
import  CodeScannerTool from '../enums/CodeScannerTool'
const useMocks = import.meta.env.VITE_USE_MOCKS === "true";


export async function listProjects() {
  // if (useMocks) return mock.listProjects();
  try{
      const response = await api.get("/api/users/projects")
      console.log("Log project: ", response)
      /**
       * @type { {
       *  success: boolean,
       *  data : UserProject[]
       * }}
       */
      const {
        success,
        data,
        message
      } = response;

      return { success, data, message};
  }
  catch(error){
    console.log('Something went wrong: ', error)
    return { success: false, message: 'Quelque chose d\'inattendue est arrivée '}
  }
}



export async function getProjectAnalysis(projectId) {
  if (useMocks) return mock.getProjectAnalysis(projectId);
  return  await api.get(`/api/users/projects/${projectId}/analysis`);
}

/**
 * Used for add git hub project with backend
 */
export async function addProjetWithUrl({ name, repoUrl, token })
{
  try{
    const response = await api.post(
      "/api/users/add-project/url",
      { name, repoUrl, token }
    );
    
    /**
     * @type {
     *  success?: boolean,
     *  message?: string,
     *  data: UserProject
     * }
     */
    const { 
      success = true,
      message,
      data
    } = response
  
    return { success, message, data }
  }
  catch(error)
  {
    console.log('Something went wrong', error)
    return { 
      success: false,
      message: 'Quelques chose d\'inattendue est survenue'
    }
  }
}



/**
 * @param {FormData} formData - the fordata containing the project - must contains file kety which corresponding value is a File object
 */
export async function addProjectWithZip(formData)
{
  try{
    const response = await api.post('/api/users/add-project/zip', formData)
      
    /**
     * @type {
     *  success?: boolean,
     *  message?: string,
     *  data: UserProject
     * }
     */
    const { 
      success,
      message,
      data
    } = response
  
    return { success, message, data }
  }
  catch(error)
  {
    console.log('Something went wrong', error)
    return { success: false, message: 'Quelques chose d\'inattendue est survenue'}
  }
}



/**
 * Scan a project either via git URL or uploaded ZIP.
 *
 * @param {Object} params - Parameters for the scan
 * @param {string} params.projectId - The ID of the project to scan
 * @param {string} params.repoUrl - The git repository URL or ZIP file location
 * @param {?string[]} params.scanTools - List of tools to run (e.g., ['eslint','semgrep'])
 * @param {boolean} [params.isZip=false] - Whether the project is uploaded as a ZIP file
 * @returns {Promise<{
 *   success: boolean,
 *   message?: string,
 *   results?: {
 *     owasp: OwaspCategoryMap,   // OWASP categories mapped to findings
 *     analysisRecord: { 
 *       id: string,              // Analysis record ID
 *       project_id: number,      // ID of the project analyzed
 *       score?: string           // Optional score: A, B, C, D
 *     },
 *     eslint: MappedIssue[],    // Array of ESLint findings
 *     npmAudit: any             // NPM audit result, can be null
 *   }
 * }>} - Returns scan results or failure message
 */
export async function scan({ 
  projectId,
  repoUrl,
  scanTools,
  isZip = false
}) {
  try {
    // Determine API endpoint based on whether the project is a ZIP upload or a git repo URL
    const uri = !isZip ? '/api/users/add-project/url' : '/api/users/add-project/zip';

    console.log("MAKING SCAN",{  projectId,
      repoUrl,
      scanTools,
    })


    // Call the backend API to initiate the scan
    const response = await api.post(uri, {
      projectId,
      repoUrl: repoUrl ?? "", 
      scanTools:  scanTools ?? [
          CodeScannerTool.SEMGREP,
          CodeScannerTool.NPM_AUDIT,
          CodeScannerTool.ESLINT,
      ] 
    });

    // Destructure response safely, with fallback empty objects/arrays
    const {
      message,
      results = {} // fallback if results is undefined
    } = response;

    const {
      owasp = {},               // OWASP category mapping
      analysisRecord = {},      // Analysis metadata
      eslint = [],              // ESLint issues
      npmAudit = null           // NPM audit result
    } = results;


    const { id, project_id, score } = analysisRecord;

    return {
      success: true,
      message,
      results: {
        owasp,
        analysisRecord: { id, project_id, score },
        eslint,
        npmAudit
      }
    };
  } catch (error) {
    // Log error and return a friendly message
    console.error('Something went wrong during scan', error);
    return { success: false, message: 'Scan failed' };
  }
}

