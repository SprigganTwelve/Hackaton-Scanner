
const pool = require('../config/database')

class UserRepository
{
    /**
     * Records a scan for a user.
     * @param {string} userId - The ID of the user.
     * @param {object} scanData - The data related to the scan.
     * @param {string} scanData.rule_id - The ID of the rule that was triggered.
     * @param {int} scanData.score - the score associated with the scan.
     * @param {string} scanData.file_path -the relative path of the file that was scanned.
     * @param {string} scanData.pattern_type - the type of pattern that was matched (e.g., "regex", "keyword").
     */
    saveScanResult(userId, {score, file_path, pattern_type, rule_id} )
    {
        
    }

    /**
     * This function retreive the git access token of an user from teh database
     * @param {string} userId - the unique identifier of the user
     * @returns 
     */
    async getUserAccessToken(userId)
    {
        const [rows] = await pool.query(
            'SELECT hash_git_access_token FROM account WHERE id = ?',
            [userId]
        );
        return rows[0]?.hash_git_access_token;
    }
}
module.exports = UserRepository