
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
     *This method us used to sauvegard a zip file in a specific folder for later use,
     *Here we just save the zip file without decompressiong it, 
     *this can be useful if we want to keep the original zip file for later use or if we want to process it later without the need to decompress it now.
     * @parma {Buffer} buffer - the buffer of the zip file
     * @param {string} destPath - the destination path where the zip file will be saved
     */
    static async saveZipFolder(buffer, destPath) {

        if (!Buffer.isBuffer(buffer)) {
            throw new Error('Invalid parameter: buffer must be a Buffer');
        }

        if (!destPath || typeof destPath !== 'string') {
            throw new Error('Invalid parameter: destPath is required');
        }

        if (!destPath || !destPath.endsWith('.zip')) {
            throw new Error('Invalid parameter: destPath must end with .zip');
        }

        //Retreive the file name from destPath
        const safeFileName = path.basename(destPath);

        //Create folder if needed
        await fs.promises.mkdir(destPath, { recursive: true });

        const fullPath = path.join(destPath, safeFileName);

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

