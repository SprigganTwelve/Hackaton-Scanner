const fs = require('fs')
const path = require('path');
const { execSync } = require('child_process');

//ValueObjects
const Finding = require("../../valueObjects/Finding");

// Enums
const CodeScannerTools = require('../../enums/CodeScannerTool');

//Services
const CryptoSecurityService = require("../CryptoSecurityService");

//DTO (Data transfer object)
const MappedIssue = require("./DTO/MappedIssue");
const ScanResult = require("./DTO/ScanResult");
const OwaspCategoryMap = require('./DTO/OwaspCategoryMap');

//Utility
const ScoreAnalizer = require('../../utils/ScoreAnalyzer');
const SemgrepFormatter = require('../../utils/Formatter');
const DirectoryHelper = require('../../utils/DirectoryHelper');
const { SCANNER_PROJECT_ROOT } = require('../../config/upload');
const { resolve } = require('dns');


//Constants
const ESLINT_BIN  = path.join(SCANNER_PROJECT_ROOT, 'node_modules', '.bin', 'eslint')


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

        //--- SEMGREP
        if (scanTools.includes(CodeScannerTools.SEMGREP)) {
            try{
                const semgrepOut = execSync(
                    `semgrep --config="p/owasp-top-ten" ${tmpDir} --json`,
                    { 
                        encoding: 'utf8',
                        stdio: ['ignore', 'pipe', 'ignore'],
                        maxBuffer: 10 * 1024 * 1024
                    }
                );
                console.log(semgrepOut);
                semgrepParseData = JSON.parse(semgrepOut);
            }
            catch(error){
                console.log("Something went wrong while executing semgerp, error ", (error)?.message)
            }
        }

        // --- NPM AUDIT ---
        if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
            try {
                const files = fs.readdirSync(tmpDir);
                let packagePath = path.join(tmpDir, 'package.json');
                let workingDir = tmpDir;

                // Subfolder detection (case of a ZIP file with a root folder)
                const { safeFilePath } = DirectoryHelper.locateFile({ filePath: packagePath, deep: 2 })
                if(!safeFilePath){
                    throw Error("No package json founded in project")
                }

                workingDir = path.dirname(safeFilePath)

                if (fs.existsSync(packagePath)) {
                    console.log("NPM AUDIT STARTING in:", workingDir);

                    //  Generate the lockfile. Completely isolate it.
                    try {
                        execSync(`npm install --package-lock-only --legacy-peer-deps`, { 
                            cwd: workingDir, 
                            stdio: ['ignore', 'pipe', 'ignore'],
                            timeout: 20000 
                        });
                    }
                    catch (lockError) {
                        console.warn("[AnalysisOrchestrator::runFullAnalysis] Lockfile generation failed. Audit might fail, but we continue...");
                    }

                    //Run audit
                    try {
                        const auditOut = execSync(`npm audit --json`, { 
                            cwd: workingDir, 
                            encoding: 'utf8',
                            stdio: ['ignore', 'pipe', 'ignore'] 
                        });
                        npmAuditParseData = JSON.parse(auditOut || '{}');
                    } 
                    catch (auditError) {
                        // npm audit returns a status code of 1 if vulnerabilities are found (the normal case)
                        if (auditError.stdout) {
                            try {
                                npmAuditParseData = JSON.parse(auditError.stdout);
                            } 
                            catch (e) {
                                console.error("Failed to parse npm audit JSON output");
                            }
                        }
                        else {
                            console.error("NPM Audit failed to run (no stdout).");
                        }
                    }
                    console.log("NPM AUDIT EXECUTION ENDED", {npmAuditParseData});
                }
            }
            catch (err) {
                console.error("NPM Audit Tech Error:", err.message);
                npmAuditParseData = { vulnerabilities: {} }; 
            }
        }

        //---Eslint analysis
        //---Eslint analysis
        if (scanTools.includes(CodeScannerTools.ESLINT)) {
            try {
                let finalConfigPath;
                let workingDir = tmpDir; 

                // Search for an existing configuration
                let searchResult = DirectoryHelper.locateFile({ filePath: path.join(tmpDir, 'eslint.config.js'), deep: 2 });
                if (!searchResult.safeFilePath) {
                    searchResult = DirectoryHelper.locateFile({ filePath: path.join(tmpDir, '.eslintrc.json'), deep: 2 });
                }

                if (!searchResult.safeFilePath) {
                    // FALLBACK : Use YOUR project's configuration (Absolute Path)
                    finalConfigPath = path.resolve(SCANNER_PROJECT_ROOT, 'eslint.config.mjs');
                }
                else {
                    finalConfigPath = searchResult.safeFilePath;
                    workingDir = path.dirname(finalConfigPath);
                }

                console.log("ESLint running in:", workingDir);
                const command = `"${ESLINT_BIN}" . -f json -c "${finalConfigPath}"`;

                const eslintOut = execSync(command, { 
                    cwd: workingDir, 
                    encoding: 'utf8',
                    maxBuffer: 5 * 1024 * 1024,
                    
                });
                eslintParseData = JSON.parse(eslintOut || '[]');
                console.log({eslintParseData})
                
            } catch (error) {
                // ESLint code 1 = vulnérabilités trouvées, on récupère le résultat
                if (error.stdout) {
                    try {
                        eslintParseData = JSON.parse(error.stdout);
                    } catch(e) {
                        eslintParseData = [];
                    }
                } else {
                    console.log("ESLint Tech Error:", error.message);
                    eslintParseData = [];
                }
            }
        }

        //Generate result
        const result = AnalysisOrchestrator.generateScannerResult({
            eslintParseData,
            npmAuditParseData,
            semgrepParseData
        })

        return result
    }


    
    /**
     * This function  helps mapping the code analyse result into
     * formatted data model produce by the system (for uniformity)
     * @param {Object} param0 
    static generateScannerResult({ eslintParseData, npmAuditParseData, semgrepParseData })
     * @param {Object} param0.eslintParseData
     * @param {Object} param0.npmAuditParseData
     * @param {Object} param0.semgrepParseData
     * @returns {ScanResult} 
     * @returns 
     */
    static generateScannerResult({ eslintParseData, npmAuditParseData, semgrepParseData })
    {
        let mappedOWASP = semgrepParseData
            ? AnalysisOrchestrator.mapOwasp(semgrepParseData)
            : null;

        /** @type {MappedIssue[]} */
        let auditResults = [];
        if (npmAuditParseData?.advisories)
        {
            const { advisories = {}, actions = [] } = npmAuditParseData;

            Object.values(advisories).forEach(advisory => {

                const fixAction = actions.find(a => a.module === advisory.module_name);
                const targetVersion = fixAction?.target || null;

                advisory.findings?.forEach(finding => {
                    finding.paths?.forEach(file_path => {

                        const fingerprint = CryptoSecurityService.encode(
                            `${advisory.module_name}|${finding.version}|${file_path}|${advisory.severity}|${advisory.title}`
                        );

                        const issue = new MappedIssue({
                            check_id: `${advisory.id}`,
                            file_path,
                            errorName: advisory.title,
                            start_index: null,
                            end_index: null,
                            message: advisory.title,
                            severity: Finding.mapSeverity(advisory.severity),
                            code: `${advisory.module_name}@${finding.version}`,
                            fingerprint
                        });

                        issue.oldVersion = finding.version;
                        issue.correctVersion = targetVersion;
                        issue.module_name = advisory.module_name;

                        auditResults.push(issue);
                    });
                });
            });
        }

        /** @type {MappedIssue[]} */
        let eslintResults = [];
        if (Array.isArray(eslintParseData)) {

            eslintParseData.forEach(file => {

                file.messages?.forEach(msg => {

                    const fingerprint = CryptoSecurityService.encode(
                        `${msg.ruleId}|${file.filePath}|${msg.column}|${msg.message}`
                    );

                    const errorName =
                        msg.ruleId
                            ? msg.ruleId
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, c => c.toUpperCase())
                            : null;

                    eslintResults.push(new MappedIssue({
                        check_id: msg.ruleId ?? null,
                        errorName,
                        file_path: file.filePath ?? null,
                        start_index: msg.line ?? null,
                        end_index: msg.endLine ?? null,
                        message: msg.message ?? null,
                        severity: msg.severity ?? null,
                        code: msg.source ?? null,
                        fingerprint
                    }));

                });

            });

        }

        // console.log("[Generate scan result] Generated scan result - (For Debug): ", {
        //     mappedOWASP: JSON.stringify(mappedOWASP),
        //     eslintResults: JSON.stringify(eslintResults),
        //     auditResults :JSON.stringify(auditResults)
        // })

        const securityScorePoint =
            AnalysisOrchestrator.calculateSecurityScorePoints(mappedOWASP, eslintResults, auditResults);

        const result = new ScanResult({
            securityScorePoint,
            semgrepResults: semgrepParseData,
            eslintResults,
            npmAuditResults: npmAuditParseData,
            owasp: mappedOWASP,
            eslint: eslintResults,
            npmAudit: auditResults,
            message: 'Scan completed successfully'
        });

        
        return result
    }
    

    /**
     * Filters Semgrep analysis results based on their classification
     * within the OWASP Top 10 categories.
     *
     * Returns null if the input is invalid or an error occurs.
     * Otherwise, it returns an OwaspCategoryMap containing the
     * categorized results.
     *
     * @param {*} semgrepResults - The results returned by the Semgrep analysis.
     * @returns {OwaspCategoryMap | null} The categorized results or null on failure.
     */
    static mapOwasp(semgrepResults)
    {
        
        if (!semgrepResults?.results || 
                !Array.isArray(semgrepResults.results) || 
                semgrepResults.results.length === 0
            ) {
            return null;
            }
            
            const categories = new OwaspCategoryMap();
            semgrepResults.results.forEach(issue => {

                const tags = issue?.extra?.metadata?.owasp ?? [];
                if(!Array.isArray(tags) || tags.length == 0) return null

                const check_id = issue.check_id ?? null
                const mappedIssue = new MappedIssue({
                    check_id,
                    file_path: issue.path ?? null,
                    errorName: SemgrepFormatter.toPrettyName(check_id),
                    start_index: issue.start?.line ?? null,
                    end_index: issue.end?.line ?? null,
                    message: issue.extra?.message ?? null,
                    severity: issue.extra?.severity ?? null,
                    code: Array.isArray(issue.extra?.lines)
                            ? issue.extra.lines.join('\n')
                            : issue.extra?.lines ?? null,
                    fingerprint: issue.extra?.fingerprint ?? null
                });

                let matched = false;

                Object.entries(categories).forEach(([key, value]) => {

                    if (key === "others") return;
                    if (!Array.isArray(value)) return; //ex: A_02, A4

                    const prefix = key.substring(0, 3);

                    if (
                        (Array.isArray(tags) && tags.some(tag => tag.startsWith(prefix))) ||
                        (typeof tags === "string" && tags.startsWith(prefix))
                    )
                    {
                        mappedIssue.severity = Finding.mapSeverity(
                            issue.extra?.severity,
                            [prefix]
                        );

                        categories[key].push(mappedIssue);
                        matched = true;
                    }

                });

                if (!matched) {
                    categories.others.push(mappedIssue);
                }

            });

            return categories;
        }



    /**
     * Calculate a security score based on issues from multiple tools.
     * @param {OwaspCategoryMap | null} mappedOWASP - the mapped OWASP results
     * @param { MappedIssue[] } eslintMappedIssues - ESLint mapped issues
     * @param { MappedIssue[] } npmAuditMappedIssues - NPM Audit mapped issues
     * @returns {number} - a score between 0(code not safe) - 100(code safe)
     */
    static calculateSecurityScorePoints(
        mappedOWASP = null,
        eslintMappedIssues = null,
        npmAuditMappedIssues = null
    ) {
        let score = 100;

        let toolNumber = 0;
        
        // Count how many tools are actually providing data
        if (mappedOWASP) 
            toolNumber++;
        
        if (eslintMappedIssues && eslintMappedIssues.length > 0) 
            toolNumber++;
        
        if (npmAuditMappedIssues && npmAuditMappedIssues.length > 0)
            toolNumber++;
        
        if (toolNumber === 0)
            toolNumber = 1; // éviter division par zéro
        

        // SEMGREP / OWASP issues
        if (mappedOWASP) {
            Object.values(mappedOWASP).forEach(category => {
                category.forEach(issue => {
                    const sev = issue.severity || "LOW";
                    score = ScoreAnalizer.calculateScorePoints(
                        score,
                        sev,
                        CodeScannerTools.SEMGREP,
                        toolNumber
                    );
                });
            });
        }

        // ESLint issues
        if (eslintMappedIssues && eslintMappedIssues.length > 0) {
            eslintMappedIssues.forEach(issue => {
                const sev = issue.severity || "LOW";
                score = ScoreAnalizer.calculateScorePoints(
                    score,
                    sev,
                    CodeScannerTools.ESLINT,
                    toolNumber
                );
            });
        }

        // NPM Audit issues
        if (npmAuditMappedIssues && npmAuditMappedIssues.length > 0) {
            npmAuditMappedIssues.forEach(issue => {
                const sev = issue.severity || "LOW";
                score = ScoreAnalizer.calculateScorePoints(
                    score,
                    sev,
                    CodeScannerTools.NPM_AUDIT,
                    toolNumber
                );
            });
        }

        // Clamp final score between 0 and 100
        score = Math.max(0, Math.round(score))
        return score;
    }
}



module.exports = AnalysisOrchestrator