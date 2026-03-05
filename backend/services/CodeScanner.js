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

class CodeScanner {

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
                        `semgrep --config=p/owasp-top10 ${tmpDir} --json`,
                        { encoding: 'utf8' }
                    );
                    semgrepParseData = JSON.parse(semgrepOut);
                }

                if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                    try {
                        const auditOut = execSync(
                            `cd ${tmpDir} && npm audit --json`,
                            { encoding: 'utf8' }
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

            } catch (err) {
                reject(err);
            }
        });
    }

    static performZipScan({ zip_name, userId, scanTools }) {
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
                            `semgrep --config=p/owasp-top10 ${tmpDir} --json`,
                            { encoding: 'utf8' }
                        );
                        semgrepParseData = JSON.parse(semgrepOut);
                    }

                    if (scanTools.includes(CodeScannerTools.NPM_AUDIT)) {
                        try {
                            const auditOut = execSync(
                                `npm audit --json`,
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
        if (eslintParseData) {
            eslintParseData.forEach(file => {
                file.messages?.forEach(msg => {

                    const fingerprint = CryptoSecurityService.encode(
                        `${msg.ruleId}|${file.filePath}|${msg.column}|${msg.message}`
                    );

                    eslintResults.push(new MappedIssue({
                        check_id: msg.ruleId,
                        title:  ruleId?.replace(/-/g, " ")?.replace(/\b\w/g, (c) => c.toUpperCase()) ?? null,
                        file_path: file.filePath,
                        start_index: msg.line,
                        end_index: msg.endLine,
                        message: msg.message,
                        severity: msg.severity,
                        code: msg.source,
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

    static mapOwasp(semgrepResults) {
        const categories = new OwaspCategoryMap();

        if (!semgrepResults?.results) return categories;

        semgrepResults.results.forEach(issue => {

            const owaspTag = issue.extra?.metadata?.owasp;

            const mappedIssue = new MappedIssue({
                check_id: issue.check_id,
                file_path: issue.path,
                start_index: issue.start?.line,
                end_index: issue.end?.line,
                message: issue.extra?.message,
                severity: issue.extra?.severity,
                code: issue.extra?.lines?.join('\n'),
                fingerprint: issue.extra?.fingerprint
            });

            if (!owaspTag) return;

            Object.keys(categories).forEach(key => {
                if (owaspTag.includes(key.substring(0, 3))) {
                    categories[key].push(mappedIssue);
                }
                else{
                    categories.others.push(mappedIssue)
                }
            });
        });

        return categories;
    }

    static calculateSecurityScorePoints(mappedOWASP) {
        if (!mappedOWASP) return 100;

        let score = 100;

        Object.values(mappedOWASP).forEach(category => {
            category.forEach(issue => {
                const sev = issue.severity?.toUpperCase() || "LOW";
                score = ScoreAnalizer.calculateScorePoints(score, sev);
            });
        });

        return score < 0 ? 0 : score;
    }
}

module.exports = CodeScanner;