
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
     *      id: string,                 - The id of the finding in the bdd
     *      isDuplicate: boolean        - Boolean that indicates wether this finding alréady exist or not in the bdd
     * }>} The ID of the created finding.
     */
    static async addFinding(finding) {
        try {
            const {
                solution,
                file_path, severity, code, tool_id, rule_id,
                analysis_record_id, fingerprint, owaspVulnerabilityCategories, message
            } = finding;

            // Rule Handling
            let finalRuleId;
            const [rules] = await pool.query("SELECT id FROM rule WHERE check_id = ?", [rule_id]);

            if (rules.length > 0) {
                finalRuleId = rules[0].id;
            } else {
                // Create rule if it does nor exit
                const [resultRule] = await pool.query(
                    'INSERT INTO rule(check_id, name) VALUES(?, ?)', 
                    [rule_id, rule_id]
                );
                finalRuleId = resultRule.insertId;

                // Associate to category owasp if some has been defined
                if (Array.isArray(owaspVulnerabilityCategories)) {
                    for (const categoryName of owaspVulnerabilityCategories) {
                        if (!categoryName) continue;

                        const category = await OwaspCategoryRepository.getCategoryByName(categoryName);
                        if (category) {
                            await pool.query(
                                "INSERT IGNORE INTO rule_categories_owasp(rule_id, category_id) VALUES(?, ?)", 
                                [finalRuleId, category.id]
                            );
                        }
                    }
                }
            }

            // Insert the finding
            let insertedFindingId;
            let isDuplicate = false;

            try {
                const [findingResult] = await pool.query(
                    `INSERT INTO finding(
                        file_path, severity, code, tool_id,
                        rule_id, analysis_record_id, fingerprint, message
                    ) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        file_path, severity, code, tool_id,
                        finalRuleId, analysis_record_id, fingerprint, message ?? null
                    ]
                );
                insertedFindingId = findingResult.insertId;
            }
            catch (error) {
                // If the finding has already been saved in the bdd for the current analysis we retreive it !!
                const [existing] = await pool.query(
                    "SELECT id FROM finding WHERE fingerprint = ? AND analysis_record_id = ?", 
                    [fingerprint, analysis_record_id]
                );

                if (existing && existing.length > 0) {
                    insertedFindingId = existing[0].id;
                    isDuplicate = true;
                }
                else {
                    //If it's not a duplicate but another SQL error, we propagate it
                    throw error;
                }
            }

            // Save the solution (ONLY if an insertedFindingId is provided and a solution is given)
            if (solution && insertedFindingId && !isDuplicate) {
                await pool.query(
                    'INSERT IGNORE INTO solution(corrective_measure, finding_id) VALUES(?,?)', 
                    [solution.corrective_measure, insertedFindingId]
                );
            }

            // Semantic return
            return { id: insertedFindingId, isDuplicate };

        }
        catch (error) {
            console.error("[FindingRepository::addFinding] Fatal error:", error);
            throw error; //  Important for the caller to know that it failed
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
            `INSERT IGNORE INTO 
                line_info(start_index, end_index, finding_id) 
                VALUES(?, ?, ?)
            `,
            [start_index, end_index, finding_id]
        )

        return { id: rows[0]?.insertId  }
    }
}

module.exports = FindingRepository