

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
     * @returns {boolean} - tell if everything when successfully or not
     */
    static async addAnalysisTools({analysis_record_id, analysisTools})
    {
        try {
            for(const toolName of analysisTools)
            {
                const tool = await AnalysisToolRepository.getToolByName(toolName)
                const toolId = tool.id

                await pool.query(
                    `
                        INSERT INTO analysis_tools(analysis_record_id, tool_id) VALUES(?, ?)
                    `,
                    [analysis_record_id, toolId]
                )
            }
            return true;
        } 
        catch (error) {
            console.log("[AnalysisRecordRepository::addAnalysisTools] Somerthing went wrong, error : ", (error)?.message)
            return false  
        }
    }


    /**
     * Get KPI stats for a specific analysis
     * @param {number} analysisId - The ID of the analysis record
     * @returns {Promise<{score: string, quantityError: number, quantityVulnerableDependences: number, quantityRecommandedSolution: number}>}
     */
    static async getKPI(analysisId) {
        const [rows] = await pool.query(`
            SELECT 
                ar.score,
                -- Compte total des findings
                (SELECT COUNT(*) FROM finding WHERE analysis_record_id = ar.id) AS quantityError,
                
                -- Compte uniquement les vulnérabilités npmAudit
                (SELECT COUNT(*) 
                 FROM finding f 
                 JOIN tools t ON f.tool_id = t.id 
                 WHERE f.analysis_record_id = ar.id AND t.name = 'npmAudit') AS quantityVulnerableDependences,
                
                -- Compte le nombre de solutions uniques liées aux findings de cette analyse
                (SELECT COUNT(DISTINCT s.id) 
                 FROM solution s 
                 JOIN finding f ON s.finding_id = f.id 
                 WHERE f.analysis_record_id = ar.id) AS quantityRecommandedSolution

            FROM analysis_record ar
            WHERE ar.id = ?
        `, [analysisId]);

        // Si l'analyse n'existe pas encore ou n'a pas de données
        if (!rows.length) {
            return {
                score: 'UNDETERMINED',
                quantityError: 0,
                quantityVulnerableDependences: 0,
                quantityRecommandedSolution: 0
            };
        }

        const result = rows[0];

        return {
            score: result.score ?? 'UNDETERMINED',
            quantityError: parseInt(result.quantityError) || 0,
            quantityVulnerableDependences: parseInt(result.quantityVulnerableDependences) || 0,
            quantityRecommandedSolution: parseInt(result.quantityRecommandedSolution) || 0
        };
    }
}

module.exports = AnalysisRecordRepository