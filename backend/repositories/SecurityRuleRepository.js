const { default: CodeScannerTool } = require('../../frontend/src/enums/CodeScannerTool');
const pool = require('../config/database/mysql.client');

//Utility
const {SemgrepFormatter} = require('../utils/Formatter');

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
    static async addRule({ check_id, description, errorName, tool_name }) {

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
        if (errorName) {
            ruleName = errorName;
        }
        else if (tool_name === CodeScannerTool.SEMGREP && check_id) {
            ruleName = SemgrepFormatter.toPrettyName(check_id);
        }
        
        // Insert new rule
        const [result] = await pool.query(
            'INSERT INTO rule (check_id, description, name) VALUES (?, ?, ?)',
            [check_id, description, ruleName]
        );

        return { id: result.insertId };
    }
}

module.exports = SecurityRuleRepository;