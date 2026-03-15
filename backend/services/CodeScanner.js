const fs = require('fs');
const unzipper = require('unzipper');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

// DTO
const ScanResult = require('./DTO/ScanResult');
const MappedIssue = require('./DTO/MappedIssue');
const OwaspCategoryMap = require('./DTO/OwaspCategoryMap');

// Services
const CryptoSecurityService = require('../services/CryptoSecurityService');

// Enums
const CodeScannerTools = require('../enums/CodeScannerTool');

// Utils
const ScoreAnalizer = require('../utils/ScoreAnalyzer');
const { BASIC_UPLOADING_FOLDER_PATH } = require('../config/upload');
const Finding = require('../valueObjects/Finding');
const SemgrepFormatter = require('../utils/Formatter');



/**
 * This class is a service that can be used for scaning a code (or repository)
 * 
 * Here you have what is returned by the Semgrep API when scaning with owas top ten as config : https://saeed0x1.medium.com/optimizing-static-application-security-testing-sast-with-semgrep-gemini-cli-b4152e0307c6
 * Here you have what is retuen by Eslint API : https://eslint.org/docs/latest/use/formatters/
 * @returns {[]}
 */
class CodeScanner {

    static PYTHON_CMD = os.platform() === 'win32' ? 'py' : 'python';

    static performScan({ repoUrl, scanTools }) {
        return new Promise((resolve, reject) => {
            const tmpDir = path.join(os.tmpdir(), Date.now().toString());
            try {
                let semgrepParseData = null;
                let npmAuditParseData = null;
                let eslintParseData = null;

                if(!fs.existsSync(tmpDir))
                {
                    fs.mkdirSync(tmpDir, {recursive: true})
                }


                execSync(`git clone ${repoUrl} ${tmpDir}`, { encoding: 'utf8' });

                if (scanTools.includes(CodeScannerTools.SEMGREP)) {
                    try{
                        const semgrepOut = execSync(
                            `semgrep --config="p/owasp-top-ten" ${tmpDir} --json`,
                            { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 }
                        );
                        console.log(semgrepOut);
                        semgrepParseData = JSON.parse(semgrepOut);
                    }
                    catch(error){
                        console.log("Something went wrong while executing semgerp, error ", (error)?.message)
                    }
                }

                if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                    try {
  
                        execSync(`npm install --package-lock-only`, { cwd: tmpDir });
                        const auditOut = execSync(`npm audit --json`, { cwd: tmpDir, encoding: 'utf8' });
                        npmAuditParseData = JSON.parse(auditOut || '{}');
                    }
                    catch (error) {
                        console.log("Something went wrong while installing package lock json, error ", (error)?.message)
                        npmAuditParseData = error.stdout
                            ? JSON.parse('{}')
                            : {};
                    }
                }

                if (scanTools.includes(CodeScannerTools.ESLINT)) {
                    try {
                        const eslintOut = execSync(`eslint --ext .js . -f json`, { cwd: tmpDir, encoding: 'utf8' });
                        eslintParseData = JSON.parse(eslintOut || '[]');
                    } 
                    catch(error) {
                        console.log("Something went wrong while executing eslint, error ", (error)?.message)
                        eslintParseData = [];
                    }
                }

                const result = CodeScanner.generateScannerResult({
                    eslintParseData,
                    npmAuditParseData,
                    semgrepParseData
                })
                
                console.log("Deleting git clone: ", tmpDir)
                console.log("Processing ....")
                fs.rmSync(tmpDir, { recursive: true, force: true })
                console.log("Deleting git done!!")
                
                // console.log("RESULT: ", result)
                resolve(result);
            }
            catch (err) {
                if(fs.existsSync(tmpDir)){
                    console.log("[ERROR HANDLER] Deleting git clone: ", tmpDir)
                    console.log("[ERROR HANDLER] Processing ....")
                    fs.rmSync(tmpDir, { recursive: true, force: true })
                    console.log("[ERROR HANDLER] Deleting git done!!")
                }
                reject(err);
            }
        });
    }


    static performZipScan({ zip_name, userId, scanTools }) {
        return new Promise(async (resolve, reject) => {
            const zipPath = path.join(BASIC_UPLOADING_FOLDER_PATH, userId, 'projects', zip_name);
            const tmpDir = path.join(os.tmpdir(), `scan_${Date.now()}`);

            try {
                if(!fs.existsSync(zipPath)){
                    console.log("The zip file scanned right now, doesn't exist in the storage, path: ", zipPath)
                    return;
                }
                // Create Temp folder
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                console.log("Unzipping file...");
                
                // Await  fiel unzipping
                await fs.createReadStream(zipPath)
                    .pipe(unzipper.Extract({ path: tmpDir }))
                    .promise();

                console.log("Unzip completed. Zip Scanning Started...");

                let semgrepParseData = null;
                let npmAuditParseData = null;
                let eslintParseData = null;

                // --- SEMGREP ---
                if (scanTools.includes(CodeScannerTools.SEMGREP)) {
                    try {
                        const semgrepOut = execSync(
                            `semgrep --config="p/owasp-top-ten" "${tmpDir}" --json`,
                            { 
                                encoding: 'utf8',
                                maxBuffer: 10 * 1024 * 1024,
                                stdio: ['pipe', 'pipe', 'ignore']
                            }
                        );
                        semgrepParseData = JSON.parse(semgrepOut);
                    }
                    catch (err) {
                        console.warn("Semgrep error:", err.message);
                    }
                }

                // --- NPM AUDIT ---
                if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                    try {
                        //Check for packages.json
                        if (fs.existsSync(path.join(tmpDir, 'package.json'))) {
                            execSync(`npm install --package-lock-only`, { cwd: tmpDir });
                            const auditOut = execSync(`npm audit --json`, { cwd: tmpDir, encoding: 'utf8' });
                            npmAuditParseData = JSON.parse(auditOut || '{}');
                        }
                    }
                    catch (err) {
                        npmAuditParseData = err.stdout ? JSON.parse(err.stdout) : {};
                        console.log("Something went wrong while executing npm, error ", (err)?.message)
                    }
                }

                // --- ESLINT ---
                if (scanTools.includes(CodeScannerTools.ESLINT)) {
                    try {
                        const eslintOut = execSync(`eslint --ext .js . -f json`, { cwd: tmpDir, encoding: 'utf8' });
                        eslintParseData = JSON.parse(eslintOut || '[]');
                    }
                    catch (error) {
                        eslintParseData = error.stdout ? JSON.parse(error.stdout) : [];
                        console.log("Something went wrong while executing eslint, error ", (error)?.message)
                    }
                }

                const finalResult = CodeScanner.generateScannerResult({
                    eslintParseData,
                    npmAuditParseData,
                    semgrepParseData
                });

                console.log("Unzip File Scanned!!");
                // Nettoyage
                console.log("Cleaning up:", tmpDir);
                fs.rmSync(tmpDir, { recursive: true, force: true });

                resolve(finalResult);

            }
            catch (err) {
                console.error("Critical Scan Error:", err);
                if (fs.existsSync(tmpDir)) {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                }
                reject(err);
            }
        });
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
            ? CodeScanner.mapOwasp(semgrepParseData)
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
            CodeScanner.calculateSecurityScorePoints(mappedOWASP, eslintResults, auditResults);

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
     * @returns {number} - a score between 0 and 100
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
                    const sev = issue.severity?.toUpperCase() || "LOW";
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
                const sev = issue.severity?.toUpperCase() || "LOW";
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
                const sev = issue.severity?.toUpperCase() || "LOW";
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

module.exports = CodeScanner;