
/**
 * Used for define code scaning
 */
class CodeScannerTool {
    static SEMGREP = 'semgrep';
    static NPM_AUDIT = 'npmAudit';
    static ESLINT = 'eslint';

    /**
     * @param {string[]} tools - An array of tool names to check for existence.
     */
    static isValidTool(tool) {
        return [
            CodeScannerTool.SEMGREP,
            CodeScannerTool.NPM_AUDIT,
            CodeScannerTool.ESLINT
        ].includes(tool);
    }
}

export default CodeScannerTool