const pool = require('../config/database/mysql.client');

const UserProject = require('./DTO/UserProject');
const AnalysisFinding = require('./DTO/AnalysisFinding');
const AnalysisReport = require('./DTO/AnalysisReport');

const CryptoSecurityService = require('../services/CryptoSecurityService');

/**
 * Repository for user-related database operations.
 */
class UserRepository {

    /**
     * Retrieve decoded git access token of a user
     * @param {string} userId
     * @returns {Promise<string>}
     */
    static async getUserAccessToken(userId) {
        const [rows] = await pool.query(
            'SELECT git_access_token FROM account WHERE id = ?',
            [userId]
        );

        if (!rows.length)
        {
            console.log('Access Token undifined or null in bdd')
            return null;
        }

        return CryptoSecurityService.decode(rows[0].git_access_token);
    }



    /**
     * Retrieve basic user info
     * @param {string} userId
     * @returns {Promise<{id: string, name: string, email: string, git_url: string} | null>}
     */
    static async getUserById(userId) {
        const [rows] = await pool.query(
            'SELECT id, name, email, git_url FROM account WHERE id = ?',
            [userId]
        );

        if (!rows.length) return null;

        const user = rows[0];

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            git_url: user.git_url
        };
    }



    /**
     * Not implemented yet (kept intentionally)
     */
    saveScanResult(userId, { score, file_path, pattern_type, rule_id }) {
        throw Error('[saveScanResult] Not implemented Yet');
    }



    /**
     * Return user profile DTO
     * @param {string} userId
     * @returns {Promise<UserProfile | null>}
     */
    static async getUserProfile(userId) {
        const user = await this.getUserById(userId);
        if (!user) return null;

        return new UserProfile({
            userId: user.id,
            name: user.name,
            email: user.email,
            git_url: user.git_url
        });
    }





    /**
     * Fetch all projects belonging to a user with their analysis records
     * @param {string} userId
     * @returns {Promise<UserProject[]>}
     */
    static async getUserProjects(userId) {
        // Project fetching projets
        const [projects] = await pool.query(
            `SELECT id, name, original_name, created_at, url, is_uploaded
                FROM project
                WHERE account_id = ?
                ORDER BY created_at DESC
            `,
            [userId]
        );

        if (!projects || projects.length === 0) return [];

        // Analysis fetching
        const projectIds = projects.map(p => p.id);
        let analyses = [];
        if (projectIds.length > 0) {
            const [rows] = await pool.query(
                `SELECT id AS analysisId, project_id AS projectId, status, started_at AS startedAt, score
                FROM analysis_record
                WHERE project_id IN (?)`,
                [projectIds]
            );
            analyses = rows;
        }

        // project - analysis : Mapping
        return projects.map(project => {
            const projectAnalyses = analyses
                .filter(a => a.projectId === project.id)
                .map(a => ({
                    id: a.analysisId,
                    status: a.status,
                    startedAt: a.startedAt,
                    score: a.score
                }));

            return new UserProject({
                    projectId: project.id,
                    name: project.name,
                    originalName: project?.original_name ?? null,
                    createdAt: project.created_at,
                    url: project.url,
                    isUploaded: !!project.is_uploaded,
                    analysisRecords: projectAnalyses
                });
        });
    }



    /**
     * Retrieve analyses for a project (with tools)
     */
    static async getProjectAnalysis(userId, projectId) {
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
             ORDER BY ar.started_at DESC`,
            [projectId, userId]
        );

        return this.mapAnalysisWithTools(rows);
    }

    /**
     * Map analysis rows to clean JS objects
     */
    static mapAnalysisWithTools(rows) {
        return rows.map(row => ({
            analysisRecordId: row.analysis_id,
            projectId: row.project_id,
            status: row.status,
            score: row.score ?? null,
            startedAt: row.started_at,
            tools: row.tools
                ? row.tools.split(',').map(t => t?.trim())
                : []
        }));
    }

    /**
     * Retrieve single analysis by ID
     */
    static async getAnalysisById(analysisId) {
        const [rows] = await pool.query(
            `SELECT id, status, started_at, score, project_id
             FROM analysis_record
             WHERE id = ?`,
            [analysisId]
        );

        if (!rows.length) return null;

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
     * Retrieve all findings of an analysis
     * @return { Promise<AnalysisFinding[] > }
     */
    static async getAnalysisFindings(analysisId) {
        const [rows] = await pool.query(
            `SELECT 
                f.id,
                f.file_path,
                f.is_corrected,
                f.severity,
                f.code,
                f.tool_id,
                f.rule_id,
                f.analysis_record_id,
                f.fingerprint,
                -- On garde le nom cohérent avec le JS
                GROUP_CONCAT(DISTINCT o.name SEPARATOR ', ') AS owaspCategory,
                s.corrective_measure AS solution
            FROM finding f
            JOIN rule r ON f.rule_id = r.id
            LEFT JOIN rule_categories_owasp rco ON r.id = rco.rule_id
            LEFT JOIN owasp_category o ON rco.category_id = o.id
            LEFT JOIN solution s ON f.id = s.finding_id
            WHERE f.analysis_record_id = ?
            GROUP BY f.id, s.id;`,
            [analysisId]
        );

        return rows.map(finding => {
            // Transformation of "A01, A05" into (array) ["A01", "A05"]
            const categories = finding.owaspCategory 
                ? finding.owaspCategory.split(', ') 
                : [];

            return new AnalysisFinding({
                findingId: finding.id,
                filePath: finding.file_path,
                isCorrected: !!finding.is_corrected, // Conversion tinyint -> boolean
                severity: finding.severity,
                code: finding.code,
                toolId: finding.tool_id,
                ruleId: finding.rule_id,
                analysisRecordId: finding.analysis_record_id,
                fingerprint: finding.fingerprint,
                owaspCategory: categories, // Maintenant c'est un tableau propre
                solution: finding.solution
            });
        });
    }

    /**
     * Retrieve reports of an analysis
     */
    static async getAnalysisReport(analysisId) {
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
     * Retrieve reports for a user + analysis (ownership check)
     */
    static async getAnalysisReports(userId, analysisId) {
        const [rows] = await pool.query(
            `SELECT r.id, r.format, r.created_at, r.original_name, r.analysis_id
             FROM report r
             INNER JOIN analysis_record ar ON r.analysis_id = ar.id
             INNER JOIN project p ON ar.project_id = p.id
             WHERE ar.id = ? AND p.account_id = ?`,
            [analysisId, userId]
        );

        return rows;
    }
}

module.exports = UserRepository;