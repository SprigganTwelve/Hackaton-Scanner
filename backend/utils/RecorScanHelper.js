
const ScanResult = require("../services/DTO/ScanResult");

//entities
const Finding = require('../valueObjects/Finding');

class RecordScanHelper
{
    /**
     * This one help integrate all the data needed for bdd
     * @param {ScanResult} scanResult - the result after scan
     */
    static execute(scanResult)
    {
        //Record Semgrep result Into Bdd
        if(scanResult.semgrepResults)
        {
            scanResult.semgrepResults?.results.forEach((result) => {
                const {
                    check_id: pattern_type,
                    path: file_path,
                    start: { line: start_index } = {},
                    end: { line: end_index } = {},
                    extra: { severity = 'LOW', lines: code = [] , metadata } = {},
                } = result;

                const owaspVulnerabilityError = metadata?.owasp || [];

                const finding = new Finding({
                    pattern_type,
                    file_path,
                    severity,
                    code: code.join('\n'),
                    start_index,
                    end_index,
                    owaspVulnerabilityError
                });

            });
        }

        //Record ESLint result into bdd

        //Record Npm Audit record into bdd
    }
}

module.exports = RecordScanHelper