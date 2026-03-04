
const admZip = require('adm-zip')
const fs = require('fs')
const { Buffer } = require('buffer')
/**
 * A service that help us compress or decompress zip files.
 */
class ZipProcessor{

    static async compressFolderToZip(folderPath, zipFilePath) {
        throw new Error('Method not implemented yet');
    }

    /**
     * decompress a zip file to a specific destination folder
     * @param {Buffer} buffer - the buffer of the zip file
     * @param {string} destFolderPath   - the destination folder path where the zip file will be decompressed
     */
    static async decompressZipToFolder(buffer, destFolderPath) {
        if(!Buffer.isBuffer(buffer) && !destFolderPath) {
            throw new Error('Invalid parameters, buffer and destFolderPath are required');
        }

        if(!fs.existsSync(destFolderPath)) {

            fs.mkdirSync(destFolderPath, { recursive: true })
        }
        const zip = new admZip(buffer);
        zip.extractAllTo(destFolderPath, true);
    }
}

module.exports = ZipProcessor

