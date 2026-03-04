

class AnalysisReport{
    constructor ({ 
        reportId,
        format,
        created_at,
        original_name,
        analysisId
    })
    {
        this.reportId = reportId;
        this.format = format;
        this.created_at = created_at;
        this.original_name = original_name;
        this.analysisId = analysisId;
    }
}

module.exports = AnalysisReport;