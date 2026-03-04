
//Locla Services
const AuthPlayload = require('../utils/AuthJwtPayload')
const CodeScanner = require('../services/CodeScanner');
const UserRepository = require('../repositories/UserRepository')
const GitRepoHelper = require('../utils/GitRepoHelper')

/**
 * Help an user add a project to his account with git_url
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
exports.addProjectWithURL = async (req, res) => {
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

    const doesRepoExixt = await GitRepoHelper.repoExists(repoUrl,  )

}



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
