

class AnalysisFinding{
    constructor ({ 
        findingId,
        scorePenalty,
        filePath,
        severity,
        code,
        toolsId,
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
        this.toolsId = toolsId;
        this.ruleId = ruleId;
        this.analysisRecordId = analysisRecordId;
        this.fingerprint = fingerprint;
        this.owaspCategory = owaspCategory;
        this.solution = solution;
    }
}

module.exports = AnalysisFinding;