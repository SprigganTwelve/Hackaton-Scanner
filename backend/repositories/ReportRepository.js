const pool = require('../config/database/mysql.client')

class ReportRepository {
// Créer un rapport
    static async createReport({ format, created_at, original_name, analysis_id }) {
        const [result] = await pool.query(
            'INSERT INTO reports (format, created_at, original_name, analysis_id) VALUES (?, ?, ?, ?)',
            [format, created_at, original_name, analysis_id]
        );

        return result.insertId;
    }
// Mettre à jour un rapport
    static async updateReport({ format, original_name, analysis_id }) {
        const [result] = await pool.query(
            'UPDATE reports SET format = ?, created_at = NOW(), original_name = ? WHERE analysis_id = ?',
            [format, original_name, analysis_id]
        );

        return result.affectedRows > 0;
    }
// Récupérer un rapport par l'ID de l'analyse
    static async getReportByAnalysisId(analysis_id) {
        const [rows] = await pool.query(
            'SELECT * FROM reports WHERE analysis_id = ?',
            [analysis_id]
        );

        return rows[0] || null;
    }

}

module.exports = ReportRepository;
