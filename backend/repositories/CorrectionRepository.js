
const pool = require('../config/database/mysql.client');

class CorrectionRepository {
    static async markAsCorrected(findingId) {
        await pool.query('UPDATE finding SET is_corrected = TRUE WHERE id = ?', 
            [findingId]
        );
    }

    static async markAsRejected(findingId) {
        await pool.query('UPDATE finding SET is_corrected = FALSE WHERE id = ?',
            [findingId]
        );
    }
}

module.exports = CorrectionRepository;