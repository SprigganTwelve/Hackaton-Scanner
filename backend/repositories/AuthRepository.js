<<<<<<< HEAD
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database/mysql.client');

//Services
const CryptoSecurityService = require('../services/CryptoSecurityService')

// excexption classes
const RessourceNotFound = require('../core/errors/NotFoundRessource');

//repository
=======
const pool = require('../config/database/mysql.client');
const RessourceNotFound = require('../core/errors/NotFoundRessource');

>>>>>>> 4a5a0b5 (migration prisma -> mysql2 & blaclist token)
class AuthRepository {

    /**
     * Retrieves the credentials of a user from the database.
     * This method is used during authentication to fetch necessary credentials.
     *
     * @param {string} email - unique identifier of the user
     * @throws {RessourceNotFound} if user does not exist
     * @returns {Promise<{id: number, email: string, password: string}>}
     */
    static async getCredentials({ email }) {
        const [rows] = await pool.query(
            'SELECT id, email, password FROM account WHERE email = ?',
            [email]
        );

        const user = rows[0];
        if (!user) {
            throw new RessourceNotFound(`<${email}> User not found`);
        }

        return { id: user.id, email: user.email, password: user.password };
    }

    /**
     * Saves a new user in the database
     *
     * @param {string} email
     * @param {string} password
     * @param {string} name
     * @param {string} git_url
<<<<<<< HEAD
     * @param {string} git_access_token
     * @returns {Promise<{id: string, email: string, name:string,  }>} The saved user data
     */
    static async save({ 
        email, password, git_url, 
        git_access_token, name 
    }) {
        const [rows] = await pool.query(
            `INSERT INTO account (id, email, password, name, git_url, git_access_token)
             VALUES (?,?, ?, ?, ?, ?)`,
            [ uuidv4(), email, password, name, git_url, CryptoSecurityService.encode(git_access_token) ]
        );

        const user = rows[0]

        // result.insertId contient l'ID généré par MySQL
        return { 
            id: user.insertId,
            email, name, git_url,
        };
=======
     * @param {string} access_token
     * @returns {Promise<Object>} The saved user data
     */
    static async save({ email, password, git_url, access_token, name }) {
        const [result] = await pool.query(
            `INSERT INTO account (email, password, name, git_url, access_token)
             VALUES (?, ?, ?, ?, ?)`,
            [email, password, name, git_url, access_token]
        );

        // result.insertId contient l'ID généré par MySQL
        return { id: result.insertId, email, password, name, git_url, access_token };
>>>>>>> 4a5a0b5 (migration prisma -> mysql2 & blaclist token)
    }
}

module.exports = AuthRepository;