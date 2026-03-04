
const fs = require('fs');
const unzipper = require('unzipper');
const os = require('os');

const path = require('path');
const { execSync } = require('child_process');

//Data Transfer object
const ScanResult = require('./DTO/ScanResult')
const MappedIssue = require('./DTO/MappedIssue')
const OwaspCategoryMap = require('./DTO/OwaspCategoryMap')

//services
const Passwordhasher = require('../services/PasswordHasher')
const CryptoSecurityService = require('../services/CryptoSecurityService')

//Enums
const CodeScannerTools = require('../enums/CodeScannerTool')

//Utils
const ScoreAnalizer = require('../utils/ScoreAnalyzer');
const { BASIC_UPLOADING_FOLDER_PATH } = require('../config/upload');
const Finding = require('../valueObjects/Finding');

// const mappedOWASP = mapToOWASP2025(semgrepResults);
// const securityScore = calculateSecurityScore(mappedOWASP);


class CodeScanner {

    /**
     * @param {Object} param0
     * @param {string} param0.repoUrl - represent the repo url to scan
     * @param {Array<string>} param0.scanTools - represent the list of tools to use for scanning (e.g. ['semgrep', 'eslint', 'npmAudit'])
     * @returns {Promis<ScanResult>}  - The result of teh scan
     */
    static performScan({repoUrl, scanTools}) {
        return new Promise((resolve, reject) => {

            let semgrepParseData = null;
            let npmAuditParseData = null;
            let eslintParseData = null;
            const tmpDir = path.join(os.tmpdir(), Date.now().toString());

            //Clone repository
            const gitCloneOutput = execSync(`git clone ${repoUrl} ${tmpDir}`,{ encoding: 'utf8'} )

            // SEMGREP
            if (scanTools.includes(CodeScannerTools.SEMGREP)) {
                const semgrepOut = execSync(
                    `semgrep --config=p/owasp-top10 ${tmpDir} --json`,
                    { encoding: 'utf8' }
                );
                semgrepParseData = JSON.parse(semgrepOut);
            }

            // NPM AUDIT
            if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                try {
                    const auditOut = execSync(
                        `cd ${tmpDir} && npm audit --json`,
                        { encoding: 'utf8' }
                    );
                    npmAuditParseData = JSON.parse(auditOut || '{}');
                }
                catch (err) {
                    npmAuditParseData = {};
                }
            }

            //ESLINT
            if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                try {
                    //Cmd command line
                    const eslintOut = execSync(
                        `eslint --extensions .js ${tmpDir} -f json`,
                        { encoding: 'utf8' }
                    );
                    eslintParseData = JSON.parse(eslintOut || '[]');
                }
                catch (err) {
                    eslintParseData = [];
                }
            }

            resolve(this.generateScannerResult({eslintParseData, npmAuditParseData, semgrepParseData }))
        });

    }

    /**
     * This function helps us perform scan on zip folder
     * @param {Object} param0
     * @param {string} param0.zip_name 
     * @param {string} param0.userId    - the unique identifier of the user 
     * @param {string[]} param0.scanTools - the tools used for scaning 
     * @returns 
     */
    static performZipScan({ zip_name, userId, path, scanTools}) {
        return new Promise((resolve, reject) => {

            const zipPath= path.join(BASIC_UPLOADING_FOLDER_PATH, userId, '/projects') //where zip file are saved
            const tmpDir = path.join(os.tmpdir(), Date.now().toString());


            let semgrepParseData = null;
            let npmAuditParseData = null;
            let eslintParseData = null;

            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: tmpDir }))
                .on('close', () => {
                    //SEMGREP
                    if (scanTools.includes(CodeScannerTools.SEMGREP)) {
                        const semgrepOut = execSync(
                            `semgrep --config=p/owasp-top10 ${tmpDir} --json`,
                            { encoding: 'utf8' }
                        );
                        semgrepParseData = JSON.parse(semgrepOut);
                    }


                    // NPM AUDIT
                    if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                        try {
                            const auditOut = execSync(
                                `npm audit --json`,
                                { cwd: tmpDir, encoding: 'utf8' }
                            );
                            npmAuditParseData = JSON.parse(auditOut || '{}');
                        } catch (err) {
                            // npm audit retourne souvent code != 0 si vulnérabilités
                            npmAuditParseData = err.stdout
                                ? JSON.parse(err.stdout)
                                : {};
                        }
                    }

                    //ESLINT
                    if (scanTools.includes(CodeScannerTools.ESLINT)) {
                        try {
                            const eslintOut = execSync(
                                `eslint --extensions .js ${tmpDir} -f json`,
                                { encoding: 'utf8' }
                            );
                            eslintParseData = JSON.parse(eslintOut || '[]');
                        } catch (err) {
                            // ESLint retourne souvent code 1 si erreurs trouvées
                            eslintParseData = [];
                        }
                    }
                    
                    
                    resolve(this.generateScannerResult({
                        eslintParseData,
                        npmAuditParseData,
                        semgrepParseData
                    }));
                })
                .on('error', reject);
        });
    }



    /**
     * This is the  function responsible for resolving scan data & retrive from api
     * @param {Object} param0 
     * @returns 
     */
    static generateScannerResult({ eslintParseData, npmAuditParseData, semgrepParseData }) {
        // SEMGREP
        /** @type {MappedIssue} */
        let mappedOWASP = null;  // The owaps issues mapped by categories, here!! 
        
        if (semgrepParseData) {
            mappedOWASP = CodeScanner.mapOwasp(semgrepParseData);
        }

        // NPM AUDIT
        /** @type {MappedIssue} */
        let auditResults = [];
        if (npmAuditParseData) {
            const { advisories = {}, actions = [] } = npmAuditParseData;

            Object.values(advisories).forEach(advisory => {
                const {
                    module_name,
                    severity = 'low',
                    title,
                    findings = []
                } = advisory;

                const fixAction = actions.find(a => a.module === module_name);
                const targetVersion = fixAction?.target || null;

                findings.forEach(finding => {
                    const { version: oldVersion, paths = [] } = finding;

                    paths.forEach(file_path => {
                        const fingerprint = CryptoSecurityService.encode(
                            `${module_name}|${oldVersion}|${file_path}|${severity}|${title}`
                        );

                        // Exemple
                        const check_id = `${advisory.id}-${finding.version}-${finding.paths[0]}`;
                        const issue = new MappedIssue({
                            check_id,
                            file_path,
                            start_index: null, 
                            end_index: null,  
                            title, 
                            severity: Finding.mapSeverity(severity),
                            code: `${module_name}@${oldVersion}`,
                            fingerprint
                        });

                        issue.oldVersion = oldVersion;
                        issue.correctVersion = targetVersion;
                        issue.module_name = module_name;

                        auditResults.push(issue);
                    });
                });
            });
        }

        // ESLINT
        /** @type {MappedIssue} */
        let eslintResults = [];
        if (eslintParseData) {
            eslintParseData.forEach(file => {
                const { filePath: file_path, messages = [] } = file;

                messages.forEach(msg => {
                    const { 
                        ruleId,
                        severity,
                        message,
                        line: start_index,
                        endLine: end_index,
                        source: code,
                        column
                    } = msg;

                    const fingerprint = CryptoSecurityService.encode(
                        `${ruleId}|${file_path}|${column}|${message}`
                    );

                    const issue = new MappedIssue({
                        check_id: `${ruleId}`,
                        file_path,
                        start_index,
                        end_index,
                        message,
                        severity,
                        code,
                        fingerprint
                    });

                    eslintResults.push(issue);
                });
            });
        }

        const securityScorePoint = CodeScanner.calculateSecurityScorePoints(mappedOWASP);

        return new ScanResult({
            securityScorePoint,
            semgrepResults: semgrepParseData,
            eslintResults: eslintParseData,
            npmAuditResults: npmAuditParseData,
            owasp: mappedOWASP,
            eslint: eslintResults,
            npmAudit: auditResults,
            message: 'Scan completed successfully'
        });
    }



    /**
     * Classify semgrep results into OWASP categories based on the metadata tags provided by semgrep rules.
     * @param {Object} semgrepResults - The raw results from semgrep scan.arguments
     * @returns {OwaspCategoryMap[]}
     */
    static mapOwasp(semgrepResults) {
        const categories = new OwaspCategoryMap ();

        if (!semgrepResults?.results)
            return categories;

        semgrepResults.results.forEach(issue => {

            const owaspTag = issue.extra.metadata?.owasp;
            const {
                check_id,
                path: file_path,
                start: { line: start_index } = {},
                end: { line: end_index } = {},
                extra: { 
                    message,
                    severity = 'LOW',
                    fingerprint,
                    lines: code = [] ,
                    metadata
                } = {},
            } = issue;

            const mappedIssue = new MappedIssue({
                check_id,
                file_path,
                start_index,
                code: code.join('\n'),
                end_index, 
                message: message,
                severity: severity,
                fingerprint
            });

            if(!owaspTag)
                return;

            if (owaspTag.includes("A01")) 
                categories.A01_Broken_Access_Control.push(mappedIssue);

            else if (owaspTag.includes("A02")) 
                categories.A02_Cryptographic_Failures.push(mappedIssue);
            else if (owaspTag.includes("A03")) 
                categories.A03_Injection.push(mappedIssue);
            
            else if (owaspTag.includes("A04")) 
                categories.A04_Insecure_Design.push(mappedIssue);

            else if (owaspTag.includes("A05")) 
                categories.A05_Security_Misconfiguration.push(mappedIssue);

            else if (owaspTag.includes("A06")) 
                categories.A06_Vulnerable_Components.push(mappedIssue);

            else if (owaspTag.includes("A07")) 
                categories.A07_Auth_Failures.push(mappedIssue);

            else if (owaspTag.includes("A08")) 
                categories.A08_Data_Integrity_Failures.push(mappedIssue);

            else if (owaspTag.includes("A09")) 
                categories.A09_Logging_Failures.push(mappedIssue);

            else if (owaspTag.includes("A10")) 
                categories.A10_SSRF.push(mappedIssue);

        });

        return categories;

    }

    /**
     * This function calculates a security score (points) for the scann
     * @param {MappedIssue} mappedOWASP - The categorized OWASP findings from the mapOwasp function.
     * @return {number} 
    */
    static calculateSecurityScorePoints(mappedOWASP) {
        let score = 100;

        Object.values(mappedOWASP).forEach(category => {
            category.forEach(issue => {
                const sev = issue.severity?.toUpperCase() || "LOW";
                score = ScoreAnalizer.calculateScorePoints(score, sev)
            });
        });
        return score < 0 ? 0 : score;
   }

}



module.exports = CodeScanner;