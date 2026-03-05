
const pool = require('../config/database/mysql.client');

const DomainError = require('../core/errors/DomainError');
        
const UserProfile = require('./DTO/UserProject')


/**
 * A repository class responsible for handling database operations related to projects.
 */
class ProjectRepository {

    /**
     * Add a new project for a specific user.
     * Prevents duplicate repositories for the same user.
     * A user cannot have two projects with the same name or the same URL.
     *
     * @param {string} userId - Unique identifier of the user
     * @param {Object} projectData - Project data
     * @param {string} projectData.name - Project name
     * @param {string} projectData.url - Repository URL (git or zip)
     * @param {boolean} [projectData.is_uploaded=false] - Indicates if the project was uploaded as a zip
     * 
     * @returns {Promise<{ userProject: UserProfile, alreadyExists?: boolean }>}
     */
    static async addProject(userId, { name, url, is_uploaded = false }) {

        // Check if project already exists (same name OR same url)
        const [existingRows] = await pool.query(
            `SELECT id, name, created_at, url, is_uploaded
            FROM project
            WHERE account_id = ?
            AND (name = ? OR url = ?)
            LIMIT 1`,
            [userId, name, url]
        );

        let projectRow;
        let alreadyExists = false;

        if (existingRows.length > 0) {
            projectRow = existingRows[0];
            alreadyExists = true;
        } 
        else {

            // Insert new project
            const [result] = await pool.query(
                `INSERT INTO project (name, url, account_id, is_uploaded)
                VALUES (?, ?, ?, ?)`,
                [name, url, userId, is_uploaded]
            );

            // Read inserted row (to stay consistent with DB values like created_at)
            const [rows] = await pool.query(
                `SELECT id, name, created_at, url, is_uploaded
                FROM project
                WHERE id = ?`,
                [result.insertId]
            );

            projectRow = rows[0];
        }

        const userProject = new UserProfile({
            projectId: projectRow.id,
            name: projectRow.name,
            createdAt: projectRow.created_at,
            url: projectRow.url,
            isUploaded: !!projectRow.is_uploaded,
            analysisRecords: []
        });

        return alreadyExists
            ? { userProject, alreadyExists }
            : { userProject };
    }



    /**
     * Return user projects by his id
     * @param {string} userId - the unique identifier of the user
     * @returns 
     */
    static async getProjectsByUserId(userId)
    {
        const [rows] = await pool.query(
            'SELECT id, name, url, is_uploaded FROM project WHERE account_id = ?',
            [userId]
        )
        return rows;
    }


    /**
     * return a project by its id
     * @param {string} projectId - the unique identifier of the project 
     * @returns {Promise<{id: string, name:string}>}
     */
    static async getProjectById(projectId)
    {
        const [rows] = await pool.query(
            'SELECT id, name, url, is_uploaded FROM project WHERE id = ?',
            [projectId]
        )
        return rows[0];
    }

    /**
     * This function cehcks if a project belongs to a specific user, 
     * it can be used for access control and authorization purposes.
     * @param {string} userId - the unique identifier of the user
     * @param {string} projectId - the unique identifier of the project
     * @throws {DomainError} - thrown if the project does not belogn to the user
     * @returns {Promise<void>} - it returns nothing wehn everything is okay
     */
    static async assessProjectOwnership(userId, projectId)
    {
        const [rows] = await pool.query(
            'SELECT id FROM project WHERE id = ? AND account_id = ?',
            [projectId, userId]
        )

        if(rows.length === 0)
            throw new DomainError('Project not found or access denied');
    }

}

module.exports = ProjectRepository