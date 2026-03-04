
const pool = require('../config/database');

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
}

module.exports = ProjectRepository