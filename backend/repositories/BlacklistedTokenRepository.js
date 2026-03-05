const pool = require('../config/database/mysql.client');

class BlacklistedTokenRepository {

    /**
     * Saves an active token in the database to handle logout 
     * before its natural expiration.
     * This allows maintaining a "blacklist" of invalidated tokens.
     *
     * @param {Object} param0 
     * @param {string} param0.token - The still-valid JWT to store
     * @param {Date}   param0.expired_at - The time when the token considered expired
     * @returns {Promise<void>}
     */
    static async save({ token, expired_at }) {
        await pool.query(
            `INSERT INTO blacklisted_token (token, expired_at)
             VALUES (?, ?)`,
            [token, expired_at]
        );
    }

    /**
     * Checks whether a given token is blacklisted.
     * This helps determine if a token is no longer valid 
     * due to a prior logout or security invalidation.
     *
     * @param {Object} param0
     * @param {string} param0.token - The JWT to check
     * @returns {Promise<boolean>} - Returns true if the token is blacklisted, false otherwise
     */
    static async isTokenBlacklisted({ token }) {
        const [rows] = await pool.query(
            `SELECT token FROM blacklisted_token WHERE token = ? LIMIT 1`,
            [token]
        );
        return rows.length > 0;
    }

    /**
     * Cleans up all expired blacklisted tokens related to a specific user.
     * This helps maintain the blacklist table by removing tokens that have already expired.
     *
     * @param {Object} param0
     * @param {string|number} param0.userId - The ID of the user whose expired blacklisted tokens should be deleted
     * @returns {Promise<void>}
     */
    static async deleteMany({ userId }) {
        await pool.query(
            `DELETE FROM blacklisted_token 
             WHERE account_id = ? AND expired_at < ?`,
            [userId, new Date()]
        );
    }
}

module.exports = BlacklistedTokenRepository;