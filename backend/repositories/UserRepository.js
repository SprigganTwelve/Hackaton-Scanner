
const pool = require('../config/database');
const UserProfile = require('./DTO/User.profile');
const UserProject = require('./DTO/User.project');
const AnalysisFinding = require('./DTO/AnalysisFinding');
const AnalysisReport = require('./DTO/AnalysisReport');

/**
 * Repository for user-related database operations, such as saving scan results and retrieving user access tokens.
 */
class UserRepository
{
    /**
     * Records a scan for a user.
     * @param {string} userId - The ID of the user.
     * @param {object} scanData - The data related to the scan.
     * @param {string} scanData.rule_id - The ID of the rule that was triggered.
     * @param {int} scanData.score - the score associated with the scan.
     * @param {string} scanData.file_path -the relative path of the file that was scanned.
     * @param {string} scanData.pattern_type - the type of pattern that was matched (e.g., "regex", "keyword").
     */
    saveScanResult(userId, {score, file_path, pattern_type, rule_id} )
    {
        throw Error('[saveScanResult] Not implemented Yet')
    }

    /**
     * This function retreive the git access token of an user from teh database
     * @param {string} userId - the unique identifier of the user
     * @returns 
     */
    async getUserAccessToken(userId)
    {
        const [rows] = await pool.query(
            'SELECT hash_git_access_token FROM account WHERE id = ?',
            [userId]
        );
        return rows[0]?.hash_git_access_token;
    }

   static  async getUserProfile(userId){
        const [rows] = await pool.query(
            'SELECT id, name, email, git_url FROM account WHERE id = ?',
            [userId]
        );
        const user = rows[0]
        return new UserProfile({
            userId: user.id,
            name: user.name,
            email: user.email,
            git_url: user.git_url
        })
   }

   static async getUserProjects(userId){
        const [rows] = await pool.query(
            'SELECT id, name, created_at, url, is_uploaded  FROM project WHERE account_id = ? ORDER BY created_at DESC',
            [userId]
        );
        
        return rows.map(project => new UserProject({
            projectId: project.id,
            name: project.name,
            createdAt: project.created_at,
            url: project.url,
            isUploaded: project.is_uploaded
        }));
    }

    static async getProjectAnalysis(userId, projectId){
        const [rows] = await pool.query(
        `SELECT 
            ar.id AS analysis_id,
            ar.project_id,
            ar.status,
            ar.created_at,
            t.id AS tool_id,
            t.name AS tool_name
        FROM analysis_record ar
        JOIN project p ON ar.project_id = p.id
        LEFT JOIN analysis_tools at ON at.analysis_record_id = ar.id
        LEFT JOIN tools t ON t.id = at.tool_id
        WHERE ar.project_id = ?
        AND p.account_id = ?
        ORDER BY ar.created_at DESC`,
        [projectId, userId]
    );
        return this.mapAnalysisWithTools(rows);
    }

//Fonction de regroupement des analyses avec leurs outils associés
    static mapAnalysisWithTools(rows) {
        const analysisMap = {};

        rows.forEach(row => {
            if (!analysisMap[row.analysis_id]) {
                analysisMap[row.analysis_id] = {
                    analysisRecordId: row.analysis_id,
                    projectId: row.project_id,
                    status: row.status,
                    createdAt: row.created_at,
                    tools: []
                };
            }

            if (row.tool_id) {
                analysisMap[row.analysis_id].tools.push({
                    toolId: row.tool_id,
                    toolName: row.tool_name
                });
            }
        });

        return Object.values(analysisMap);
    }


    static async getAnalysisFindings(analysisId){
        const [rows] = await pool.query(
            `SELECT 
                f.id, f.file_path, f.severity, f.code, f.tool_id, f.rule_id, f.analysis_record_id, f.fingerprint,
                o.name AS owaspCategory,
                s.corrective_measure AS solution
            FROM finding f
            JOIN rule r ON f.rule_id = r.id
            JOIN owasp_category o ON r.owasp_category_id = o.id
            LEFT JOIN solution s ON f.id = s.finding_id
            WHERE f.analysis_record_id = ?`,
            [analysisId]
        );



        return rows.map(finding => new AnalysisFinding({
            findingId: finding.id,
            scorePenalty: finding?.score_penalty ?? null ,
            filePath: finding.file_path,
            severity: finding.severity,
            code: finding.code,
            toolsId: finding.tool_id,
            ruleId: finding.rule_id,
            analysisRecordId: finding.analysis_record_id,
            fingerprint: finding.fingerprint,
            owaspCategory: finding.owaspCategory,
            solution: finding.solution
        }));
        }
    

        static  async getAnalysisReport(analysisId){
        const [rows] = await pool.query(
            `SELECT id, format, created_at, original_name, analysis_id
             FROM report
             WHERE analysis_id = ?`,
            [analysisId]
        );

        return rows.map(report => new AnalysisReport({
            reportId: report.id,
            format: report.format,
            createdAt: report.created_at,
            originalName: report.original_name,
            analysisId: report.analysis_id
        }));
    }
        
        
    
}
module.exports = UserRepository