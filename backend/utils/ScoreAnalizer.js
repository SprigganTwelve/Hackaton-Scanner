
const Finding = require("../valueObjects/Finding");
const CodeSeverity = require("../enums/CodeSeverity");

/**
 * A utility class responsible for analyzing security findings 
 * and calculating a security score based on their severity.
 */
class ScoreAnaliser {

    static calculateScorePoints(score, sev)
    {
        if (sev === CodeSeverity.CRITICAL) 
            score -= 30;
        else if (sev === "ERROR" || sev === "HIGH") 
            score -= 20;
        else if (sev === "WARNING" || sev === "MEDIUM" || sev === "MODERATE") 
            score -= 10;
        else score -= 5;

        return score < 0 ? 0 : score;
    }

    /**
     * Return a alphabetic character reprsenting the number
     * @param {number} points 
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