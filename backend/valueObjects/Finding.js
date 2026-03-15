const OWASPVulnerabilityError = require('../enums/OWASPVulnerabilityError')
const CodeSeverity = require('../enums/CodeSeverity')

class Finding {
    /**
     * Represents a security finding detected during the scan of a file.
     *
     * @param {Object} params - Parameters used to create a Finding instance.
     * @param {string} params.file_path - Relative path of the scanned file.
     * @param {string} params.severity - Original severity level of the finding (e.g., "INFO", "WARNING", "ERROR").
     * @param {string} params.code - Code snippet where the finding was detected.
     * @param {string[]} params.owaspVulnerabilityCategories - OWASP vulnerability categories associated with the finding (e.g., "A01_Broken_Access_Control").
     */
    constructor({ 
        file_path,
        severity,
        code,
        tool_id,
        rule_id,
        fingerprint,
        analysis_record_id,
        owaspVulnerabilityCategories= [],
    })
    {
        this.file_path = file_path;
        this.severity = Finding.mapSeverity(
            severity,
            owaspVulnerabilityCategories
        );
        this.code = code;
        this.tool_id = tool_id;
        this.rule_id = rule_id;
        this.analysis_record_id = analysis_record_id
        this.fingerprint = fingerprint
        this.owaspVulnerabilityCategories = owaspVulnerabilityCategories
    }

    /**
     * This function helps to map the severity of a finding 
     * based on its category and the original severity
     * provided by the code scanner.
     * It supports owaps category or number grade/status
     * @param  { string| number} severity - The original severity level of the finding (e.g., "INFO", "WARNING", "ERROR").
     * @param  { ?string[] } owaspVulnerabilityCategories - indicates the owasp error , a string compoused of 3 characters representing the owaps vulnerability 
     *                                                     It can also be an array of prefix (ex: AO1..., A02 ...)
     * @returns {string } 
     */
    static mapSeverity(severity, owaspVulnerabilityCategories= []){
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
                const isCritical = owaspVulnerabilityCategories?.some(cat => 
                    ['A01','A07'].some(prefix => cat.startsWith(prefix))
                );
                if(isCritical)
                    return CodeSeverity.CRITICAL;
                return CodeSeverity.HIGH;
            default: 
                return CodeSeverity.LOW;
        }
    }
}

module.exports = Finding