
class UserProject {
  /**
   * @param {Object} params
   * @param {string|number} params.projectId - Unique project ID
   * @param {string} params.name - Name of the project
   * @param {Date|string} params.createdAt - Creation date of the project
   * @param {string} params.url - URL of the project (git or zip)
   * @param {boolean} params.isUploaded - True if project was uploaded as a zip
   * @param {Array<Object>} [params.analysisRecords=[]] - List of analysis records
   * @param {string|number} params.analysisRecords[].id - Unique analysis ID
   * @param {string} params.analysisRecords[].status - Status of the analysis (PENDING, RUNNING, COMPLETED, FAILED)
   * @param {Date|string} params.analysisRecords[].startedAt - When the analysis was started
   * @param {string} [params.analysisRecords[].score] - Optional score (A, B, C, D)
   */
    constructor({ 
        projectId, 
        name,
        createdAt,
        url,
        isUploaded,
        analysisRecords = [] // {id:string}[]
    }) {
        this.projectId = projectId;
        this.name = name;
        this.createdAt = createdAt;
        this.url = url;
        this.isUploaded = isUploaded;
        /** @type {Array< {id: string|number, status: string, startedAt: Date|string, score?: string} >} */
        this.analysisRecords = analysisRecords
    }
}

module.exports = UserProject;