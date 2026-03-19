
class SemgrepFormatter 
{
    /**
     *  Converts a technical check_id into a human-readable name for the dashboard.
     *  Example: "javascript.express.security.audit.xss.direct-res" -> "Xss Direct Res"
     *  @param {?string} checkId - Semgrep's raw check_id
     *  @returns {string}  formatted string
     */
    static toPrettyName(checkId){
        if(!checkId){
            console.log("[SemgrepFormatter::toPrettyName] - Please provide a check id for processing further...")
            return;
        }
        const parts = checkId.split('.')
        const relevantsParts = parts.length > 2 ? parts.slice(-2) : parts
        
        return relevantsParts
                .map(part => {
                    const cleanPart = part.replace(/[-_]/g, ' ')
                    return cleanPart.charAt(0).toLocaleUpperCase() + cleanPart.slice(1);
                })
                .join(' ')
    }
}


/**
 * Normalizer for handling special encoding and decoding logic
 * (business logic layer)
 */
class NpmFormatter
{
    /**
     * responsible of turning npm audit
     * turn checkId into a something pretty or some title readble by the user
     * @param {string} check_id - special generated checkId for npm audit vulnerability
     * @returns {string}
     */
    static toPrettyName(check_id){
        const parts = check_id.split('-')
        const pkgName = parts.
        return`Vulnerability in ${pkgName}`
    }

    /**
     * Generates a custom checkId for npm audit analysis results.
     *
     * @param {string} pkgName - Name of the package
     * @returns {string} Generated checkId
     */
    static generateCheckId(pkgName){
        return `npm-audit-${pkgName}`;
    }

    /**
     * Defines the required format for representing npm audit results
     * within the system. This format is used to encode and decode
     * meaningful vulnerability information.
     *
     * Centralizes the logic for generating identifiers in this context.
     *
     * @param {string} pkgName - Name of the package
     * @param {string} currentVersion - Current installed version of the package
     * @returns {string} Generated identifier following the defined format
     */
    static  generateCode(pkgName, currentVersion) {
        return `${pkgName}@${currentVersion}`
    }

    /**
     * Parses a generated code and returns the corresponding
     * vulnerability details.
     *
     * @param {string} code - Encoded vulnerability identifier
     * @returns {{ title: string, currentVersion: string, fixedVersion: string }}
     * Extracted data from the code
     */
    static decode(code){
        const [title, currentVersion, fixVersion] = code.split('@')
        return { title, currentVersion, fixedVersion }
    }
}



class EslintFormatter{
    /**
     * turn ruleId into a something pretty or some title readble by the user (ex: security/detect-eval-with-expression)
     * @param {stirng} ruleId 
     */
    static toPrettyName(ruleId) {
        if (!ruleId) return "Potential Security Issue";

        const ruleName = ruleId.includes('/') ? ruleId.split('/')[1] : ruleId;

        return ruleName
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
}


module.exports = { SemgrepFormatter, NpmFormatter, EslintFormatter }