const jwt = require('jsonwebtoken')

// Value Objects
const AuthJwtPayload = require('../utils/AuthJwtPayload')

// Services
const getJwtSecret = require('../config/jwtSecret')
const BlacklistedTokenRepository = require('../repositories/BlacklistedTokenRepository')

/**
 * Middleware that validates whether the authenticated user
 * has the required permission to perform the requested action.
 *
 * @param   {import('express').Request} req
 * @param   {import('express').Response} res
 * @param   {import('express').NextFunction} next
 * @returns {Promise<void>}
 */
exports.checkUserAuthorization = async (req, res, next) => {
    try {

        // Authorization header parsing
        const authHeader = req.headers.authorization

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: 'Permission non autorisée, veuillez vous reconnecter'
            })
        }

        const token = authHeader.replace("Bearer ", "").trim()

        if (!token) {
            return res.status(401).json({
                message: 'Permission non autorisée, veuillez vous reconnecter'
            })
        }

        // Check blacklist
        const isBlacklisted = await BlacklistedTokenRepository.isTokenBlacklisted({ token })

        if (isBlacklisted) {
            return res.status(401).json({
                message: 'Session expirée, veuillez vous reconnecter'
            })
        }

        // Token validation
        let decoded
        try {
            decoded = jwt.verify(token, getJwtSecret())
        }
        catch (error) {

            if (error.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: 'Token expiré'
                })
            }

            return res.status(401).json({
                message: 'Token invalide'
            })
        }

        // Attach user payload
        /** @type {AuthJwtPayload} */
        req.user = decoded

        return next()
    }
    catch (error) {
        console.error("Authorization middleware error:", error)

        return res.status(500).json({
            message: 'Une erreur inattendue est survenue lors de la vérification de l\'accès'
        })
    }
}