
const fs = require('fs')
const path = require('path');
const unzipper = require('unzipper');
const { PassThrough } = require('stream');

const { Buffer } = require('buffer')
/**
 * A service that help us compress or decompress zip files.
 */
class ZipProcessor{

    static async compressFolderToZip(folderPath, zipFilePath) {
        throw new Error('Method not implemented yet');
    }


    /**
     * This method is used to sauvegard a zip file in a specific folder for later use.
     * Here we just save the zip file without decompressing it.
     * This can be useful if we want to keep the original zip file for later use
     * or process it later without decompressing it now.
     *
     * @param {Buffer} buffer - The buffer of the zip file
     * @param {string} destPath - The destination path where the zip file will be saved
     * @returns {Promise<string>} The full path of the saved file
     */
    static async saveZipFolder(buffer, destPath) {

        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Invalid parameter: buffer must be a Buffer');
        }

        if (!destPath || typeof destPath !== 'string') {
            throw new Error('Invalid parameter: destPath is required');
        }

        if (!destPath.endsWith('.zip')) {
            throw new Error('Invalid parameter: destPath must end with .zip');
        }

        // Retrieve the file name from destPath
        const safeFileName = path.basename(destPath);

        // Retrieve the destination directory
        const destDir = path.dirname(destPath);

        // Create folder if needed
        if (!fs.existsSync(destDir)) {
            await fs.promises.mkdir(destDir, { recursive: true });
        }

        const fullPath = path.join(destDir, safeFileName);

        await fs.promises.writeFile(fullPath, buffer);

        return fullPath; // utile pour la suite
    }


    
    /**
     * decompress a zip file to a specific destination folder
     * @param {Buffer} buffer - the buffer of the zip file
     * @param {string} destFolderPath   - the destination folder path where the zip file will be decompressed
     */

    static async decompressAndSaveZipToFolder(buffer, destFolderPath) {

        if (!Buffer.isBuffer(buffer)) {
            throw new Error('buffer must be a Buffer');
        }

        if (!destFolderPath || typeof destFolderPath !== 'string') {
            throw new Error('destFolderPath is required');
        }

        // Create flder if necessary
        await fs.promises.mkdir(destFolderPath, { recursive: true });

        // Create stream from buffer
        const bufferStream = new PassThrough();
        bufferStream.end(buffer);

        // Extraction en streaming
        await bufferStream
            .pipe(unzipper.Extract({ path: destFolderPath }))
            .promise();

        return destFolderPath;
    }
}

module.exports = ZipProcessor

