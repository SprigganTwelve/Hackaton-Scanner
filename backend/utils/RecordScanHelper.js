
//entities
const Finding = require('../valueObjects/Finding');
const LineInfo = require('../valueObjects/LineInfo')

//enums
const CodeScannerTool = require('../enums/CodeScannerTool')


//DTO
const OwaspCategoryMap = require('../services/scan/DTO/OwaspCategoryMap')  //For JS-DOC
const MappedIssue = require('../services/scan/DTO/MappedIssue')            //FOR JS-Doc


//Repositories
const FindingRepository = require('../repositories/FindingRepository')
const SecurityRuleRepository = require('../repositories/SecurityRuleRepository')
const AnalysisToolRepository = require('../repositories/AnalysisToolsRepository')
const AnalysisRecordRepository = require('../repositories/AnalysisRecordRepository')


//Services
const ScanResult = require("../services/scan/DTO/ScanResult");


//Utility
const ScoreAnalizer = require('./ScoreAnalyzer');
const DomainError = require('../core/errors/DomainError');

//-- Constants

/**This class helps track the number of issues and records during the scan recording process */
const recordCounter = {
    totalIssue: 0, //Tell us how many finding we have to record in the bdd (total)
    duplicateRecord: 0, //Tell us how many of these findings already exist in the bdd for the current analysis (duplicate)
}


class RecordScanHelper
{
    /**
     * This one help integrate all the data needed for bdd saving.
     * Its saved a scan result in the persitance storage (here the BDD)
     * @param {number} projectId - the result after scan
     * @param {ScanResult} scanResult - the result after scan
     * @throws {DomainError} Throws a DomainError if all the findings of the scan already exist in the database 
     *                       for the current analysis record (no new finding has been added).
     * @return {
     *      Promise<{
     *          owasp: OwaspCategoryMap | null;
     *          analysisRecord: {
     *              id: string;
     *              project_id: int;
     *              score?: string;
     *          };
     *          eslint: MappedIssue[];
     *          npmAudit: MappedIssue[];
     *      }>
     * }
     */
    static async execute(projectId, scanResult)
    {
        try{
            const analysisTools = [];

            //calculate score
            const scoreBadge = ScoreAnalizer.analyze(scanResult?.securityScorePoint)

            //Create analysis record
            const analysisRecord = await AnalysisRecordRepository.addAnalysisRecord({ 
                project_id: projectId,
                score: scoreBadge
            });

            const owasp = scanResult.owasp ?? null    //The owasp error top 10 categories
            const npmAudit = scanResult.npmAudit ?? []
            const eslint = scanResult.eslint ?? []


            //Record Semgrep Finding result Into Bdd
            if(owasp && Object.keys(owasp).length > 0)
            {
                /** @type {{ [key: string]: MappedIssue[] }} */
                for(const [key, value]  of Object.entries(owasp))
                {
                    for(let issue of value){
                        await this._recordMappedIssue(issue, key, CodeScannerTool.SEMGREP, analysisRecord.id)
                    }
                    recordCounter.totalIssue += value.length;
                }
                analysisTools.push(CodeScannerTool.SEMGREP)
            }
            

            //Record ESLint result into bdd
            if(Array.isArray(scanResult.eslint) && scanResult.eslint.length > 0)
            {
                for(let issue of eslint){
                    await this._recordMappedIssue(issue, null, CodeScannerTool.ESLINT, analysisRecord.id)
                    analysisTools.push(CodeScannerTool.ESLINT)
                }
                analysisTools.push(CodeScannerTool.ESLINT)
                recordCounter.totalIssue += eslint.length;
            }



            //Record Npm Audit record into bdd
            if(Array.isArray(scanResult.npmAudit) && scanResult.eslint.length > 0)
            {
                for(let issue of npmAudit){
                    await this._recordMappedIssue(issue, null, CodeScannerTool.NPM_AUDIT, analysisRecord.id )
                }
                analysisTools.push(CodeScannerTool.NPM_AUDIT)
                recordCounter.totalIssue += npmAudit.length;
            }

            if(recordCounter.totalIssue === recordCounter.duplicateRecord){
                throw new DomainError(
                    "All the findings of this scan already exist in the database for the current analysis record. No new finding has been added."
                )
            }

            await AnalysisRecordRepository.addAnalysisTools({ analysis_record_id: analysisRecord.id ,analysisTools})

            return { owasp, analysisRecord, eslint, npmAudit };
        }
        catch(error){
            console.warn("[RecordScanHelper::execute] Something went wrong, error: ", error);
            throw error;
        }
    }



    /** 
     * @param { MappedIssue } issue - the issue generated by the scan
     * @param { string? } category_key - the owasp category key (vulnerability error) with error
     * @param { string | number }  analysisRecordId identifier that give information about the record meta information stored in the bdd
     * @param { string }  analysis_tool_name - the category key with error
     * */
    static async _recordMappedIssue(issue, category_key = null, analysis_tool_name, analysisRecordId) {
        const {
            check_id,
            file_path,
            code,
            severity ,
            errorName,
            message: description,
            start_index,
            end_index,
            fingerprint,
            solution,
            message
        } = issue;

        const owaspVulnerabilityCategories = category_key ? [category_key] : [];
        const rule  = await SecurityRuleRepository.addRule({ 
            check_id,
            description,
            errorName,
            tool: analysis_tool_name,
            owaspVulnerabilityCategories
        })
        const tool = await AnalysisToolRepository.getToolByName(analysis_tool_name)

        const finding = new Finding({
            file_path,
            severity: Finding.mapSeverity(severity, category_key),
            code,
            tool_id: tool.id,
            rule_id: rule.id,
            fingerprint ,
            analysis_record_id: analysisRecordId,
            code: code,
            owaspVulnerabilityCategories,
            solution,
            message
        });

        const insertedFinding = await FindingRepository.addFinding(finding)
        if(insertedFinding.isDuplicate){
            recordCounter.duplicateRecord += 1;
            return;
        }
        const lineInfo = new LineInfo({start_index, end_index});
        await FindingRepository.addLineInfoToFinding(insertedFinding.id, lineInfo)
    }

}

module.exports = RecordScanHelper