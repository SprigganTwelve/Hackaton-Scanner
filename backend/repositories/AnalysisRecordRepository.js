

const pool = require('../config/database/mysql.client')

const AnalysisToolRepository = require('./AnalysisToolsRepository')

const CodeScannerTools = require('../enums/CodeScannerTool')

//This function is used for reserved analysis record bdd operations
class AnalysisRecordRepository
{
    /**
     * @param {Object} param0 
     * @param {string} param0.project_id - represent the id of an existing project
     * @param {string} param0.score - represent the score of an analyze (ex: A, B, C ...)
     * @return {Promise<{id: string, project_id: int, score?: string}>}
     */
    static async addAnalysisRecord({
        project_id,
        score = null,
    })
    {   
        const [result] = await pool.query(
            'INSERT INTO analysis_record(score, project_id) VALUES(?,?)',
            [score, project_id]
        )

        return {
            id: result.insertId,
            project_id,
            score
        }
    }

    /**
     * This is used to link an analysis record with tools
     * @typedef {Object} AnalisisToolData
     * @property {string[]} analysis_record_id - the id of the related analysis
     * @property {string[]} analysisTools - an array containing the name of the tools used 
     */
    /**
     * 
     * @param {AnalisisToolData} param0 
     */
    static async addAnalysisTools({analysis_record_id, analysisTools})
    {
        for(toolName of analysisTools)
        {
            const toolId = AnalysisToolRepository.getToolByName(toolName)
            await pool.query(
                `
                    INSERT INTO analysis_tools(analysis_record_id, tool_id) VALUES(?, ?)
                `,
                [analysis_record_id, toolId]
            )
        }
    }


    /**
     * Get KPI stats for a specific analysis
     * @param {number} analysisId - The ID of the analysis record
     * @returns {Promise<{score: string, quantityError: number, quantityVulnerableDependences: number, quantityRecommandedSolution: number}>}
     */
    static async getKPI(analysisId) {
        // Get score of the analysis
        const [scoreRows] = await pool.query(
            'SELECT score FROM analysis_record WHERE id = ?',
            [analysisId]
        );
        const score = scoreRows[0]?.score ?? null;

        // Count total findings (errors) for this analysis
        const [errorRows] = await pool.query(
            'SELECT COUNT(*) AS total FROM finding WHERE analysis_record_id = ?',
            [analysisId]
        );
        const quantityError = errorRows[0]?.total ?? 0;

        // Count vulnerable dependencies (npm audit findings)
        const [vulnDepRows] = await pool.query(
            'SELECT COUNT(*) AS total FROM finding WHERE analysis_record_id = ? AND tool_id = ?',
            [analysisId, CodeScannerTools.NPM_AUDIT]
        );
        const quantityVulnerableDependences = vulnDepRows[0]?.total ?? 0;

        // Count recommended solutions applied to findings of this analysis
        const [solutionRows] = await pool.query(
            `SELECT COUNT(*) AS total 
             FROM solution s
             JOIN finding f ON s.finding_id = f.id
             WHERE f.analysis_record_id = ?`,
            [analysisId]
        );
        const quantityRecommandedSolution = solutionRows[0]?.total ?? 0;

        return {
            score,
            quantityError,
            quantityVulnerableDependences,
            quantityRecommandedSolution
        };
    }
}

module.exports = AnalysisRecordRepository