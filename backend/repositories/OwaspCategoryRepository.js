const pool = require('../config/database/mysql.client')


class OwaspCategoryRepository {
    /**
     * Search for a category by exact name or by similarity (LIKE).
     * @param {string} name - Le nom ou le préfixe (ex: "A01", "Broken Access", "A03:2021")
     * @returns {Promise<{ id: number, name: string} | null>}
     */
    static async getCategoryByName(name) {
        if (!name || typeof name !== 'string') {
            return null;
        }

        const searchTerm = name.trim();

        console.log(`Searching for OWASP category: "${searchTerm}"`);

        const [rows] = await pool.query(
            'SELECT id, name FROM owasp_category WHERE name LIKE ? OR name = ? LIMIT 1',
            [`%${searchTerm}%`, searchTerm]
        );

        if (rows.length === 0) {
            console.log(`No OWASP category found for: ${searchTerm}`);
            return null;
        }

        return { id: rows[0].id, name: rows[0].name };
    }
}


module.exports = OwaspCategoryRepository;