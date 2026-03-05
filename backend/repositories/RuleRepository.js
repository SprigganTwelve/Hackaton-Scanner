const pool = require('../config/database/mysql.client');

class RuleRepository {

    /**
     * Create or find a rule
     * @param {Object} param0
     * @param {string} param0.check_id
     * @param {string} param0.description
     * @param {number} param0.owasp_category_id
     * @returns {Promise<{ id: number }>}
     */
    static async addRule({ check_id, description, owasp_category_id }) {

        // Check if rule exists
        const [rows] = await pool.query(
            'SELECT id FROM rule WHERE check_id = ?',
            [check_id]
        );

        if (rows.length > 0) {
            return { id: rows[0].id };
        }

        // Insert new rule
        const [result] = await pool.query(
            'INSERT INTO rule (check_id, description, owasp_category_id) VALUES (?, ?, ?)',
            [check_id, description, owasp_category_id]
        );

        return { id: result.insertId };
    }
}

module.exports = RuleRepository;