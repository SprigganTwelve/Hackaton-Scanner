
const pool = require('../config/database/mysql.client');

const DomainError = require('../core/errors/DomainError');

/**
 * A repository class responsible for handling database operations related to projects.
 */
class ProjectRepository {

    /**
     * This function adds a new project to the database for a specific user.
     * @param {string} userId - a uniq identifier of the user
     * @param {Object} projectData - the object containing the data of the project to be added
     * @var {string} projectData.name - the name of the project
     * @var {string} projectData.url - the url of the project (ex: git repository url)
     * @var {boolean} projectData.is_uploaded - indicates if the project was uploaded as a zip file or not
     */
    static async addProject(userId, {name, url, is_uploaded = false})
    {
        const [result] = await pool.query(
            'INSERT INTo project (name, url, account_id, is_uploaded) VALUES (?,?,?,?)',
            [name, url, userId, is_uploaded]
        )

        return { id: result.insertId, name, url, is_uploaded };
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