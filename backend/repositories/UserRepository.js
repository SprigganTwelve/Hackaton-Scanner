const { exec } = require('child_process');

class UserRepository {

    static performScan(repoUrl) {
        return new Promise((resolve, reject) => {

            const tmpDir = `/tmp/${Date.now()}`;

            exec(`git clone ${repoUrl} ${tmpDir}`, (err) => {
                if (err) return reject(new Error(`Erreur lors du clonage du dépôt: ${err.message}`));

                exec(`semgrep --config=p/owasp-top10 ${tmpDir} --json`, (err, semgrepOut) => {
                    if (err) return reject(new Error(`Erreur lors de l'exécution de Semgrep: ${err.message}`));

                    const semgrepResults = JSON.parse(semgrepOut);

                    exec(`eslint --extensions .js ${tmpDir} -f json`, (err, eslintOut) => {
                        if (err) eslintOut = '[]'; 

                        const eslintResults = JSON.parse(eslintOut || '[]');

                        exec(`cd ${tmpDir} && npm audit --json`, (err, auditOut) => {
                            if (err) auditOut = '{}';

                            const auditResults = JSON.parse(auditOut || '{}');

                            resolve({
                                semgrep: semgrepResults,
                                eslint: eslintResults,
                                npmAudit: auditResults
                            });
                        });
                    });
                });

            });
        });

    }
}

module.exports = UserRepository;