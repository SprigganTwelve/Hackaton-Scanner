
const pool = require('../config/database/mysql.client');

class CorrectionRepository {
    static async markAsCorrected(findingId) {
        await pool.query('UPDATE finding SET is_corrected = 1 WHERE id = ?', 
            [findingId]
        );
    }

    static async markAsRejected(findingId) {
        await pool.query('UPDATE finding SET is_corrected = 0 WHERE id = ?',
            [findingId]
        );
    }
}

module.exports = CorrectionRepository;