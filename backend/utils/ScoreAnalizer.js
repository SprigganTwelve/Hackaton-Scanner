
const Finding = require("../valueObjects/Finding");
const CodeSeverity = require("../enums/CodeSeverity");

/**
 * A utility class responsible for analyzing security findings 
 * and calculating a security score based on their severity.
 */
class ScoreAnaliser {

    static calculateScore(score, sev)
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
}

module.exports = ScoreAnaliser