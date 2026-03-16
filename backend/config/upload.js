
const path = require('path');

//basic configuration for file uploading with multer
const BASIC_UPLOADING_FOLDER_PATH = path.join(__dirname, '..', 'uploads/users'); //Define the path for user folders
const SCANNER_PROJECT_ROOT = path.resolve(__dirname, '../')                      //Define the roor project of the back


module.exports = { BASIC_UPLOADING_FOLDER_PATH, SCANNER_PROJECT_ROOT }