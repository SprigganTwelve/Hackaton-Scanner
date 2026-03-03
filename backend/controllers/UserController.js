const UserRepository = require('../repositories/UserRepository');

exports.scanRepo = async (req, res) => {

    const { repoUrl } = req.body;
    if (!repoUrl) {
        return res.status(400).json({ success: false, message: 'repoUrl manquant' });
    }

    try {
        const results = await UserRepository.performScan(repoUrl);
        return res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('Erreur lors du scan:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

exports.scanZip = async (req, res) => {

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Fichier ZIP manquant' });
    }

    try {
        const results = await UserRepository.performZipScan(req.file.path);
        return res.status(200).json({ success: true, results });
    } catch (error) {
        console.error('Erreur lors du scan du ZIP:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
