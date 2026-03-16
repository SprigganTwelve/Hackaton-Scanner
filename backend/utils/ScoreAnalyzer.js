
const Finding = require("../valueObjects/Finding");
const CodeSeverity = require("../enums/CodeSeverity");
const CodeScannerTool = require("../enums/CodeScannerTool");

/**
 * A utility class responsible for analyzing security findings 
 * and calculating a security score based on their severity.
 * 
 */
class ScoreAnaliser {

    /**
     * 
     * @param {number} score - score initial (0 - 100)
     * @param {string | number} sev - severity normalisée
     * @param {string} codeScannerTool - tool ayant généré l'issue
     * @param {number} scanToolNumber - nombre total d'outils utilisés
     * @return {number} score final entre 0 - 100
     */
    static calculateScorePoints(
        score,
        sev,
        codeScannerTool = CodeScannerTool.SEMGREP,
        scanToolNumber = 1
    ) {

        let basePenalty = 0;

        const severity  = typeof sev == 'string' ? sev.toUpperCase() : sev
        switch (severity)
        {
            case CodeSeverity.CRITICAL:
            case "ERROR":
            case "HIGH":
            case 2: 
                basePenalty = 30;
                break;

            case CodeSeverity.MEDIUM:
            case "WARNING":
            case "MODERATE":
            case 1:
                basePenalty = 15;
                break;

            case CodeSeverity.LOW:
            case "INFO":
                basePenalty = 5;
                break;

            default:
                basePenalty = 3;
        }

        // coefficient selon l'outil
        let toolWeight = 1;

        switch (codeScannerTool)
        {
            case CodeScannerTool.SEMGREP:
                toolWeight = 1.0;
                break;

            case CodeScannerTool.ESLINT:
                toolWeight = 0.7;
                break;

            case CodeScannerTool.NPM_AUDIT:
                toolWeight = 1.2;
                break;

            default:
                toolWeight = 0.8;
        }

        // pondération selon le nombre d'outils
        const toolFactor = 1 / scanToolNumber;

        const penalty = basePenalty * toolWeight * toolFactor;

        score -= penalty;

        return Math.max(0, Math.round(score));
    }


    /**
     * Return a alphabetic character reprsenting the number
     * @param {?number} points 
     * @returns {string}
     */
    static analyze(points)
    {
        switch (true)
        {
            case points > 90:
                return 'A'
            case points > 80:
                return 'B'
            case points > 60:
                return 'C'
            default:
                return 'D'
        }
    }
}

module.exports = ScoreAnaliser