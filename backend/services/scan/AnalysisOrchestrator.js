


// Enums
const CodeScannerTools = require('../../enums/CodeScannerTool');

//Services
const SemgrepScanner = require('./Analyzer/SemgrepScanner');
const NpmScanner = require('./Analyzer/NpmScanner');
const EslintScanner = require('./Analyzer/EslintScanner');
const SemgrepResultMapper = require("./Mapper/SemgrepResultMapper");
const EslintResultMapper = require("./Mapper/EslintResultMapper");
const NpmResultMapper = require("./Mapper/NpmResultMapper");


//DTO (Data transfer object)
const ScanResult = require("./DTO/ScanResult");
const RiskAnalyser = require("./Analyzer/RiskAnalyzer");




class AnalysisOrchestrator
{

    /**
     * Sync Execution for analysis, based on the given tools and tempDir
     * @param {Object} param0 
     * @param {string} param0.tmpDir
     * @param {string[]} param0.scanTools
     * @returns 
     */
    static runFullAnalysis({ tmpDir, scanTools = []}) {
        //---Prepare Variables for analisys result 
        let semgrepParseData = null;
        let npmAuditParseData = null;
        let eslintParseData = null;

        //-- Prepare variable for standarize analysis result
        let mappedOWASP = null
        let npmAuditMappedIssues = [];
        let eslintMappedIssues = []

        //--- SEMGREP
        if (scanTools.includes(CodeScannerTools.SEMGREP)) {
            semgrepParseData = SemgrepScanner.runAnalysis({ tmpDir })
            mappedOWASP = SemgrepResultMapper.map({ result: semgrepParseData  })
        }

        // --- NPM AUDIT ---
        if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
            npmAuditParseData = NpmScanner.runAnalysis({tmpDir})
            npmAuditMappedIssues = NpmResultMapper.map({result: npmAuditParseData})
        }

        //---Eslint analysis
        if (scanTools.includes(CodeScannerTools.ESLINT)) {
            eslintParseData = EslintScanner.runAnalysis({tmpDir})
            eslintMappedIssues = EslintResultMapper.map({ result: eslintParseData })
        }

        const securityScorePoint = RiskAnalyser.calculateSecurityScorePoints({ mappedOWASP, eslintMappedIssues, npmAuditMappedIssues })

        console.log("Scanning ended!!")

        //-- Generate Standarized result
        const result = new ScanResult({
            securityScorePoint,
            owasp: mappedOWASP,
            eslint: eslintMappedIssues,
            npmAudit: npmAuditMappedIssues,
            semgrepResults: semgrepParseData,
            eslintResults: eslintParseData,
            npmAuditResults: npmAuditParseData,
            message: 'Scan completed successfully',
        })

        return result
    }

}



module.exports = AnalysisOrchestrator