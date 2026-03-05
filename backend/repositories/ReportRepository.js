const pool = require('../config/database/mysql.client');

class ReportRepository {

    /**
     * Create a report
     * @param {Object} param0
     * @param {string} param0.format
     * @param {Date|string} param0.created_at
     * @param {string} param0.original_name
     * @param {number} param0.analysis_id
     * @returns {Promise<number>} insertId
     */
    static async createReport({ format, created_at, original_name, analysis_id }) {
        const [result] = await pool.query(
            `INSERT INTO report (format, created_at, original_name, analysis_id)
             VALUES (?, ?, ?, ?)`,
            [format, created_at, original_name, analysis_id]
        );

        return result.insertId;
    }

    /**
     * Update a report by analysis_id
     * @param {Object} param0
     * @param {string} param0.format
     * @param {string} param0.original_name
     * @param {number} param0.analysis_id
     * @returns {Promise<boolean>}
     */
    static async updateReport({ format, original_name, analysis_id }) {
        const [result] = await pool.query(
            `UPDATE report
             SET format = ?, created_at = NOW(), original_name = ?
             WHERE analysis_id = ?`,
            [format, original_name, analysis_id]
        );

        return result.affectedRows > 0;
    }

    /**
     * Retrieve a report by analysis_id
     * @param {number} analysis_id
     * @returns {Promise<{id:string, original_name: string}|null>}
     */
    static async getReportByAnalysisId(analysis_id) {
        const [rows] = await pool.query(
            'SELECT * FROM report WHERE analysis_id = ?',
            [analysis_id]
        );

        return rows.length ? rows[0] : null;
    }
}

module.exports = ReportRepository;