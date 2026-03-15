const pool = require('../config/database/mysql.client')

class AnalysisToolRepository
{
    /**
     * Retrieves a tool's unique identifier by its name.
     * * @param {string} name - The exact name of the analysis tool (e.g., 'Semgrep').
     * @returns {Promise<{id: number}>} An object containing the tool's database ID.
     * @throws {Error} If no tool matching the provided name is found in the database.
     */
    static async getToolByName(name) {
        const [rows] = await pool.query(
            'SELECT id FROM tools WHERE name=?',
            [name]
        );

        if (!rows || rows.length === 0) {
            throw new Error(`Tool matching name "${name}" was not found in the database.`);
        }

        return { id: rows[0].id };
    }
}

module.exports = AnalysisToolRepository