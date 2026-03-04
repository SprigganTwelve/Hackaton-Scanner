const Finding = require("../valueObjects/Finding");
const LineInfo = require("../valueObjects/LineInfo");
/**
 * Represents a record of an analysis performed 
 * on a project, including the findings and the overall score.
 */
class AnalisysRecord {
    /**
     * @param {Object} params - Parameters for creating an AnalysisRecord instance.
     * @param {Finding[]} params.findings - Array of findings detected during the analysis.
     * @param {number} params.score - Overall security score calculated from findings.
     * @param {string|number} params.project_id - Unique identifier of the analyzed project.
     * @param {Date} [params.started_at = new Date()] - Timestamp when analysis started.
     * @param {LineInfo} params.line_info - Information about the lines analyzed.
    */
    constructor({
        project_id,
        started_at= new Date(),
        findings, score, 
        line_info,
    }) {
        this.project_id = project_id;
        this.started_at = started_at;
        this.findings = findings;
        this.score = score;
        this.line_info = line_info;
    }
}

module.exports = AnalisysRecord