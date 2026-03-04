
/**
 * Represents a security rule that can be violated in the codebase, 
 * such as "AWS Hardcoded Password".
 */
class Rule
{
    constructor(check_id, description, name) {
        this.check_id = check_id;
        this.description = description;
        this.name = name;
    }
}