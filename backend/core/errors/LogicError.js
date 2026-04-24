
/**
 * Define a custom error class for logic mismatch errors. 
 * This error is thrown when there is a mismatch in the expected logic of the application, 
 * such as when a function is called with invalid arguments or when a certain condition is not met.
 */
class LogicMismatch extends Error {
    constructor(message, code){
        this.message = message;
        this.code = code;
    }
}