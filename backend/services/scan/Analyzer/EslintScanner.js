const path = require('path');
const { execSync } = require('child_process');


//Config
const { SCANNER_PROJECT_ROOT } = require('../../../config/upload');
const ESLINT_BIN  = path.join(SCANNER_PROJECT_ROOT, 'node_modules', '.bin', 'eslint')

//Utility
const DirectoryHelper = require("../../../utils/DirectoryHelper");



/**
     * Analyse le code source avec ESLint.
     * * Cette méthode orchestre le scan en cherchant une configuration locale (eslint.config.mjs/json) 
     * dans le dossier temporaire. Si aucune n'est trouvée, elle applique la configuration 
     * de sécurité par défaut du scanner (Master Config).
     * * @param {Object} param - Les paramètres d'analyse.
     * @param {string} param.tmpDir - Le chemin absolu du dossier dézippé à analyser.
     * @returns {Promise<Array>} - Retourne un tableau d'objets représentant les vulnérabilités trouvées.
     * @throws {Error} - Lève une erreur uniquement en cas de problème technique majeur (binaire manquant, etc.).
     */
class EslintScanner
{
    /**
     * String responsible of handling eslint 
     * code analysis using a defined eslint config file in the directory to analyze
     * or a defualt config file provided by this application
     * @param {Object} param
     * @param {string} param.tmpDir
     */
    static runAnalysis({tmpDir})
    {
        try {
            console.log("Eslint scanning running...")
            let finalConfigPath;
            let workingDir = tmpDir; 

            // Search for an existing configuration
            let searchResult = DirectoryHelper.locateFile({ filePath: path.join(tmpDir, 'eslint.config.js'), deep: 2 });
            if (!searchResult.safeFilePath) {
                searchResult = DirectoryHelper.locateFile({ filePath: path.join(tmpDir, '.eslintrc.json'), deep: 2 });
            }

            if (!searchResult.safeFilePath) {
                // FALLBACK : Use YOUR project's configuration (Absolute Path)
                finalConfigPath = path.resolve(SCANNER_PROJECT_ROOT, 'eslint.config.mjs');
            }
            else {
                finalConfigPath = searchResult.safeFilePath;
                workingDir = path.dirname(finalConfigPath);
            }

            console.log("ESLint running in:", workingDir);
            const command = `"${ESLINT_BIN}" . -f json -c "${finalConfigPath}"`;

            const eslintOut = execSync(command, { 
                cwd: workingDir, 
                encoding: 'utf8',
                maxBuffer: 5 * 1024 * 1024,
                
            });
            return JSON.parse(eslintOut || '[]');
            
        }
        catch (error) {
            // ESLint code 1 = vulnérabilités trouvées, on récupère le résultat
            if (error?.stdout) {
                try {
                    return JSON.parse(error.stdout);
                }
                catch(e) {
                    return [];
                }
            }
            else {
                console.log("ESLint Tech Error:", error.message);
                return [];
            }
        }
    }
}

module.exports = EslintScanner