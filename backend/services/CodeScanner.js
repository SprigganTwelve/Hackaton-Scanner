
const fs = require('fs');
const unzipper = require('unzipper');
const os = require('os');

const path = require('path');
const { exec } = require('child_process');

const mappedOWASP = mapToOWASP2025(semgrepResults);
const securityScore = calculateSecurityScore(mappedOWASP);

class CodeScanner {

    /**
     * @param {string} repoUrl - represent the repo url to scan
     * @param {Array<string>} scannTools - represent the list of tools to use for scanning (e.g. ['semgrep', 'eslint', 'npmAudit'])
     */
    static performScan(repoUrl, scannTools) {
        return new Promise((resolve, reject) => {

            let semgrepResults = null;
            let eslintResults = null;
            let auditResults = null;
            const tmpDir = path.join(os.tmpdir(), Date.now().toString());

            //Get Semgrep result if selected
            if(scannTools.includes('semgrep')){
                exec(`git clone ${repoUrl} ${tmpDir}`, (err) => {
                    //handle git clone error
                    if (err)
                        return reject(new Error(`Erreur lors du clonage du dépôt: ${err.message}`));
                    exec(`semgrep --config=p/owasp-top10 ${tmpDir} --json`, (err, semgrepOut) => {
                        //handle semgrep error
                        if (err)
                            return reject(new Error(`Erreur lors de l'exécution de Semgrep: ${err.message}`));
                        semgrepResults = JSON.parse(semgrepOut)
                    })
                })
            }

            if(scannTools.includes('eslint')){
                exec(`eslint --extensions .js ${tmpDir} -f json`, (err, eslintOut) => {
                    if (err) 
                        eslintOut = '[]'; 
                    eslintResults = JSON.parse(eslintOut);
                })
            }

            if(scannTools.includes('npmAudit')){
                exec(`cd ${tmpDir} && npm audit --json`, (err, auditOut) => {
                    if (err) auditOut = '{}';
                    auditResults = JSON.parse(auditOut || '{}');
                })
            }

            resolve({
                securityScore,
                owasp: mappedOWASP,
                eslint: eslintResults,
                npmAudit: auditResults,
                message: 'Scan completed successfully'
            });
        });

}

    static performZipScan(zipPath) {
        return new Promise((resolve, reject) => {
            const tmpDir = path.join(os.tmpdir(), Date.now().toString());

            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: tmpDir }))
                .on('close', () => {
                    exec(`semgrep --config=p/owasp-top10 ${tmpDir} --json`, (err, semgrepOut) => {
                        if (err) return reject(new Error(`Erreur lors de l'exécution de Semgrep: ${err.message}`));

                        const semgrepResults = JSON.parse(semgrepOut);

                        exec(`eslint --extensions .js ${tmpDir} -f json`, (err, eslintOut) => {
                            if (err) eslintOut = '[]';

                            const eslintResults = JSON.parse(eslintOut || '[]');

                            exec(`cd ${tmpDir} && npm audit --json`, (err, auditOut) => {
                                if (err) auditOut = '{}';

                                const auditResults = JSON.parse(auditOut || '{}');

                                resolve({
                                    securityScore,
                                    owasp: mappedOWASP,
                                    eslint: eslintResults,
                                    npmAudit: auditResults
                                });
                            });
                        });
                    });
                })
                .on('error', reject);
        });
    }

    /**
     * Classify semgrep results into OWASP categories based on the metadata tags provided by semgrep rules.
     * @param {Object} semgrepResults - The raw results from semgrep scan.arguments
     */
    static mapOwasp(semgrepResults) {
        const categories = {
            A01_Broken_Access_Control: [],
            A02_Security_Misconfiguration: [],
            A03_Software_Supply_Chain_Failures: [],
            A04_Cryptographic_Failures: [],
            A05_Injection: [],
            A06_Insecure_Design: [],
            A07_Auth_Failures: [],
            A08_Data_Integrity_Failures: [],
            A09_Logging_Failures: [],
            A10_Mishandling_Of_Exceptional_onditions: []
        };

        if (!semgrepResults.results)
            return categories;

        semgrepResults.results.forEach(issue => {

            const owaspTag = issue.extra.metadata?.owasp;

            const mappedIssue = {
                file: issue.path,
                line: issue.start?.line,
                message: issue.extra?.message,
                severity: issue.extra?.severity
            };

            if(!owaspTag) return;

            if (owaspTag.includes("A01")) categories.A01_Broken_Access_Control.push(mappedIssue);
            else if (owaspTag.includes("A02")) categories.A02_Cryptographic_Failures.push(mappedIssue);
            else if (owaspTag.includes("A03")) categories.A03_Injection.push(mappedIssue);
            else if (owaspTag.includes("A04")) categories.A04_Insecure_Design.push(mappedIssue);
            else if (owaspTag.includes("A05")) categories.A05_Security_Misconfiguration.push(mappedIssue);
            else if (owaspTag.includes("A06")) categories.A06_Vulnerable_Components.push(mappedIssue);
            else if (owaspTag.includes("A07")) categories.A07_Auth_Failures.push(mappedIssue);
            else if (owaspTag.includes("A08")) categories.A08_Data_Integrity_Failures.push(mappedIssue);
            else if (owaspTag.includes("A09")) categories.A09_Logging_Failures.push(mappedIssue);
            else if (owaspTag.includes("A10")) categories.A10_SSRF.push(mappedIssue);

        });

        return categories;

    }

    /**
     * 
     */
    static calculateSecurityScore(mappedOWASP) {
        let score = 100;

        Object.values(mappedOWASP).forEach(category => {
            category.forEach(issue => {

                const sev = issue.severity?.toUpperCase() || "LOW";

                if (sev === "CRITICAL") score -= 30;
                else if (sev === "ERROR" || sev === "HIGH") score -= 20;
                else if (sev === "WARNING" || sev === "MEDIUM" || sev === "MODERATE") score -= 10;
                else score -= 5;
            });
        });

        return score < 0 ? 0 : score;
   }


}



module.exports = UserRepository;