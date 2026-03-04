

const jwt = require('jsonwebtoken')

//Value Objects
const AuthJwtPayload = require('../utils/AuthJwtPayload')

//Services
const getJwtSecret = require('../config/jwtSecret')
const BlacklistedTokenRepository = require('../repositories/BlacklistedTokenRepository')



/**
 * Middleware that validates whether the authenticated user
 * has the required permission to perform the requested action.
 *
 * This function should be called before accessing protected routes.
 *
 * @param   {import('express').Request} req - The HTTP request object.
 * @param   {import('express').Response} res - The HTTP response object.
 * @param   {import('express').NextFunction} next - The next middleware function.
 * @returns {Promise<void>}
 */
exports.checkUserAuthorization = async(req, res, next)=>{
    try {
        //Data Validation
        const token  = req.header.authorization?.replace('Bearer ', "")
        if(!token)
            return res.json({message: 'Permission non autorisé, veuillez redemarrer votre session de connexion en vous reconnectant'})

        //Tokne Validation
        const isTokenNotBlacklisted = await BlacklistedTokenRepository.isTokenBlacklisted({ token })
        
        if(isTokenNotBlacklisted)
        {
            return res.json({
                    message: 'Permission non autorisé, veuillez redemarrer votre session de connexion en vous reconnectant'
            }).status(401)
        }
        
        //Access token decoding & validation
        let decoded;
        try{
            decoded = jwt.verify(token, getJwtSecret())
        }
        catch (error) {
            return res.json({
                message: 'Token invalide'
            }).status(401)
        }

        //Token decoding & get to next step
        /*** @var user  AuthJwtPayload */
        req.user = new AuthJwtPayload({ sub: decoded.sub, issue_at: decoded.issue_at });
        return next()
    }
    catch (error)
    {
        console.log("Something went wrong")
        return res.json({
            message: 'Une erreur inattendue est survenue lors de la vérification de l\'accès'
        }).status(500)
    }
}