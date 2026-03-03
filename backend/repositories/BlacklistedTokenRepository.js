
const { prisma } = require('../config/database/prisma.config')
const RessourceNotFound = require('../core/errors/NotFoundRessource')

class BlacklistedTokenRepository
{
    /**
     * Saves an active token in the database to handle logout 
     * before its natural expiration.
     * This allows maintaining a "blacklist" of invalidated tokens.
     *
     * @param {Object} param0 the first param
     * @param {string} param0.token - The still-valid JWT to store
     * @param {Date}   param0.revoked_at - The time when the token considered expired
     * @returns {Promise<void>}
     */
    static async save({token, revoked_at})
    {
        await prisma.blacklistedToken.create({ 
            data:{
                token,
                revoked_at: revoked_at
            }
        })
    }

    /**
     * Checks whether a given token is blacklisted.
     * This helps determine if a token is no longer valid 
     * due to a prior logout or security invalidation.
     *
     * @param {Object} param0
     * @param {string} param0.token - The JWT to check
     * @returns {Promise<boolean>} - Returns true if the token is blacklisted, false otherwise
     */
    static async isTokenBlacklisted({token})
    {
        const tokenExist = await prisma.blacklistedToken.findUnique({
            where: { token: token }
        })
        return !!tokenExist
    }

    /**
     * Cleans up all expired blacklisted tokens related to a specific user.
     * This helps maintain the blacklist table by removing tokens that have already expired.
     *
     * @param {Object} param0
     * @param {string|number} param0.userId - The ID of the user whose expired blacklisted tokens should be deleted
     * @returns {Promise<void>}
     */
    static async deleteMany({ userId })
    {
        await prisma.blacklistedToken.deleteMany({ 
            where: {
                user_id: userId,
                revoked_at: {
                    lt: new Date()
                }
            }
        })
    }
}

module.exports = BlacklistedTokenRepository