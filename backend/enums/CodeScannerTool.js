
class CodeScannerTool {
    static SEMGREP = 'semgrep';
    static NPM_AUDIT = 'npmAudit';
    static ESLINT = 'eslint';

    /**
     * @param {string[]} tools - An array of tool names to check for existence.
     */
    isValidTool(tool) {
        return [
            CodeScannerTool.SEMGREP,
            CodeScannerTool.NPM_AUDIT,
            CodeScannerTool.ESLINT
        ].includes(tool);
    }
}