
const CodeCorrector = require('../services/CodeCorrector');
const UserRepository = require('../repositories/UserRepository');

const FindingRepository = require('../repositories/FindingRepository');
const CorrectionRepository = require('../repositories/CorrectionRepository');

exports.previewCorrection = async (req, res) => {
    try {

        const { findingId } = req.params;

        const finding = await FindingRepository.getFindingById(findingId);

        if (!finding) {
            return res.status(404).json({ 
                success: false, 
                message: "Finding introuvable" 
            });
        }

        const suggestedFix = CodeCorrector.generateCorrection(
            finding.ruleType, 
            finding.code
        );

        return res.status(200).json({ 
            success: true, 
            originalCode: finding.code, 
            suggestedFix 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ 
            success: false, 
            message: "Erreur lors de la génération de la correction" 
        });
    }
};



exports.applyCorrection = async (req, res) => {
    try {

        const { findingId } = req.params;

        const finding = await UserRepository.getFindingById(findingId);

        if (!finding) {
            return res.status(404).json({
                success: false,
                message: "Finding introuvable"
            });
        }

        const correctedCode = CodeCorrector.generateCorrection(
            finding.ruleType,
            finding.code
        );

        CodeCorrector.applyCorrection(finding.filePath, finding.code, correctedCode);

        await CorrectionRepository.markAsCorrected(findingId);

        return res.status(200).json({
            success: true,
            message: "Correction appliquée avec succès"
        });

    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Erreur lors de l'application de la correction"
        });
    }
};

exports.rejectCorrection = async (req, res) => {
    try {

        const { findingId } = req.params;

        await CorrectionRepository.markAsRejected(findingId);

        return res.status(200).json({
            success: true,
            message: "Correction rejetée"
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Erreur lors du rejet de la correction"
        });
    }
};