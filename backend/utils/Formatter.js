
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

module.exports = SemgrepFormatter