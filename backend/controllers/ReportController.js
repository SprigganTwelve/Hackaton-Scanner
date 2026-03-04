
const UserRepository = require('../repositories/UserRepository');
const { generateReport } = require('../services/ReportGenerator');

exports.generateUserReport = async (req, res) => {
    try {
        const userId = req.user.sub;// Récupérer l'ID de l'utilisateur à partir du token d'authentification
        const { analysisId } = req.params;// Récupérer l'ID de l'analyse à partir des paramètres de la requête

        const analysis = await UserRepository.getAnalysisById(userId, analysisId);// Vérifier que l'analyse existe et appartient à l'utilisateur
        if (!analysis) 
            return res.status(404).json({ message: 'Analyse introuvable' });

        const findings = await UserRepository.getAnalysisFindings(userId, analysisId);// Récupérer les résultats de l'analyse
        if (!findings || findings.length === 0) 
            return res.status(404).json({ success: false, message: 'Aucun résultat trouvé pour cette analyse' });

        const filePath = await generateReport(userId, analysis, findings);// Générer le rapport et obtenir le chemin du fichier

        return res.status(200).json({ 
            success: true, 
            message: 'Rapport généré avec succès', filePath 
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
