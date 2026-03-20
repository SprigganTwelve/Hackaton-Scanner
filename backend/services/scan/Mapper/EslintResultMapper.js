
const MappedIssue = require("../DTO/MappedIssue");
const Finding = require("../../../valueObjects/Finding");

const CryptoSecurityService = require("../../CryptoSecurityService");
const { EslintFormatter } = require("../../../utils/Formatter");


/**
 * Maps ESLint analysis results into a strict, immutable,
 * and system-friendly format.
 */
class EslintResultMapper
{
    /**
     * Transforms ESLint results into a strict, standardized object.
     *
     * @param {Object} options
     * @param {Object} options.result - The raw ESLint result.  Nothing  is done if this param is falsy
     * @returns {MappedIssue[]} A normalized and immutable representation of the analysis.
     */
    static map({ result }) {
        let eslintResults = [];

        if (Array.isArray(result)) {
            result.forEach(fileEntry => {
                fileEntry?.messages?.forEach(msg => {
                    
                    const fingerprint = CryptoSecurityService.hash(
                        `ESLINT|${fileEntry.filePath}|${msg.ruleId}|${msg.line}`
                    );

                    const errorName = EslintFormatter.toPrettyName(msg.ruleId ?? "unknown-rule");

                    const issue = new MappedIssue({
                        check_id: msg.ruleId ?? null,
                        errorName: errorName,
                        file_path: fileEntry.filePath ?? null,
                        start_index: msg.line ?? null,
                        end_index: msg.endLine || msg.line || null,
                        message: msg.message ?? null,
                        severity: Finding.mapSeverity(msg.severity) ?? null,
                        code: fileEntry.source ?? null, 
                        fingerprint
                    });

                    eslintResults.push(issue);
                });
            });
        }

        return eslintResults;
    }
}

module.exports = EslintResultMapper