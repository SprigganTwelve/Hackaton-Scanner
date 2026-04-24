const { default: CodeScannerTool } = require('../../frontend/src/enums/CodeScannerTool');
const pool = require('../config/database/mysql.client');

//Utility
const {SemgrepFormatter, EslintFormatter, NpmFormatter} = require('../utils/Formatter');
const OwaspCategoryRepository = require('./OwaspCategoryRepository');

/**
 * Repository responsible for managing interactions with the 'rule' table.
 * It stores standardized security rules and vulnerabilities (errors) 
 * that can be identified within the scanned code.
 */
class SecurityRuleRepository {

    /**
     * Create or find a rule
     * @param {Object} param0
     * @param {string} param0.check_id
     * @param {string} param0.description
     * @param {?string} param0.errorName        - The error group name
     * @param {?string} param0.tool_name        - The tool name (tool use for scanning)
     * @returns {Promise<{ id: number }>}
     */
    static async addRule({ check_id, description, errorName, tool_name, owaspVulnerabilityCategories = [] }) {

        // Check if rule already exists
        const [rows] = await pool.query(
            'SELECT id FROM rule WHERE check_id = ?',
            [check_id]
        );

        if (rows.length) {
            return { id: rows[0].id };
        }

        //Generate name for the error/rule...
        let ruleName = 'Unknown';
        switch (tool_name) {
            case errorName:
                ruleName = errorName;
                break;
            case CodeScannerTool.SEMGREP:
                ruleName = SemgrepFormatter.toPrettyName(check_id);
                break;
            case CodeScannerTool.ESLINT:
                ruleName = EslintFormatter.toPrettyName(check_id);
                break;
            case CodeScannerTool.NPM_AUDIT:
                ruleName = NpmFormatter.toPrettyName(check_id);
                break
            default:
                return
        }

        
        // Insert new rule
        const [result] = await pool.query(
            'INSERT INTO rule (check_id, description, name) VALUES (?, ?, ?)',
            [check_id, description, ruleName]
        );

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

        return { id: result.insertId };
    }
}

module.exports = SecurityRuleRepository;