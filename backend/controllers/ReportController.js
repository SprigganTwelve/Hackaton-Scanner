const path = require('path')
const {BASIC_UPLOADING_FOLDER_PATH} = require('../config/upload')

const UserRepository = require('../repositories/UserRepository');
const { generateReport } = require('../services/ReportGenerator');
const ReportRepository  = require('../repositories/ReportRepository') 

const AuthJwtPayload = require('../utils/AuthJwtPayload') //js-doc purpose

exports.generateUserReport = async (req, res) => {
    try {
        /** @type {AuthJwtPayload} */
        const userId = req.user.sub;        // Récupérer l'ID de l'utilisateur à partir du token d'authentification
        const { analysisId } = req.params;  // Récupérer l'ID de l'analyse à partir des paramètres de la requête

        const analysis = await UserRepository.getAnalysisById(userId, analysisId);// Vérifier que l'analyse existe et appartient à l'utilisateur
        if (!analysis) 
            return res.status(404).json({
                sucess: false,
                message: 'Analyse introuvable'
            });

        const findings = await UserRepository.getAnalysisFindings(userId, analysisId);// Récupérer les résultats de l'analyse
        if (!findings || findings.length === 0) 
            return res.status(404).json({ success: false, message: 'Aucun résultat trouvé pour cette analyse' });

        const { filePath, fileName } = await generateReport(userId, analysis, findings);// Générer le rapport et obtenir le chemin du fichier

        return res.status(200).json({ 
            success: true, 
            message: 'Rapport généré avec succès',
            fileName
        });

    } catch (err) {
		console.error(err);
		return res.status(500).json({
			success: false,
			message: 'Erreur lors de la génération du rapport',
			error: err.message
		});
    }
};


exports.downloadPdf = async ({req, res})=> {
    const { analysisId } = req.params;
    try{
        /** @type {AuthJwtPayload} */
        const user = req.user;
        const {original_name: fileName} = await ReportRepository.getReportByAnalysisId(analysisId)
        const reportFilePath = path.join(BASIC_UPLOADING_FOLDER_PATH, user.sub, fileName)

        res.download(reportFilePath, fileName, (err)=>{
            if(err)
            {
                console.log("An Error occur while downloading : ", err)
                return res.status(400).json({ success: false, message: 'Fichier non trouvé'})
            }
        })
    }
    catch(error)
    {
        console.log("Something went wrong : ", error)
        return res.status(400).json({message: "Erreur lors du téléchargement", success: false})
    }
}