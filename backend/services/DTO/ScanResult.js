const OwaspCategoryMap = require('./OwaspCategoryMap')
const MappedIssue = require('./MappedIssue')
class ScanResult{
    /**
     * @typedef {Object} scanData
     * @property {Object} [semgrepResults]       - the api parse data
     * @property {Object} [eslintResults]        - the api parse data
     * @property {Object} [npmAuditResults]        - the api parse data
     * @property {OwaspCategoryMap} [owasp]      - mapped issue & filtered data (domain data)
     * @property {MappedIssue[]} [eslint]        - mapped issue & filtered data 
     * @property {MappedIssue[]} [npmAudit]      - mapped issue & filtered data 
     * @property {number?} [securityScorePoint]  - score point between 0 - 100 calculated
     */

    /**
     * @param {scanData} param0
     */
    constructor({
        semgrepResults,
        eslintResults,
        npmAuditResults,
        securityScorePoint =null ,
        owasp = [],  // categories sort by owaps top ten
        eslint,
        npmAudit,
        message = null
    })
    {
        this.securityScorePoint = securityScorePoint;
        this.semgrepResults = semgrepResults;
        this.eslintResults = eslintResults;
        this.npmAuditResults = npmAuditResults;
        this.owasp = owasp;
        this.eslint = eslint;
        this.npmAudit = npmAudit;
        this.message = message
    }
}

module.exports = ScanResult