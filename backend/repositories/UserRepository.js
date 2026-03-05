
const pool = require('../config/database/mysql.client');
const pool = require('../config/database/mysql.client');


const UserProfile = require('./DTO/User.profile');
const UserProject = require('./DTO/User.project');
const AnalysisFinding = require('./DTO/AnalysisFinding');
const AnalysisReport = require('./DTO/AnalysisReport');

const CryptoSecurityService = require('../services/CryptoSecurityService')
/**
 * Repository for user-related database operations, such as saving scan results and retrieving user access tokens.
 */
class UserRepository
{

    /**
     * @param userId - the unique identifier of an user
     * @returns { Promise<string> }
     */
    static async getUserAccessToken(userdId){
        const [rows] = await pool.query(
            'SELECT git_access_token FROM account WHERE id =?',
            [userdId]
        );

        return CryptoSecurityService.decode(rows[0].git_access_token)
    }

    /**
     * Retreive user basics & public info from bdd
     * @returns {Promise<{id: string, name: string, email: string, git_url: string}>}
     */
    static async getUserById(userId){
        const [rows] = await pool.query(
            'SELECT id, name, email, git_url FROM account id= ?',
            [userId]
        )
        const result =rows[0]
        return { id: result.id, name:result.name, email: result.email, git_url: result.git_url }
    }

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



    /**
     * Return user profile view
     * @param {string} userId 
     * @returns {Promise<UserProfile>}
     */
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


 
    /**
     * Fetch all projects belonging to a user
     * @param {string} userId - The user's account ID
     * @returns {Promise<UserProject[]>} - List of projects
     */
    static async getUserProjects(userId) {
        // Query the database for all projects of this user, ordered by creation date descending
        const [rows] = await pool.query(
            `SELECT id, name, created_at, url, is_uploaded
            FROM project
            WHERE account_id = ?
            ORDER BY created_at DESC`,
            [userId]
        );

        // Map DB rows to UserProject instances
        return rows.map(project => new UserProject({
            projectId: project.id,              // INT -> number
            name: project.name,                 // VARCHAR -> string
            createdAt: project.created_at,      // DATETIME -> Date
            url: project.url,                   // VARCHAR -> string
            isUploaded: !!project.is_uploaded   // TINYINT(1) -> boolean
        }));
    }

    static async getProjectAnalysis(userId, projectId){
        const [rows] = await pool.query(
            `SELECT 
                ar.id AS analysis_id,
                ar.project_id,
                ar.status,
                ar.started_at,
                ar.score,
                GROUP_CONCAT(t.name) AS tools
            FROM analysis_record ar
            JOIN project p ON ar.project_id = p.id
            LEFT JOIN analysis_tools at ON at.analysis_record_id = ar.id
            LEFT JOIN tools t ON t.id = at.tool_id
            WHERE ar.project_id = ?
            AND p.account_id = ?
            GROUP BY ar.id
            ORDER BY ar.started_at DESC
            `,
            [projectId, userId]
        );
        return UserRepository.mapAnalysisWithTools(rows);
    }


    /**
     * Map analysis rows (1 row per analysis thanks to GROUP_CONCAT)
     * @param {Array} rows
     * @returns {Array<{
     *   analysisRecordId: number,
     *   projectId: number,
     *   status: string,
     *   score: string | null,
     *   startedAt: Date,
     *   tools: string[]
     * }>}
     */
    static mapAnalysisWithTools(rows) {
        return rows.map(row => ({
            analysisRecordId: row.analysis_id,
            projectId: row.project_id,
            status: row.status,
            score: row.score ?? null,
            startedAt: row.started_at,
            tools: row.tools
                ? row.tools.split(',').map(t => t.trim())
                : []
        }));
    }


    /**
     * Récupère une analyse par son ID
     * @param {string|number} analysisId - L'ID de l'analyse à récupérer
     * @returns {Promise<{ id: number, status: 'PENDING'|'RUNNING'|'COMPLETED'|'FAILED', startedAt: Date, score: 'A'|'B'|'C'|'D'|null, projectId: number } | null>}
     */
    static async getAnalysisById(analysisId) {
        const [rows] = await pool.query(
            `SELECT 
                id, 
                status, 
                started_at, 
                score,
                project_id
            FROM analysis_record
            WHERE id = ?`,
            [analysisId]
        );

        if (rows.length === 0) return null;

        const row = rows[0];

        return {
            id: row.id,
            status: row.status,
            startedAt: row.started_at,
            score: row.score ?? null,
            projectId: row.project_id
        };
    }




    /**
     * Retrieve all findings associated with a given analysis
     * @param {number} analysisId - The ID of the analysis record
     * @returns {Promise<AnalysisFinding[]>} - List of findings with related data
     */
    static async getAnalysisFindings(analysisId) {
        const [rows] = await pool.query(
            `SELECT 
                f.id,
                f.file_path,
                f.severity,
                f.code,
                f.tool_id,
                f.rule_id,
                f.analysis_record_id,
                f.fingerprint,
                o.name AS owaspCategory,
                s.corrective_measure AS solution
            FROM finding f
            JOIN rule r ON f.rule_id = r.id
            JOIN owasp_category o ON r.owasp_category_id = o.id
            LEFT JOIN solution s ON f.id = s.finding_id
            WHERE f.analysis_record_id = ?`,
            [analysisId]
        );

        // Map DB rows to AnalysisFinding instances
        return rows.map(finding => new AnalysisFinding({
            findingId: finding.id,
            filePath: finding.file_path,
            severity: finding.severity,
            code: finding.code,
            toolId: finding.tool_id,
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

    
    /**
     * Récupère les rapports d'une analyse pour un utilisateur donné
     * @param {string} userId - L'identifiant de l'utilisateur
     * @param {number} analysisId - L'identifiant de l'analyse
     * @returns {Promise<Array<{id: number, format: string, created_at: Date, original_name: string, analysis_id: number}>>}
     */
    static async getAnalysisReports(userId, analysisId) {
        const sql = `
            SELECT r.id, r.format, r.created_at, r.original_name, r.analysis_id
            FROM report r
            INNER JOIN analysis_record ar ON r.analysis_id = ar.id
            INNER JOIN project p ON ar.project_id = p.id
            WHERE ar.id = ? AND p.account_id = ?
        `;

        // pool.query renvoie un array [rows, fields]
        const [rows] = await pool.query(sql, [analysisId, userId]);

        // retourne directement les lignes
        return rows;
    }
    
}
module.exports = UserRepository