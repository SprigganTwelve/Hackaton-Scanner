const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database/mysql.client'); // Assumes you have a MySQL pool
const { exec } = require('child_process');

/**
 * CodeCorrector
 * 
 * This class provides functionality to generate and apply code corrections
 * based on known vulnerability rules stored in the database.
 */
class CodeCorrector {

    /**
     * Generate a corrected version of vulnerable code based on rule type.
     * @param {string} ruleType - The unique identifier of the violated rule (e.g., SQL_INJECTION, XSS).
     * @param {string} vulnerableCode - The original vulnerable code snippet.
     * @returns {string} - Corrected code or suggestion.
     */
    generateCorrection(ruleType, vulnerableCode) {
        switch (ruleType) {

            case "SQL_INJECTION":
                // Fix SQL injection using prepared statements
                return vulnerableCode.replace(
                    /".*?"/, `"SELECT * FROM users WHERE email = ?"`
                ) + `/* SecureScan Fix */connection.execute(query, [email]);`;

            case "XSS":
                // Fix XSS by escaping output
                return `/* SecureScan Fix */ echo htmlspecialchars(${vulnerableCode}, ENT_QUOTES, 'UTF-8');
            `;

            case "VULNERABLE_DEPENDENCY":
                // Suggest updating the vulnerable dependency
                return ` /* SecureScan Suggestion */ npm install package-name@latest`;

            case "EXPOSED_SECRET":
                // Replace exposed secret with environment variable
                return `/* SecureScan Fix */ const apiKey = process.env.API_KEY; `;

            case "PLAINTEXT_PASSWORD":
                // Hash passwords using bcrypt
                return ` /* SecureScan Fix */
                            const bcrypt = require('bcrypt');
                            const hashedPassword = await bcrypt.hash(password, 10);
                        `;

            default:
                return `
                    /* SecureScan: No automatic fix available for this rule */
                    `;
        }
    }

    /**
     * Apply the corrected code to a source file.
     * @param {string} filePath - Path to the file to be updated.
     * @param {string} originalCode - Vulnerable code snippet to replace.
     * @param {string} correctedCode - Corrected code snippet.
     * @returns {boolean} - True if correction applied successfully.
     * @throws {Error} - If the vulnerable code is not found in the file.
     */
    applyCorrection(filePath, originalCode, correctedCode) {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        const content = fs.readFileSync(filePath, 'utf8');

        if (!content.includes(originalCode)) {
            throw new Error("Vulnerable code not found in file");
        }

        const updatedContent = content.replace(originalCode, correctedCode);

        fs.writeFileSync(filePath, updatedContent, 'utf8');

        return true;
    }

    /**
     * Fetch the ruleType from the database for a given finding.
     * @param {number} findingId - The ID of the finding from the `finding` table.
     * @returns {Promise<string>} - The ruleType (check_id) associated with the finding.
     */
    async getRuleTypeByFinding(findingId) {
        const [rows] = await pool.query(
            `SELECT r.check_id AS ruleType
             FROM finding f
             JOIN rule r ON f.rule_id = r.id
             WHERE f.id = ?`,
            [findingId]
        );

        if (!rows.length) {
            throw new Error(`No rule found for finding ID ${findingId}`);
        }

        return rows[0].ruleType;
    }

    /**
     * Generate and apply a fix for a given finding in a file.
     * @param {number} findingId - ID of the finding from the database.
     * @param {string} filePath - Path to the file containing the vulnerable code.
     * @param {string} vulnerableCode - Original vulnerable code snippet.
     * @returns {Promise<boolean>} - True if the correction was applied successfully.
     */
    async fixFinding(findingId, filePath, vulnerableCode) {
        const ruleType = await this.getRuleTypeByFinding(findingId);

        const correctedCode = this.generateCorrection(ruleType, vulnerableCode);

        return this.applyCorrection(filePath, vulnerableCode, correctedCode);
    }

}

module.exports = new CodeCorrector();