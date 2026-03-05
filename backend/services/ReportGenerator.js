const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ReportRepository = require('../repositories/ReportRepository');
const UserRepository = require('../repositories/UserRepository');

/**
 * Génère un rapport PDF stylisé pour une analyse donnée.
 */
async function generateReport(userId, analysisId) {

    // ===============================
    // Récupération des données BDD
    // ===============================
    const analysis = await UserRepository.getAnalysisById(analysisId);
    if (!analysis) throw new Error('Analyse introuvable.');

    const findings = await UserRepository.getAnalysisFindings(analysisId);
    if (!findings || findings.length === 0)
        throw new Error('Aucun résultat trouvé pour ce rapport.');

    const user = await UserRepository.getUserProfile(userId);

    // ===============================
    // Statistiques
    // ===============================
    const stats = {
        LOW: 0,
        MEDIUM: 0,
        HIGH: 0,
        CRITICAL: 0
    };

    findings.forEach(f => stats[f.severity]++);

    // ===============================
    // Création dossier
    // ===============================
    const reportsDir = path.join(__dirname, '../uploads', userId, 'rapports');
    if (!fs.existsSync(reportsDir))
        fs.mkdirSync(reportsDir, { recursive: true });

    const fileName = `report_${uuidv4()}_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: 40 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // ===============================
    // HEADER
    // ===============================
    doc.rect(0, 0, doc.page.width, 80).fill('#111827');

    doc.fillColor('#ffffff')
        .fontSize(22)
        .text('SecureScan Report', 40, 30);

    doc.moveDown(3);
    doc.fillColor('#000000');

    // ===============================
    // Infos générales
    // ===============================
    doc.fontSize(12)
        .text(`Utilisateur : ${user.name} (${user.email})`)
        .text(`Analyse ID : ${analysis.id}`)
        .text(`Statut : ${analysis.status}`)
        .text(`Score : ${analysis.score ?? 'N/A'}`)
        .text(`Date : ${new Date(analysis.startedAt).toLocaleString()}`);

    doc.moveDown();

    // ===============================
    // Résumé statistique
    // ===============================
    doc.fontSize(16).text('Résumé des vulnérabilités');
    doc.moveDown(0.5);

    doc.fontSize(12)
        .fillColor('green').text(`LOW : ${stats.LOW}`)
        .fillColor('orange').text(`MEDIUM : ${stats.MEDIUM}`)
        .fillColor('orangered').text(`HIGH : ${stats.HIGH}`)
        .fillColor('red').text(`CRITICAL : ${stats.CRITICAL}`);

    doc.fillColor('black');
    doc.moveDown();

    // ===============================
    // Détail des findings
    // ===============================
    doc.fontSize(16).text('Détails techniques');
    doc.moveDown();

    findings.forEach((finding, index) => {

        if (doc.y > 700) doc.addPage();

        // Couleur selon sévérité
        const severityColor = {
            LOW: 'green',
            MEDIUM: 'orange',
            HIGH: 'orangered',
            CRITICAL: 'red'
        };

        doc.fontSize(13)
            .fillColor(severityColor[finding.severity] || 'black')
            .text(`${index + 1}. ${finding.severity}`, { underline: true });

        doc.fillColor('black')
            .fontSize(11)
            .text(`Fichier : ${finding.filePath}`)
            .text(`Catégorie OWASP : ${finding.owaspCategory}`)
            .moveDown(0.3)
            .text('Code détecté :', { continued: false });

        doc.font('Courier')
            .fontSize(9)
            .text(finding.code, {
                width: 450
            });

        doc.font('Helvetica');

        if (finding.solution) {
            doc.moveDown(0.3);
            doc.fillColor('#1f2937')
                .text(`Solution : ${finding.solution}`);
        }

        doc.moveDown();
    });

    doc.end();

    await new Promise(resolve => stream.on('finish', resolve));

    // ===============================
    // Sauvegarde en base
    // ===============================
    const existing = await ReportRepository.getReportByAnalysisId(analysisId);

    if (existing) {
        await ReportRepository.updateReport({
            format: 'PDF',
            original_name: fileName,
            analysis_id: analysisId
        });
    } else {
        await ReportRepository.createReport({
            format: 'PDF',
            created_at: new Date(),
            original_name: fileName,
            analysis_id: analysisId
        });
    }

    return { filePath, fileName };
}

module.exports = { generateReport };