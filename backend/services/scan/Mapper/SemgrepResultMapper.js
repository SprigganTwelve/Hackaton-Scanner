

//DTO & Value Object
const MappedIssue = require("../DTO/MappedIssue");
const OwaspCategoryMap = require("../DTO/OwaspCategoryMap");
const Finding = require("../../../valueObjects/Finding");


//Services
const CryptoSecurityService = require("../../CryptoSecurityService");


//Utility
const {SemgrepFormatter} = require("../../../utils/Formatter");


/**
 * Maps Semgrep analysis results into a strict, immutable,
 * and system-friendly format.
 */
class SemgrepResultMapper
{
    /**
     * Transforms Semgrep results into a strict, standardized object.
     * Filters Semgrep analysis results based on their classification
     * within the OWASP Top 10 categories.
     *
     * 
     * Otherwise, it returns an OwaspCategoryMap containing the
     * categorized results.
     * @param {Object} options
     * @param {Object | null} options.result - The raw Semgrep result. Nothing  is done if this param is falsy
     * @returns {OwaspCategoryMap | null} A normalized and immutable representation of the analysis. Returns null (falsy value) if the input is invalid or an error occurs.
     */
    static map({ result }) {
        if (!result?.results || !Array.isArray(result.results) || result.results.length === 0) {
            return null;
        }

        const categories = new OwaspCategoryMap();

        result.results.forEach(issue => {
            const rawTags = issue?.extra?.metadata?.owasp ?? [];
            const tags = Array.isArray(rawTags) ? rawTags : [rawTags];

            const check_id = issue.check_id ?? "unknown-check";
            
            const mappedIssue = new MappedIssue({
                check_id,
                file_path: issue.path ?? null,
                errorName: SemgrepFormatter.toPrettyName(check_id),
                start_index: issue.start?.line ?? null,
                end_index: issue.end?.line ?? null,
                message: issue.extra?.message ?? null,
                severity: Finding.mapSeverity(issue.extra?.severity), 
                code: Array.isArray(issue.extra?.lines)
                    ? issue.extra.lines.join('\n')
                    : issue.extra?.lines ?? null,
                fingerprint: issue.extra?.fingerprint !== "requires login" 
                                ?  issue.extra?.fingerprint
                                : CryptoSecurityService.hash(`SEMGREP|${issue.check_id}|${issue.path}|${issue.start.line}|${issue.extra.message}`)
            });

            let matched = false;

            if (tags.length > 0) {
                Object.keys(categories).forEach(key => {
                    if (key === "others") return;

                    const prefix = key.substring(0, 3); // "A01", "A02", etc.

                    if (tags.some(tag => tag.startsWith(prefix))) {
                        categories[key].push(mappedIssue);
                        matched = true;
                    }
                });
            }

            if (!matched) {
                categories.others.push(mappedIssue);
            }
        });

        return categories;
    }
}

module.exports = SemgrepResultMapper