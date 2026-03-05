
const Finding = require('../valueObjects/Finding')
const pool = require('../config/database/mysql.client')

const LineInfo = require('../valueObjects/LineInfo')
/**
 * Handling bdd operation such as creating or updating 
 * a finding ressource/element ...
 */

class FindingRepository
{
    /**
     * This function hepl us creating a finding related to an analyze in the bdd system
     * @param {Finding} -  finding
     * @return { Promise<{id: string}> }
     */
    static async addFinding(finding)
    {
        const {
            file_path, severity, code, tool_id,
            rule_id, analysis_record_id, fingerprint
        } = finding;
        const [rows]= await pool.query(
            `
                INSERT INTO finding(
                    file_path, severity, code, tool_id,
                    rule_id, analysis_record_id, fingerprint
                ) VALUES(
                    ?, ?, ?, ?,
                    ?, ?, ?
                )
            `,
            [
                file_path, severity, code, tool_id,
                rule_id, analysis_record_id, fingerprint
            ]
        )

        return { id: rows[0].id } 
    }

    /**
     * This one is able to provide information about lines related to a finding
     * @param {LineInfo} lineInfo
     */
    static async addLineInfoToFinding(finding_id, lineInfo)
    {
        const { start_index, end_index } = lineInfo
        const [rows] = await pool.query(
            `INSERT INTO 
                line_info(start_index, end_index, finding_id) 
                VALUES(?, ?)
            `,
            [start_index, end_index]
        )

        return { id: rows[0].id  }
    }
}

module.exports = FindingRepository