const PDFDocument = require('pdfkit');
const fs = require('fs');//fs est utilisé pour gérer les fichiers
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UserRepository = require('../repositories/UserRepository');
const ReportRepository = require('../repositories/ReportRepository');


/**
 * 
 * @param {*} userId 
 * @param {*} analysis 
 * @param {*} findings 
 * @returns {Promise<{ filePath: string, fileName: string }}>}
 */
 async function generateReport(userId, analysis, findings) {
    if(!findings || findings.length === 0) {
        throw new Error('Aucun résultat trouvé pour ce rapport.');
    }

    // Dossier pour stocker les rapports de cet utilisateur
    const reportsDir = path.join(__dirname, '../uploads', `${userId}`, 'rapports');
    
    //Créer le dossier s'il n'existe pas
    if (!fs.existsSync(reportsDir)) 
        fs.mkdirSync(reportsDir, { recursive: true });


    // Nom de fichier unique
    const fileName = `report_${uuidv4()}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    //création du document PDF
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);


    // Contenu du rapport
    doc.fontSize(22).text('SecureScan - Rapport', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Analyse ID: ${analysis.id}`);
    doc.text(`Statut: ${analysis.status}`);
    doc.text(`Date : ${new Date(analysis.started_at).toLocaleString()}`);
    doc.moveDown();
    doc.fontSize(16).text('Résultats de l\'analyse');
    doc.moveDown();
// Ajout des résultats de l'analyse
    findings.forEach((finding, index) => {
        doc.fontSize(12).text(`${index + 1}. Fichier : ${f.filePath}`);
        doc.text(`Sévérité : ${f.severity}`);
        doc.text(`Catégorie OWASP : ${f.owaspCategory}`);
        doc.text(`Code détecté : ${f.code}`);
        doc.moveDown();
    });

    doc.end();

    //Attendre que le téléchargement du PDF soit terminé avant de continuer
    await new Promise(resolve => stream.on('finish', resolve));

    // Enregistrer ou mettre à jour le rapport dans la base de données
    const existingReport = await ReportRepository.getReportByAnalysisId(analysis.id);
    if (existingReport) {
        await ReportRepository.updateReport({
            format: 'PDF',
            original_name: fileName,
            analysis_id: analysis.id
        });
    } else {
        await ReportRepository.createReport({
            format: 'PDF',
            original_name: fileName,
            analysis_id: analysis.id
        });
    }

    return {filePath, fileName};
}

module.exports = { generateReport };