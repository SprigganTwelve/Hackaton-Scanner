const path = require('path');
const { BASIC_UPLOADING_FOLDER_PATH } = require('../config/upload');

//Locla Services
const CodeScanner = require('../services/CodeScanner');
const ZipProcessor = require('../services/ZipProcessor')

//Repositories
const DataBaseTransactionManager = require('../repositories/DataBaseTransactionManager');
const UserRepository = require('../repositories/UserRepository')
const ProjectRepository = require('../repositories/ProjectRepository');

//Enums
const CodeScannerTool = require('../enums/CodeScannerTool');

//Helpers/Utility
const GitRepoHelper = require('../utils/GitRepoHelper')


const AuthPlayload = require('../utils/AuthJwtPayload');

/**
 * Help an user add a project to his account with git_url
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.addProjectWithURL = async (req, res) => {
    //Data validation
    const { name, repoUrl, scannTools, token } = req.body;

    /** @var {AuthPlayload} authPayload */
    const authPayload = req.user;
    if( !name || 
        !repoUrl || 
        !Array.isArray(scannTools) || 
        scannTools.length === 0
    ){
        return res.status(400).json({ 
            success: false,
            message: 'Veuillez fournir tous les champs requis : name, repoUrl, scannTools (doit être un tableau non vide)'
        });
    }

    //Check repository existance
    const doesRepoExixt = await GitRepoHelper.repoExists(repoUrl, authPayload.sub, token)
    if(!doesRepoExixt)
        return res.status(400).json({
            success: false, 
            message: 'Le dépôt GitHub spécifié n\'existe pas ou est inaccessible'
        })
    
    try {
        //Save the project in the database
        await UserRepository.addProject(authPayload.sub, {name, url: repoUrl})
        return res.status(200).json({ ducess: true, message: 'Projet ajouté avec succès'})
    }
    catch (error) {
        //Log the error & return a messg to the client
        console.log('Erreur lors de l\'ajout du projet :', error);
        return res.status(500).json({ success: false, message: 'Erreur lors de l\'ajout du projet' });
    }
}


/**
 * Allow an user to add a project with a zip file
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.addProjectWithZip = async (req, res) => {   
    try{
        //Data validation
        const file = req.file;
        /** @var {AuthPlayload} authPayload */
        const authPayload = req.user;
        if(!file)
        {
            console.log('Missing Zip File')
            return res.status(400).json({ success: false, message: 'Zip File manquant'})
        }

        const zipFileName = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');  //the name of the file in a unique format to avoid any conflicts
        const destPath = path.join(BASIC_UPLOADING_FOLDER_PATH, `${authPayload.sub}/${zipFileName}`); //final folder destination where the file will be unzipped

        //Save the project in the database & decompress the zip file in the same time, 
        // if any error occurs we will rollback the transaction and delete any decompressed files if needed
        DataBaseTransactionManager.executeTransaction(async({commit, rollback})=>{
            try{
                await ProjectRepository.addProject(authPayload.sub, {
                    name: zipFileName,
                    url: destPath,
                    is_uploaded: true
                })
                await ZipProcessor.decompressZipToFolder(file.buffer, destPath)
                await commit();
                return res.status(200).json({ 
                    success: true,
                    message: 'Projet ajouté avec succès'
                })
            }
            catch(error)
            {
                console.log('Error while processing the zip file : ', error)
                await rollback();
                return res.status(500).json({ 
                    success: false,
                    message: 'Une erreur est survenue lors du traitement du fichier ZIP'
                })
            }
        })
    }
    catch (error) {
        console.log('Something went wrong !! ', error)
        return res.status(500).json({ 
            success: false,
            message: 'Une erreur est survenue lors de l\'ajout du projet'
        })
    }
}



/**
 * Allow an user to scan a project with the selected scanning tools
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.scanRepo = async (req, res) => {

    const { repoUrl, scannTools } = req.body;
    if (!repoUrl) {
        return res.status(400).json({ success: false, message: 'repoUrl manquant' });
    }

    if(!Array.isArray(scannTools) || scannTools.length > 0){
        return res.status(400).json({ 
            success: false,
            message: 'scannTools ne doit pas être vide'
        });
    }

    //Check that only valid scanning tools are provided
    if(!scannTools.every(tool => CodeScannerTool.isValidTool(tool))){
        return res.status(400).json({ 
            success: false,
            message: 'scannTools contient des outils de scan invalides. Les outils valides sont : semgrep, eslint, npmAudit'
        });
    }

    try {
        const results = await CodeScanner.performScan(repoUrl, scannTools);
        const semgrepResults = results.semgrepResults || [];
        
        if(Array.isArray(semgrepResults) && semgrepResults.length > 0){
            semgrepResults.forEach(result => {
                const { check_id, path, start, end, extra: { likelihood } } = result;
                UserRepository.saveScanResult({
                    userId: req.user.sub,
                    tool: 'semgrep',
                    checkId: check_id,
                    filePath: path,
                    lineStart: start.line,
                    lineEnd: end.line,
                    status: likelihood || 'unknown',
                });
            })
        }

        return res.status(200).json({ success: true, results: results });
    }
    catch (error) {
        console.error('Erreur lors du scan:', error);
        return res.status(500).json({ success: false, message: error?.message });
    }
};




exports.scanZip = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Fichier ZIP manquant' });
    }

    try {
        const results = await CodeScanner.performZipScan(req.file.path);
        return res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('Erreur lors du scan du ZIP:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
