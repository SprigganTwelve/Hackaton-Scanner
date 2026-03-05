
/**
 * Define data retreive from owaps
 */
class MappedIssue
{
    constructor({
        file_path,
        start_index,
        end_index, 
        message,
        severity,
        code,
        check_id,
        fingerprint
    })
    {
        this.check_id = check_id,
        this.file_path = file_path;
        this.start_index = start_index;
        this.end_index = end_index;
        this.severity = severity;
        this.message = message;
        this.code = code,
        this.fingerprint = fingerprint
    }
}

module.exports = MappedIssue