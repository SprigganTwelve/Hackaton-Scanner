

const pool = require('../config/database/mysql.client')

//This function is used for reserved analysis record bdd operations
class AnalysisRecordRepository
{
    /**
     * @param {Object} param0 
     * @param {*} param0.project_id - represent the id of an existing project
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
}

module.exports = AnalysisRecordRepository