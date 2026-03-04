
const pool = require('../config/database/mysql.client')

class RuleRepository
{
    /**
     * Create or find a rule
     * @param {Object} param0
     * @param {string} param0.check_id - Unique identifier of the rule (ex: javascript.lang.security.audit.sql-injection)
     * @param {string} param0.description - Human readable description of the rule
     * @returns {Promise<{ id: number }>}
     */
    static async addRule({ check_id, description, owasp_category_id })
    {
        const [rows] = await pool.query(
            'SELECT id FROM rule WHERE check_id=?',
            [check_id]
        )

        if(rows && rows.length > 0)
        {
            return {id: rows[0].insertId}
        }

        const [result] = await pool.query(
            'INSERT INTO rule(check_id, description, owasp_category_id) VALUES(?,?,?)',
            [check_id, description, owasp_category_id]
        )
        return { id: result[0].insertId }
    }
}

module.exports = RuleRepository