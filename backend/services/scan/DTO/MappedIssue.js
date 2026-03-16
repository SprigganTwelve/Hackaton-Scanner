
/**
 * Define data retreive from owaps
 */
class MappedIssue
{
    /**
     * @typedef MappedIssueProperty
     * @property  {string} MappedIssueProperty.code
     * @property  {string} MappedIssueProperty.file_path
     * @property  {?string} MappedIssueProperty.message
     * @property  {string} MappedIssueProperty.severity
     * @property  {string} MappedIssueProperty.fingerprint
     * @property  {?number} MappedIssueProperty.start_index
     * @property  {?number} MappedIssueProperty.end_index
     * @property  {?string} MappedIssueProperty.errorName - A group name for the erroe
     */

    /**
     * 
     * @param {MappedIssueProperty} param0 
     */
    constructor({
        file_path,
        start_index,
        end_index, 
        message, //description
        severity,
        code,
        check_id,
        fingerprint,
        errorName = null,
    })
    {
        this.errorName = errorName;
        this.check_id = check_id;
        this.file_path = file_path;
        this.start_index = start_index;
        this.end_index = end_index;
        this.severity = severity;
        this.message = message;
        this.code = code
        this.fingerprint = fingerprint
    }
}

module.exports = MappedIssue