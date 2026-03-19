
const fs = require('fs'); 
const path = require('path');


/**
 * Utility class for performing operations on file paths and directories.
 * Provides helper methods to manipulate, query, and manage directories or files.
 */
class DirectoryHelper
{
    /**
     * Attempts to locate a file given its path.
     * If the file exists at the provided path, the same path is returned.
     * Otherwise, the function searches recursively in subdirectories within
     * the repository where the file is expected.
     * 
     * @param {Object} param             -  The parameters for the search.
     * @param {string} param.filePath    - The original file path to check.
     * @param {number} param.deep        - Maximum depth to traverse in subdirectories.
     * @param {number} param.occurence   - Determines which occurrence to return        
     *                                       (first match or a specific indexed one).
     * @param {?()=>void} param.handleMissingFile   - Optionnal - It define   the operation that must be done when nothing is found
     * @returns {{
     * 
     *    safeFilePath: ?string,  
     *      A verified file path that exists. 
     *          It can be the original file path or a matching file found in a subdirectory. 
     *          Returns null if no file is found.
     * 
     *    filePath: string       - The file path passed in parameter
     * }} - The resolved file path if found.
     */
    static locateFile({ filePath, deep = 1, occurence = 1, handleMissingFile }) {
        if (fs.existsSync(filePath)) {
            return { safeFilePath: filePath };
        }
        
        const fileName = path.basename(filePath);
        const rootDir = path.dirname(filePath);

        const result = this.search({ currentDir: rootDir, deep, occurence: occurence, fileName });
        if(handleMissingFile && !result){
            handleMissingFile()
        }

        return { safeFilePath: result, filePath };
    }


    /**
     * Recursively searches for a file with a specific name starting from a given directory.
     * The search can go up to a specified depth and can return a specific occurrence
     * if multiple matches are found.
     * 
     * @param {Object} param0
     * @param {string} param0.fileName      - The name of the file to search for.
     * @param {string} param0.currentDir    - The directory from which to start the search.
     * @param {number} [param0.deepth=1]    - Maximum depth to traverse in subdirectories.
     * @param {number} [param0.occurence=1]    - Specifies which occurrence to return (first match by default).
     * @param {number} [param0.currentDepth=1] 
     *      - Optional. Specifies how deep the search should go into subdirectories (used for recursive search).
     * 
     * @returns {{ filePath: string|null }}      - The resolved file path if found, otherwise null.
     */
    static search({fileName, currentDir, currentDepth=1, deep=1, occurence=1 }){
        if (currentDepth > deep) 
            return null;
        let foundCount = 0;

        try {
            const items = fs.readdirSync(currentDir);

            for (const item of items) {
                const fullPath = path.join(currentDir, item);
                
                // Verify if it it is a directory
                if (fs.statSync(fullPath).isDirectory()) {
                    const checkPath = path.join(fullPath, fileName);
                    
                    if (fs.existsSync(checkPath)) {
                        foundCount++;
                        if (foundCount === occurence) {
                            return checkPath;
                        }
                    }

                    // We go down if nothing is found
                    const subResult = this.search({
                        fileName,
                        currentDir: fullPath,
                        currentDepth: currentDepth + 1,
                        deep,
                        occurence
                    });

                    if (subResult) 
                        return subResult;
                }
            }
        }
        catch (e) {
            // Insatnce: Reading error
            return null;
        }
        return null;
    }

    /**
     * Writes content to a specified file, creating it only if it does not already exist.
     * Ensures that the operation does not overwrite an existing file.
     * 
     * @param {Object} param
     * @param {string} param.filePath  - The path of the file to create.
     * @param {string} param.content   - The content to write into the file.
     * @returns {?string}              - Returns the file path if everythin gwent smootly - null otherwise
     */
    static safeWriteFile({ filePath, content }) {
        try {
            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, content, { encoding: 'utf8' });
            }
            return filePath;
        }
        catch (e) {
            console.error("Erreur d'écriture :", e.message);
            return null;
        }
    }

}

module.exports = DirectoryHelper