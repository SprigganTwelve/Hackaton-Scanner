const OWASPVulnerabilityError = require('../enums/OWASPVulnerabilityError')
const CodeSeverity = require('../enums/CodeSeverity')

class Finding {
    /**
     * Represents a security finding detected in a scanned file.
     * @param {Object} params - The parameters for creating a Finding instance.
     * @param {string} params.file_path - The relative path of the file that was scanned.
     * @param {string} params.severity - The original severity level of the finding (e.g., "INFO", "WARNING", "ERROR").
     * @param {string} params.code - The code snippet where the finding was detected.
     * @param {string} params.owaspVulnerabilityError - The OWASP vulnerability category associated with this finding (e.g., "A01_Broken_Access_Control").
     * */
    constructor({ 
        file_path,
        severity,
        code,
        tool_id,
        rule_id,
        fingerprint,
        analysis_record_id,
        owaspVulnerabilityError,
    })
    {
        this.pattern_type = pattern_type;
        this.file_path = file_path;
        this.severity = Finding.mapSeverity(
            severity,
            owaspVulnerabilityError
        );
        this.code = code;
        this.tool_id = tool_id;
        this.rule_id = rule_id;
        this.analysis_record_id = analysis_record_id
        this.fingerprint = fingerprint
        this.owaspVulnerabilityError = owaspVulnerabilityError
    }

    /**
     * This function helps to map the severity of a finding 
     * based on its category and the original severity
     * provided by the code scanner.
     * It supports owaps category or number grade/status
     * @param  { string| number} severity - The original severity level of the finding (e.g., "INFO", "WARNING", "ERROR").
     * @param  { string? } owaspVulnerabilityError - indicates the owasp error , a string compoused of 3 characters representing the owaps vulnerability (ex: AO1, A02 ...)
     * @returns {string } 
     */
    static mapSeverity(severity, owaspVulnerabilityErrorKey){
        if (!isNaN(severity)) {
            // 2 -> HIGH, 1 -> MEDIUM, 0 -> LOW
            return severity === 2
                ? CodeSeverity.HIGH
                : severity === 1
                ? CodeSeverity.MEDIUM
                : CodeSeverity.LOW;
        }

        switch(severity.toUpperCase()){
            case 'INFO':
                return CodeSeverity.LOW;
            case 'LOW':
                return CodeSeverity.LOW;

            case 'WARNING':
                return CodeSeverity.MEDIUM;
            case 'MODERATE':
                return CodeSeverity.MEDIUM;
                
            case 'HIGH':
                return CodeSeverity.HIGH;            
            case 'CRITICAL':
                return CodeSeverity.CRITICAL;
                
            case 'ERROR':
                if(
                    owaspVulnerabilityErrorKey && 
                    (
                        owaspVulnerabilityErrorKey === OWASPVulnerabilityError.A01_Broken_Access_Control.substring(0, 3) || 
                        owaspVulnerabilityErrorKey === OWASPVulnerabilityError.A07_Auth_Failures.substring(0, 3)
                    )
                )
                    return CodeSeverity.CRITICAL;
                return CodeSeverity.HIGH;
            default: 
                return CodeSeverity.LOW;
        }
    }
}

module.exports = Finding