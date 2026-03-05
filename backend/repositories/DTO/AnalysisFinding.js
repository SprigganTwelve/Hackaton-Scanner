

class AnalysisFinding{
    constructor ({ 
        findingId,
<<<<<<< HEAD
        filePath,
        severity,
        code,
        toolId,
=======
        scorePenalty,
        filePath,
        severity,
        code,
        tool_id,
>>>>>>> feat/frontendJalon1a
        ruleId,
        analysisRecordId,
        fingerprint,
        owaspCategory,
        solution
    })
    {
        this.findingId = findingId;
        this.scorePenalty = scorePenalty;
        this.filePath = filePath;
        this.severity = severity;
        this.code = code;
<<<<<<< HEAD
        this.toolId = toolId;
=======
        this.tool_id = tool_id;
>>>>>>> feat/frontendJalon1a
        this.ruleId = ruleId;
        this.analysisRecordId = analysisRecordId;
        this.fingerprint = fingerprint;
        this.owaspCategory = owaspCategory;
        this.solution = solution;
    }
}

module.exports = AnalysisFinding;