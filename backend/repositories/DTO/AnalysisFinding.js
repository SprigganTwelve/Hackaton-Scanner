

class AnalysisFinding{
    constructor ({ 
        findingId,
        scorePenalty,
        filePath,
        severity,
        code,
        tool_id,
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
        this.tool_id = tool_id;
        this.ruleId = ruleId;
        this.analysisRecordId = analysisRecordId;
        this.fingerprint = fingerprint;
        this.owaspCategory = owaspCategory;
        this.solution = solution;
    }
}

module.exports = AnalysisFinding;