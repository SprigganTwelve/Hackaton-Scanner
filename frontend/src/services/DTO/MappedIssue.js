
/**
 * Define data retreive from owaps
 */
class MappedIssue
{
    constructor({
        file_path,
        start_index= null,   // can be null
        end_index = null,    // can be nul
        message,            // descrition de l'erreur
        severity,           // severity : LOW, HIGH, MEDIUM, CREITICAL ...
        code,               // code corrompu
        check_id,           // ruleId       ex : javascript.lang.security.audit.sql-injection
                            //                   python.lang.security.aws-hardcoded-key
        fingerprint
    })
    {
        this.check_id = check_id,
        this.file_path = file_path;     // shemin du fichier d'erreur dans le repo
        this.start_index = start_index; // ligne de l'erreur concerné (début de ligne)
        this.end_index = end_index;     // fin de ligne
        this.severity = severity;
        this.message = message;
        this.code = code,
        this.fingerprint = fingerprint
    }
}

export default MappedIssue