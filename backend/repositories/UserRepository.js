const fs = require('fs');
const unzipper = require('unzipper');
const os = require('os');
const path = require('path');
const { exec } = require('child_process');

class UserRepository {

    static performScan(repoUrl) {
        return new Promise((resolve, reject) => {

            const tmpDir = path.join(os.tmpdir(), Date.now().toString());

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

    static performZipScan(zipPath) {
        return new Promise((resolve, reject) => {
            const tmpDir = path.join(os.tmpdir(), Date.now().toString());

            fs.createReadStream(zipPath)
                .pipe(unzipper.Extract({ path: tmpDir }))
                .on('close', () => {
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
                })
                .on('error', reject);
        });
    }
}

module.exports = UserRepository;