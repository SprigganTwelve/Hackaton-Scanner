const pool = require('../config/database/mysql.client')

class AnalysisToolRepository
{
    /**
     * @param {string} name the name of the tool
     * @return {Promise<{id: string, name: string}>}
     */
    static async getToolByName(name)
    {
        const [rows] = pool.query(
            'SELECT id FROM tools WHERE name=?',
            [name]
        )
        return { id: rows[0].id }
    }
}

module.exports = AnalysisToolRepository