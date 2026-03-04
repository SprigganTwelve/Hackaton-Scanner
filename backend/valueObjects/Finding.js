const OWASPVulnerabilityError = require('../enums/OWASPVulnerabilityError')
const CodeSeverity = require('../enums/CodeSeverity')

class Finding {
    /**
     * Represents a security finding detected in a scanned file.
     * @param {Object} params - The parameters for creating a Finding instance.
     * @param {number} params.score_penality - The score penalty associated with this finding.
     * @param {string} params.pattern_type - The type of pattern that was matched (e.g., "regex", "keyword").
     * @param {string} params.file_path - The relative path of the file that was scanned.
     * @param {string} params.severity - The original severity level of the finding (e.g., "INFO", "WARNING", "ERROR").
     * @param {string} params.code - The code snippet where the finding was detected.
     * @param {string} params.owaspVulnerabilityError - The OWASP vulnerability category associated with this finding (e.g., "A01_Broken_Access_Control").
     * */
    constructor({ 
        score_penality,
        pattern_type,
        file_path,
        severity,
        code,
        owaspVulnerabilityError
    })
    {
        this.score_penality = score_penality;
        this.pattern_type = pattern_type;
        this.file_path = file_path;
        this.severity = Finding.mapSeverity(severity, owaspVulnerabilityError);
        this.code = code;
    }

    /**
     * This function helps to map the severity of a finding 
     * based on its category and the original severity
     * provided by the code scanner. 
     * @param {string} severity - The original severity level of the finding (e.g., "INFO", "WARNING", "ERROR").
     * @returns {string}
     */
    static mapSeverity(severity, owaspVulnerabilityError){
        switch(severity){
            case 'INFO':
                return CodeSeverity.LOW;
            case 'WARNING':
                return CodeSeverity.MEDIUM;
            case 'ERROR':
                if(owaspVulnerabilityError === OWASPVulnerabilityError.A01_Broken_Access_Control || owaspVulnerabilityError === OWASPVulnerabilityError.A07_Auth_Failures)
                    return CodeSeverity.CRITICAL;
                return CodeSeverity.HIGH;
            default: 
                return CodeSeverity.LOW;
        }
    }
}

module.exports = Finding