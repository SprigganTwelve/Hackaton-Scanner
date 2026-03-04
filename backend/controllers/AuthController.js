

const jwt = require('jsonwebtoken')

//Local Services
const AuthRepository = require('../repositories/AuthRepository')
const PasswordHasher = require('../services/PasswordHasher')
const BlacklistedTokenRepository = require('../repositories/BlacklistedTokenRepository')

const getJwtSecret = require('../config/jwtSecret')

/**
 * 
 * @param {import('express').Request} req 
 * @param {import('express').Response} res 
 * @returns 
 */
exports.login = async (req, res) => {
    try{
        const { email, password } = req.body;
        
        //Data validation
        if(!email || !password)
            return res.json({message: "S'il vous plaît, verifiez les chanps & données de la requête"})
        
        //Password Validation
        const { id: userId, password: hashedPassword } = await AuthRepository.getCredentials({ email })
        const isPasswordOkay = await PasswordHasher.compare(credentials.password, hashedPassword)

        if(!isPasswordOkay)
            return res.json({message: "mot de passe invalide"}).status(401)

        //Clear previous blacklisted token
        await BlacklistedTokenRepository.deleteMany({ userId })

        //JWT-Security validation
        const playload = AuthJwtPayload({sub: userId, issue_at: Date.now()})

        const token = jwt.sign(
            playload, 
            getJwtSecret(),
            { 
                expiresIn: 3600 //1h
            }
        );
        return res.json({
            token,
            message: 'Everuthing went smootly'
        }).status(200)
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.json({message: "Une erreur est survenue, Veuillez reéssayer"}).status(400)
    }
}



/**
 * Handles user registration.
 *
 * This controller creates a new user account in the system
 * based on the data provided in the request body.
 *
 * @param   {import('express').Request} req - The HTTP request object containing user data.
 * @param   {import('express').Response} res - The HTTP response object used to return the result.
 * @returns {Promise<void>} Resolves when the response has been sent.
 */
exports.register = async (req, res)=>{
    try{
        //Data Validation
        const { 
            name,
            email,
            password,
            git_url,
            hash_git_access_token
        } = req.body;

        if(!email || !password)
            return res.json({message: "Le champ email ou password est manquant"}).status(400)

        if(git_url.trim() && !git_url.startWith('https://github.com/'))
        {
            return res.json({
                message: 'S\'il vous plaît, veuillez saisir une url git valide'
            })
        }

        const user = await AuthRepository.save({
            name, 
            email,
            password,
            git_url,
            hash_git_access_token: hash_git_access_token || null
        })
        return res.json({ 
            message: "Opération exécuté avec succès"
        }).status(200)
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.json({message: "Une erreur est survenue, Veuillez reéssayer"}).status(400)
    }
}


exports.logout = async (req, res)=>{
    try{
        //Data Validation
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Token manquant ou mal formé" });
        }

        const token = authHeader.replace("Bearer ", "");

        //Check for token expiry 
        try{
            const decoded = jwt.verify(token)
            const expiresAt = decoded?.exp 
                                ? new Date(decoded.exp * 1000)
                                : new Date();
            BlacklistedTokenRepository.save({ token, revoked_at:  expiresAt })
        }
        catch(error)
        {
            console.log("Invalid token, error: ", error?.message)
        }

        return res.json({ message: "Opération exécuté avec succès" }).status(200)
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.json({message: "Une erreur inattendue est survenue, Veuillez reéssayer"}).status(400)
    }
}