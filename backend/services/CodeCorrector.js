
const fs = require('fs');
const {exec} = require('child_process');


class CodeCorrector {

    generateCorrection(ruleType, vulnerableCode) {

        switch (ruleType) {

            case "SQL_INJECTION"://Exemple de correction pour une injection SQL
                return vulnerableCode.replace(
                    /".*?"/,
                    `"SELECT * FROM users WHERE email = ?"`
                ) + `
/* SecureScan Fix */
connection.execute(query, [email]);
`;

            case "XSS"://Exemple de correction pour une vulnérabilité XSS
                return `
/* SecureScan Fix */
echo htmlspecialchars(${vulnerableCode}, ENT_QUOTES, 'UTF-8');
`;

            case "VULNERABLE_DEPENDENCY"://Exemple de correction pour une dépendance vulnérable
                return `
/* SecureScan Suggestion */
npm install package-name@latest
`;

            case "EXPOSED_SECRET"://Exemple de correction pour une clé API exposée
                return `
/* SecureScan Fix */
const apiKey = process.env.API_KEY;
`;

            case "PLAINTEXT_PASSWORD"://Exemple de correction pour un mot de passe en clair
                return `
/* SecureScan Fix */
const bcrypt = require('bcrypt');
const hashedPassword = await bcrypt.hash(password, 10);
`;

            default:
                return `
/* SecureScan : aucune correction automatique disponible */
`;
        }
    }

    applyCorrection(filePath, originalCode, correctedCode) {//Applique la correction au fichier source

        const content = fs.readFileSync(filePath, 'utf8');//Lit le contenu du fichier

        if (!content.includes(originalCode)) {
            throw new Error("Code vulnérable introuvable dans le fichier");//Vérifie que le code vulnérable est présent dans le fichier
        }

        const updatedContent = content.replace(originalCode, correctedCode);//Remplace le code vulnérable par le code corrigé

        fs.writeFileSync(filePath, updatedContent, 'utf8');//Écrit le contenu mis à jour dans le fichier

        return true;//Retourne true si la correction a été appliquée avec succès
    }
}

module.exports = new CodeCorrector();