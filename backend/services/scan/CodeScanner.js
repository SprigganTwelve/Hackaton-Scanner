const os = require('os');
const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const { execSync } = require('child_process');


// Utils
const { BASIC_UPLOADING_FOLDER_PATH } = require('../../config/upload');
const AnalysisOrchestrator = require('./AnalysisOrchestrator');



/**
 * This class is a service that can be used for scaning a code (or repository)
 * 
 * Here you have what is returned by the Semgrep API when scaning with owas top ten as config : https://saeed0x1.medium.com/optimizing-static-application-security-testing-sast-with-semgrep-gemini-cli-b4152e0307c6
 * Here you have what is retuen by Eslint API : https://eslint.org/docs/latest/use/formatters/
 * @returns {[]}
 */
class CodeScanner {
    static performScan({ repoUrl, scanTools }) {
        return new Promise((resolve, reject) => {
            const tmpDir = path.join(os.tmpdir(), Date.now().toString());
            try {


                if(!fs.existsSync(tmpDir))
                {
                    fs.mkdirSync(tmpDir, {recursive: true})
                }


                execSync(`git clone ${repoUrl} ${tmpDir}`, { encoding: 'utf8' });
                const result =  AnalysisOrchestrator.runFullAnalysis({ tmpDir, scanTools }) 
                console.log("Deleting git clone: ", tmpDir)
                console.log("Processing ....")
                fs.rmSync(tmpDir, { recursive: true, force: true })
                console.log("Deleting git done!!")
                
                // console.log("RESULT: ", result)
                resolve(result);
            }
            catch (err) {
                if(fs.existsSync(tmpDir)){
                    console.log("[ERROR HANDLER] Deleting git clone: ", tmpDir)
                    console.log("[ERROR HANDLER] Processing ....")
                    fs.rmSync(tmpDir, { recursive: true, force: true })
                    console.log("[ERROR HANDLER] Deleting git done!!")
                }
                reject(err);
            }
        });
    }


    static performZipScan({ zip_name, userId, scanTools }) {
        return new Promise(async (resolve, reject) => {
            const zipPath = path.join(BASIC_UPLOADING_FOLDER_PATH, userId, 'projects', zip_name);
            const tmpDir = path.join(os.tmpdir(), `scan_${Date.now()}`);

            try {
                if(!fs.existsSync(zipPath)){
                    console.log("The zip file scanned right now, doesn't exist in the storage, path: ", zipPath)
                    return;
                }

                // Create Temp folder
                if (!fs.existsSync(tmpDir)) {
                    fs.mkdirSync(tmpDir, { recursive: true });
                }

                console.log("Unzipping file...");
                
                // Await  fiel unzipping
                await fs.createReadStream(zipPath)
                    .pipe(unzipper.Extract({ path: tmpDir }))
                    .promise();

                console.log("Unzip completed. Zip Scanning Started...");
                const result = AnalysisOrchestrator.runFullAnalysis({tmpDir, scanTools})
                console.log("Unzip File Scanned!!");

                // Nettoyage
                console.log("Cleaning up:", tmpDir);
                fs.rmSync(tmpDir, { recursive: true, force: true });

                resolve(result);

            }
            catch (err) {
                console.error("Critical Scan Error:", err);
                if (fs.existsSync(tmpDir)) {
                    fs.rmSync(tmpDir, { recursive: true, force: true });
                }
                reject(err);
            }
        });
    }

}

module.exports = CodeScanner;