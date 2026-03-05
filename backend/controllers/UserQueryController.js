

const UserRepository = require('../repositories/UserRepository');
const AuthPlayload = require('../utils/AuthJwtPayload');


exports.getUserProfile = async (req, res) => {
    try{
        /** @var {AuthPlayload} authPayload */
        const authPayload = req.user
        const userProfile = await UserRepository.getUserProfile(authPayload.sub)
        return res.status(200).json({
            success: true,
            data: userProfile
        })
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.status(500).json({ 
            success: false,
            message: 'Une erreur est survenue lors de la récupération du profil de l\'utilisateur'
        })
    }
}


exports.getUserProjects = async (req, res) => {
    try{
        /** @var {AuthPlayload} authPayload */
        const authPayload = req.user
        const userProjects = await UserRepository.getUserProjects(authPayload.sub)
        return res.status(200).json({
            success: true,
            data: userProjects
        })
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.status(500).json({ 
            success: false,
            message: 'Une erreur est survenue lors de la récupération des projets de l\'utilisateur'
        })
    }
}

exports.getProjectAnalysis = async (req, res) => {
    try{
        /** @var {AuthPlayload} authPayload */
        const authPayload = req.user;
        const { projectId } = req.params;
        const analysis = await UserRepository.getProjectAnalysis(authPayload.sub, projectId);

        return res.status(200).json({
            success: true,
            data: analysis
        });
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération de l\'analyse des projets de l\'utilisateur'
        });
    }
}


exports.getAnalysisFindings = async (req, res) => {
    try{
        /** @var {AuthPlayload} authPayload */
        const authPayload = req.user;
        const { analysisId } = req.params;
        const findings = await UserRepository.getAnalysisFindings(authPayload.sub, analysisId);

        return res.status(200).json({
            success: true,
            data: findings
        });
    }
    catch(error)
    {   
        console.log("Something went wrong !! ", error)
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération des résultats de l\'analyse de l\'utilisateur'
        });
    }
}

exports.getAnalysisReports = async (req, res) => {
    try{
        /** @var {AuthPlayload} authPayload */
        const authPayload = req.user;
        const { analysisId } = req.params;

        const reports = await UserRepository.getAnalysisReports(authPayload.sub, analysisId);

        return res.status(200).json({
            success: true,
            data: reports
        });
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.status(500).json({
            success: false,
            message: 'Une erreur est survenue lors de la récupération des rapports de l\'analyse de l\'utilisateur'
        });
    }
}


exports.getKPIStats = async(req, res)=>{

}


