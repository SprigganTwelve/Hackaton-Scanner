
class ScanResult{
    constructor({
        semgrepResults,
        securityScore =null ,
        owasp = [],  // categories sort by owaps top ten
        eslint,
        npmAudit,
        message = null
    })
    {
        this.securityScore = securityScore;
        this.semgrepResults = semgrepResults;
        this.owasp = owasp;
        this.eslint = eslint;
        this.npmAudit = npmAudit;
        this.message = message
    }
}

module.exports = ScanResult