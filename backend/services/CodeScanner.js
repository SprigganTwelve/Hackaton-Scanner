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



/**
 * This class is a service that can be used for scaning a code (or repository)
 * 
 * Here you have what is returned by the Semgrep API when scaning with owas top ten as config : https://saeed0x1.medium.com/optimizing-static-application-security-testing-sast-with-semgrep-gemini-cli-b4152e0307c6
 * Here you have what is retuen by Eslint API : https://eslint.org/docs/latest/use/formatters/
 */
class CodeScanner {

    static PYTHON_CMD = os.platform() === 'win32' ? 'py' : 'python';

    static performScan({ repoUrl, scanTools }) {
        return new Promise((resolve, reject) => {
            try {
                let semgrepParseData = null;
                let npmAuditParseData = null;
                let eslintParseData = null;

                const tmpDir = path.join(os.tmpdir(), Date.now().toString());

                execSync(`git clone ${repoUrl} ${tmpDir}`, { encoding: 'utf8' });

                if (scanTools.includes(CodeScannerTools.SEMGREP)) {
                    const semgrepOut = execSync(
                        `semgrep --config="p/owasp-top-ten"  ${tmpDir} --json`,
                        { encoding: 'utf8' }
                    );
					console.log(semgrepOut);
                    semgrepParseData = JSON.parse(semgrepOut);
                }

                if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                    try {
                        const auditOut = execSync(
                            `cd ${tmpDir} && npm audit --json`,
                            { encoding: 'utf8' }
                        );
                        console.log(auditOut)
                        npmAuditParseData = JSON.parse(auditOut || '{}');
                    }
                    catch (err) {
                        npmAuditParseData = err.stdout
                            ? JSON.parse(err.stdout)
                            : {};
                    }
                }

                if (scanTools.includes(CodeScannerTools.ESLINT)) {
                    try {
                        const eslintOut = execSync(
                            `eslint --ext .js ${tmpDir} -f json`,
                            { encoding: 'utf8' }
                        );
                        console.log(eslintOut)
                        eslintParseData = JSON.parse(eslintOut || '[]');
                    } catch {
                        eslintParseData = [];
                    }
                }

                resolve(this.generateScannerResult({
                    eslintParseData,
                    npmAuditParseData,
                    semgrepParseData
                }));

            } catch (err) {
                reject(err);
            }
        });
    }

    static performZipScan({ 
        zip_name,
        userId,
        scanTools 
    }) {
        return new Promise((resolve, reject) => {
            const zipPath = path.join(
                BASIC_UPLOADING_FOLDER_PATH,
                userId,
                'projects',
                zip_name
            );

            const tmpDir = path.join(os.tmpdir(), Date.now().toString());

            let semgrepParseData = null;
            let npmAuditParseData = null;
            let eslintParseData = null;

            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: tmpDir }))
                .on('close', () => {

                    if (scanTools.includes(CodeScannerTools.SEMGREP)) {
                        const semgrepOut = execSync(
                            `semgrep --config="p/owasp-top-ten" ${tmpDir} --json`,
                            { encoding: 'utf8' }
                        );
                        semgrepParseData = JSON.parse(semgrepOut);
                    }

                    if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                        try {
                            const auditOut = execSync(
                                `npm install --package-lock-only && npm audit --json`,
                                { cwd: tmpDir, encoding: 'utf8' }
                            );
                            npmAuditParseData = JSON.parse(auditOut || '{}');
                        } catch (err) {
                            npmAuditParseData = err.stdout
                                ? JSON.parse(err.stdout)
                                : {};
                        }
                    }

                    if (scanTools.includes(CodeScannerTools.ESLINT)) {
                        try {
                            const eslintOut = execSync(
                                `eslint --ext .js ${tmpDir} -f json`,
                                { encoding: 'utf8' }
                            );
                            eslintParseData = JSON.parse(eslintOut || '[]');
                        } catch {
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

    static generateScannerResult({ eslintParseData, npmAuditParseData, semgrepParseData }) {

        let mappedOWASP = semgrepParseData
            ? CodeScanner.mapOwasp(semgrepParseData)
            : null;

        let auditResults = [];
        if (npmAuditParseData?.advisories) {
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
                            title: advisory.title,
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

        let eslintResults = [];
        if (Array.isArray(eslintParseData)) {

            eslintParseData.forEach(file => {

                file.messages?.forEach(msg => {

                    const fingerprint = CryptoSecurityService.encode(
                        `${msg.ruleId}|${file.filePath}|${msg.column}|${msg.message}`
                    );

                    const title =
                        msg.ruleId
                            ? msg.ruleId
                                .replace(/-/g, " ")
                                .replace(/\b\w/g, c => c.toUpperCase())
                            : null;

                    eslintResults.push(new MappedIssue({
                        check_id: msg.ruleId ?? null,
                        title,
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

        const securityScorePoint =
            CodeScanner.calculateSecurityScorePoints(mappedOWASP);

        return new ScanResult({
            securityScorePoint,
            semgrepResults: semgrepParseData,
            eslintResults,
            npmAuditResults: npmAuditParseData,
            owasp: mappedOWASP,
            eslint: eslintResults,
            npmAudit: auditResults,
            message: 'Scan completed successfully'
        });
    }



   static mapOwasp(semgrepResults)
   {
        const categories = new OwaspCategoryMap();

        if (!semgrepResults?.results || !Array.isArray(semgrepResults.results)) {
            return categories;
        }

        semgrepResults.results.forEach(issue => {

            const tags = issue?.extra?.metadata?.owasp ?? [];

            const mappedIssue = new MappedIssue({
                check_id: issue.check_id ?? null,
                file_path: issue.path ?? null,
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
                if (!Array.isArray(value)) return;

                const prefix = key.substring(0, 3);

                if (
                    (Array.isArray(tags) && tags.some(tag => tag.startsWith(prefix))) ||
                    (typeof tags === "string" && tags.startsWith(prefix))
                )
                {
                    mappedIssue.severity = Finding.mapSeverity(
                        issue.extra?.severity,
                        prefix
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
     * @param {OwaspCategoryMap} mappedOWASP - the mapped OWASP results
     * @param {MappedIssue[]} eslintMappedIssues - ESLint mapped issues
     * @param {MappedIssue[]} npmAuditMappedIssues - NPM Audit mapped issues
     * @returns {number} - a score between 0 and 100
     */
    static calculateSecurityScorePoints(
        mappedOWASP = null,
        eslintMappedIssues = null,
        npmAuditMappedIssues = null
    ) {
        let score = 100;

        // Count how many tools are actually providing data
        let toolNumber = 0;
        if (mappedOWASP) toolNumber++;
        if (eslintMappedIssues && eslintMappedIssues.length > 0) toolNumber++;
        if (npmAuditMappedIssues && npmAuditMappedIssues.length > 0) toolNumber++;
        if (toolNumber === 0) toolNumber = 1; // éviter division par zéro


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