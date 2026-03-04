const path = require('path');
const { BASIC_UPLOADING_FOLDER_PATH } = require('../config/upload');

//Locla Services
const CodeScanner = require('../services/CodeScanner');
const ScanResult = require('../services/DTO/ScanResult')
const ZipProcessor = require('../services/ZipProcessor')


//Repositories
const DataBaseTransactionManager = require('../repositories/DataBaseTransactionManager');
const UserRepository = require('../repositories/UserRepository')
const ProjectRepository = require('../repositories/ProjectRepository');

//Enums
const CodeScannerTool = require('../enums/CodeScannerTool');

//Helpers/Utility
const AuthJwtPayload = require('../utils/AuthJwtPayload');
const GitRepoHelper = require('../utils/GitRepoHelper')
const RecordScanHelper = require('../utils/RecorScanHelper')

const AuthPlayload = require('../utils/AuthJwtPayload');



/**
 * Help an user add a project to his account with git_url
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.addProjectWithURL = async (req, res) => {
    //Data validation
    /**
     * Extracts project information from the request body.
     *
     * @param {Object} req.body
     * @param {string} req.body.name - The name of the project (e.g., Git repository name) or a custom name provided by the user.
     * @param {string} req.body.repoUrl - The URL of the repository to scan.
     * @param {Array<string>} req.body.scanTools - An array specifying which scanning tools the user wants to use (e.g., ['semgrep', 'eslint', 'npmAudit']).
     * @param {string} [req.body.token] - Optional access token for private repositories.
     */
    const { name, repoUrl, scanTools, token } = req.body;

    /** @var {AuthPlayload} authPayload */
    const authPayload = req.user;
    if( !name || 
        !repoUrl || 
        !Array.isArray(scanTools) || 
        scanTools.length === 0
    ){
        return res.status(400).json({ 
            success: false,
            message: 'Veuillez fournir tous les champs requis : name, repoUrl, scanTools (doit être un tableau non vide)'
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

        const zipFileName = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');                          //the name of the file in a unique format to avoid any conflicts
        const destPath = path.join(BASIC_UPLOADING_FOLDER_PATH, `${authPayload.sub}/projects/${zipFileName}`);  //final folder destination where the file will be unzipped

        //Save the project in the database & decompress the zip file in the same time, 
        // if any error occurs we will rollback the transaction and delete any decompressed files if needed
        DataBaseTransactionManager.executeTransaction(async({commit, rollback})=>{
            try{
                await ProjectRepository.addProject(authPayload.sub, {
                    name: zipFileName,
                    url: destPath,
                    is_uploaded: true
                })
                await ZipProcessor.saveZipFolder(file.buffer, destPath)
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
    //Data validation
    const {projectId, repoUrl, scanTools } = req.body;

    if (!repoUrl) {
        return res.status(400).json({ success: false, message: 'repoUrl manquant' });
    }

    if(!Array.isArray(scanTools) || scanTools.length > 0){
        return res.status(400).json({ 
            success: false,
            message: 'scanTools ne doit pas être vide'
        });
    }

    // -- Check that only valid scanning tools are provided
    if(!scanTools.every(tool => CodeScannerTool.isValidTool(tool))){
        return res.status(400).json({ 
            success: false,
            message: 'scanTools contient des outils de scan invalides. Les outils valides sont : semgrep, eslint, npmAudit'
        });
    }

        /** @var {AuthJwtPayload} user */
    const user = req.user;

    // -- Project existence validation
    try{
        await ProjectRepository.assessProjectOwnership(user.sub, projectId)
    }
    catch(error){
        console.log('Error while validating project ownership : ', error)
        return res.status(403).json({
            success: false,
            message: 'Vous n\'avez pas la permission d\'accéder à ce projet'
        })
    };

    try {

        //Processed with the code scanner service
        /** @type {ScanResult} */
        const scanResult = await CodeScanner.performScan({repoUrl, scanTools});
        
        //Save database analisys resutlt
        DataBaseTransactionManager.executeTransaction(async(commit,rollback )=>{
            try{
                RecordScanHelper.execute(scanResult)
                commit()
            }
            catch(error)
            {
                console.log("Something went wrong!!, error: ", error?.message)
                rollback()
            }
        })
        //Retunn the scan results to the client
        return res.status(200).json({ success: true, results: results });
    }
    catch (error) {
        console.error('Erreur lors du scan:', error);
        return res.status(500).json({ success: false, message: error?.message });
    }
};





exports.scanZip = async (req, res) => {

    //Data validation
    const { projectId, scanTools } = req.body;

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Fichier ZIP manquant' });
    }

    if(!Array.isArray(scanTools) || scanTools.length > 0){
        return res.status(400).json({ 
            success: false,
            message: 'scannTools ne doit pas être vide'
        });
    }

    /** @var {AuthJwtPayload} user */
    const user = req.user;

    //Project existence validation
    try{
        await ProjectRepository.assessProjectOwnership(user.sub, projectId)
    }
    catch(error){
        console.log('Error while validating project ownership : ', error)
        return res.status(403).json({
            success: false,
            message: 'Vous n\'avez pas la permission d\'accéder à ce projet'
        })
    };

    // Saving
    try {
        const project = await ProjectRepository.getProjectById(projectId)
        
        //Check if the project is uploaded with a zip or added with a git url
        if(!project?.is_uploaded)
            return res.status(400).json({
                success: false,
                message: 'Ce projet n\'a pas été ajouté avec un fichier ZIP'
            })

        //Processed with the code scanner service
        /** @type {ScanResult} */
        const scanResult = await CodeScanner.performZipScan(
            project.name, user.sub, scanTools
        );
        
        //Save database analisys resutlt
        DataBaseTransactionManager.executeTransaction(async(commit,rollback )=>{
            try{
                RecordScanHelper.execute(scanResult)
                commit()
            }
            catch(error)
            {
                console.log("Something went wrong!!, error: ", error?.message)
                rollback()
            }
        })

        return res.status(200).json({ success: true, results });
    }
    catch (error) {
        console.error('Erreur lors du scan du ZIP:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
