
class AnalysisFinding{
    constructor ({ 
        findingId,
        filePath,
        severity,
        code,
        toolId,
        ruleId,
        analysisRecordId,
        fingerprint,
        /** @type {string[]} */
        owaspCategory,
        solution,
        toolName = null,
        errorName = null
    })
    {
        this.ruleName = errorName;
        this.toolName = toolName;
        this.findingId = findingId;
        this.filePath = filePath;
        this.severity = severity;
        this.code = code;
        this.toolId = toolId;
        this.ruleId = ruleId;
        this.analysisRecordId = analysisRecordId;
        this.fingerprint = fingerprint;
        this.owaspCategory = owaspCategory;
        this.solution = solution;
    }
}

export default AnalysisFinding;