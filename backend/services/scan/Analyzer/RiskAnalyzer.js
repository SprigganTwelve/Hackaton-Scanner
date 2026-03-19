

const ScoreAnalizer = require('../../../utils/ScoreAnalyzer');

const OwaspCategoryMap = require('../DTO/OwaspCategoryMap')
// Enums
const CodeScannerTools = require('../../../enums/CodeScannerTool');

/**
 * Halder for scoe ans security result
 */
class RiskAnalyser
{
    /**
     * Calculate a security score based on issues from multiple tools.
     * @param { OwaspCategoryMap | null} mappedOWASP - the mapped OWASP results
     * @param { MappedIssue[] } eslintMappedIssues - ESLint mapped issues
     * @param { MappedIssue[] } npmAuditMappedIssues - NPM Audit mapped issues
     * @returns {number} - a score between 0(code not safe) - 100(code safe)
     */
    static calculateSecurityScorePoints(
        mappedOWASP = null,
        eslintMappedIssues = null,
        npmAuditMappedIssues = null
    ) {
        let score = 100;

        let toolNumber = 0;
        
        // Count how many tools are actually providing data
        if (mappedOWASP) 
            toolNumber++;
        
        if (eslintMappedIssues && eslintMappedIssues.length > 0) 
            toolNumber++;
        
        if (npmAuditMappedIssues && npmAuditMappedIssues.length > 0)
            toolNumber++;
        
        if (toolNumber === 0)
            toolNumber = 1; // éviter division par zéro
        

        // SEMGREP / OWASP issues
        if (mappedOWASP) {
            Object.values(mappedOWASP).forEach(category => {
                if (Array.isArray(category)) {
                    category.forEach(issue => {
                        const sev = issue.severity || "LOW";
                        score = ScoreAnalizer.calculateScorePoints(
                            score,
                            sev,
                            CodeScannerTools.SEMGREP,
                            toolNumber
                        );
                    });
                }
            });
        }

        // ESLint issues
        if (eslintMappedIssues && eslintMappedIssues.length > 0) {
            eslintMappedIssues.forEach(issue => {
                const sev = issue.severity || "LOW";
                score = ScoreAnalizer.calculateScorePoints(
                    score,
                    sev,
                    CodeScannerTools.ESLINT,
                    toolNumber
                );
            });
        }

        // NPM Audit issues
        if (npmAuditMappedIssues && npmAuditMappedIssues.length > 0) {
            npmAuditMappedIssues.forEach(issue => {
                const sev = issue.severity || "LOW";
                score = ScoreAnalizer.calculateScorePoints(
                    score,
                    sev,
                    CodeScannerTools.NPM_AUDIT,
                    toolNumber
                );
            });
        }

        // Clamp final score between 0 and 100
        score = Math.max(0, Math.round(score))
        return score;
    }
}

module.exports = RiskAnalyser