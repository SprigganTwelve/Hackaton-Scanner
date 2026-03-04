

const pool = require('../config/database/mysql.client')
const AnalysisToolRepository = require('./AnalysisToolsRepository')

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
}

module.exports = AnalysisRecordRepository