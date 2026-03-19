
const { execSync } = require('child_process');

/**
 * Utility class for handling Semgrep analysis.
 * Provides methods to run Semgrep scans and retrieve results.
 */
class SemgrepScanner
{
    /**
     * Handles Semgrep analysis and retrieves the raw results.
     *
     * @param {Object} param
     * @param {string} param.tmpDir - The temporary directory containing the files to analyze.
     * @returns {Object|null} The raw analysis result, or null if the analysis fails or no result is obtained.
     */
    static runAnalysis({tmpDir}){
        try{
            console.log("Semgrep Scanning running...")
            const semgrepOut = execSync(
                `semgrep --config="p/owasp-top-ten" ${tmpDir} --json`,
                { 
                    encoding: 'utf8',
                    stdio: ['ignore', 'pipe', 'ignore'],
                    maxBuffer: 10 * 1024 * 1024
                }
            );
            return JSON.parse(semgrepOut);
        }
        catch(error){
            console.log("Something went wrong while executing semgerp, error ", (error)?.message)
            return null
        }
    }
}

module.exports = SemgrepScanner;
