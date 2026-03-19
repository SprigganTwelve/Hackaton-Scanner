const fs = require('fs')
const { execSync } = require('child_process');
const path = require('path');

const DirectoryHelper = require("../../../utils/DirectoryHelper");


/**
 * Handler that deal with npm scan request
 * or anything related task
 */
class NpmScanner
{
    /**
     * Executes an npm audit in the specified directory and returns the raw results.
     *
     * @param {Object} options - Options for the audit.
     * @param {string} options.tmpDir - The temporary directory where the npm project is located.
     * @returns {Object|undefined} The raw audit result, or undefined if the audit fails.
     */
    static runAnalysis({tmpDir}){
        try {
            console.log("NPM scanning is running...")

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
                    console.log("NPM Ausit result")
                    console.log(auditOut)
                    return JSON.parse(auditOut || '{}');
                } 
                catch (auditError) {
                    // npm audit returns a status code of 1 if vulnerabilities are found (the normal case)
                    if (auditError.stdout) {
                        try {
                            return JSON.parse(auditError.stdout);
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
            return { vulnerabilities: {} }; 
        }
    }
}

module.exports = NpmScanner