const MappedIssue = require("../DTO/MappedIssue");
const Finding = require("../../../valueObjects/Finding");


const CryptoSecurityService = require("../../CryptoSecurityService");
const SolutionResult = require("../DTO/SolutionResult");
const { NpmFormatter } = require("../../../utils/Formatter");


/**
 * Maps npm audit results into a strict, immutable,
 * and system-friendly format.
 */
class NpmResultMapper
{
    /**
     * Transforms npm audit results into a strict, standardized object.
     *
     * @param {Object} options
     * @param { Object | null | undefined } options.result - The raw npm audit result. Nothing  is done if this param is falsy
     * @returns {MappedIssue[]} A normalized and immutable representation of the analysis.
     */

    static map({ result }) {
        let auditResults = [];

        if (result && result.vulnerabilities) {
            const { vulnerabilities } = result;

            // On boucle sur chaque package vulnérable
            Object.keys(vulnerabilities).forEach(pkgName => {
                const vuln = vulnerabilities[pkgName];

                // retreiving main infor mation

                const severity = vuln.severity;
                const currentVersion = vuln.range; // the current version
                
                // Extraction version solution (fix)
                const fixAvailable = vuln.fixAvailable;
                const fixVersion = fixAvailable.name === true ? 'latest' : fixAvailable.version
                const correctiveMeasure = fixAvailable 
                    ? `Update ${pkgName} to version ${fixVersion}`
                    : "No direct fix available. Check dependency tree.";

                // Construction of fingerprint
                const fingerprint = CryptoSecurityService.hash(
                    `NPM|${pkgName}|${severity}|${currentVersion}`
                );

                const issue = new MappedIssue({
                    check_id: NpmFormatter.generateCheckId(pkgName),     //ex: `npm-audit-${pkgName}`
                    file_path: 'package.json', 
                    errorName: `Vulnerability in ${pkgName}`,
                    start_index: null,
                    end_index: null,
                    message: `Package ${pkgName} has a ${severity} vulnerability. Range: ${currentVersion}`,
                    severity: Finding.mapSeverity(severity),
                    code: NpmFormatter.generateCode(pkgName, currentVersion,fixVersion ), //ex: `${pkgName}@${currentVersion}@fixVersion`
                    fingerprint
                });

                // Attach solution to last version
                const solution = new SolutionResult({ 
                    corrective_measure: correctiveMeasure 
                });
                
                issue.solution = solution; 

                auditResults.push(issue);
            });
        }

        return auditResults;
    }


}

module.exports = NpmResultMapper