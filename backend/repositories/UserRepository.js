


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
    recordScan(userId, scanData ){
        
    }
}