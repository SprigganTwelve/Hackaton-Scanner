const { end } = require("../../config/database/mysql.client");

/**
 * Define data retreive from owaps
 */
class MappedIssue
{
    constructor(
        file_path,
        start_index,
        end_index, 
        message,
        severity,
        code,
    )
    {
        this.file_path = file_path;
        this.start_index = start_index;
        this.end_index = end_index;
        this.severity = severity;
        this.message = message;
        this.code = code
    }
}

module.exports = MappedIssue