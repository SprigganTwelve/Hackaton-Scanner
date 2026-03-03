


class AuthRepository
{
    /**
     * Retrieves the credentials of a user from the database.
     * 
     * This method is used during the authentication and authorization
     * process to fetch the necessary user credentials.
     *
     * @param {string} userId - The unique identifier of the user.
     * @returns {Promise<{}>} A promise that resolves with the user's credentials.
     */
    static async getCredentials(userId)
    {

    }

    /**
     * This function help us save a nex ressource in the bdd
     * @param {string} email 
     * @param {string} email 
     */
    static async save({ email, password, git_url, access_token })
    {

    }
}

module.exports = AuthRepository