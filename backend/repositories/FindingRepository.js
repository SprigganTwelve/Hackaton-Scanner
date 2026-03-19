
const pool = require('../config/database/mysql.client')

const Finding = require('../valueObjects/Finding')
const LineInfo = require('../valueObjects/LineInfo')

const OwaspCategoryRepository = require('./OwaspCategoryRepository')

/**
 * Handling bdd operation such as creating or updating 
 * a finding ressource/element ...
 */

class FindingRepository
{
    /**
     * Creates a finding associated with an analysis in the database.
     *
     * @param {Finding} finding - The finding to be stored.
     * @returns {Promise<{ 
     *  id: string,                 - The id of the finding in the bdd
     *  isDuplicate: boolean        - Boolean that indicates wether this finding alréady exist or not in the bdd
     * }>} The ID of the created finding.
     */
    static async addFinding(finding) {
        const {
            solution,
            file_path, severity, code, tool_id, rule_id,
            analysis_record_id, fingerprint, owaspVulnerabilityCategories
        } = finding;

        // Deal with rule
        let finalRuleId;
        const [rules] = await pool.query("SELECT id FROM rule WHERE check_id = ?", [rule_id]);

        if (rules.length > 0) {
            finalRuleId = rules[0].id;
        }
        else {
            // Rule doesn't exist
            const [result] = await pool.query('INSERT INTO rule(check_id, name) VALUES(?, ?)', [rule_id, rule_id]);
            finalRuleId = result.insertId;

            // Associate with categories OWASP (Table Pivot)
            if (Array.isArray(owaspVulnerabilityCategories)) {
                for (const categoryName of owaspVulnerabilityCategories) {
                    if (!categoryName)
                        continue;

                    //Ensure the category string slected in the bdd is right
                    const category = await OwaspCategoryRepository.getCategoryByName(categoryName);
                    if (category) {
                        //save issue
                        const [result] = await pool.query(
                            "INSERT IGNORE INTO rule_categories_owasp(rule_id, category_id) VALUES(?, ?)", 
                            [finalRuleId, category.id]
                        );
                        //Save a solution if it is direcly propose
                        if(solution){
                            await pool.query(
                                'INSERT INTO solution(corrective_measure, finding_id) VALUES(?,?)', 
                                [solution.corrective_mesure, result.insertId]
                            );
                        }
                    }
                }
            }
        }

        try{
            //Insert the Finding with the correct rule ID
            const [findingResult] = await pool.query(
                `INSERT INTO finding(
                    file_path, severity, code, tool_id,
                    rule_id, analysis_record_id, fingerprint
                ) VALUES(?, ?, ?, ?, ?, ?, ?)`,
                [
                    file_path, severity, code, tool_id,
                    finalRuleId, 
                    analysis_record_id, fingerprint
                ]
            );
            return { id: findingResult.insertId, isDuplicate: false };
        }
        catch(error){
            //Check for existing Finding in the bdd
            const [existing] = await pool.query("SELECT id FROM finding WHERE fingerprint = ? AND analysis_record_id = ?", [fingerprint, analysis_record_id]);
            if (existing.length > 0) {
                return { id: existing[0]?.id, isDuplicate: true };
            }
        }
    }


    /**
     * This one is able to provide information about lines related to a finding
     * @param {LineInfo} lineInfo
     */
    static async addLineInfoToFinding(finding_id, lineInfo)
    {
        const { start_index=null, end_index= null } = lineInfo
        const [rows] = await pool.query(
            `INSERT INTO 
                line_info(start_index, end_index, finding_id) 
                VALUES(?, ?, ?)
            `,
            [start_index, end_index, finding_id]
        )

        return { id: rows[0]?.insertId  }
    }
}

module.exports = FindingRepository