
const { prisma } = require('../config/database/prisma.config')
const RessourceNotFound = require('../core/errors/NotFoundRessource')

class AuthRepository
{

    /**
     * Retrieves the credentials of a user from the database.
     * 
     * This method is used during the authentication and authorization
     * process to fetch the necessary user credentials.
     *
     * @param {string} email - an unique identifier of the user.
     * @throws {RessourceNotFound} - an error that is thrown whenever a ressource in the bdd in not found
     * @returns {Promise<{}>} A promise that resolves with the user's credentials.
     */
    static async getCredentials({ email })
    {
        const user = await prisma.account.findUnique({
            where: { email },
            select: { 
                id:true, 
                password: true
            }
        })
        if(!user)
            throw new RessourceNotFound(`<${email}> User not found`)
        return { id: user.id, email, password: user.password }
    }

    /**
     * This function help us save a nex ressource in the bdd
     * @param {string} email 
     * @param {string} email 
     */
    static async save({ email, password, git_url, access_token, name })
    {
        const data = {
            email,
            password,
            name,
            git_url,
            access_token,
            name
        }

        await prisma.account.create({ data })
        return data;
    }
}

module.exports = AuthRepository