

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
            return res.json({sucess: false,message: "S'il vous plaît, verifiez les chanps & données de la requête"})
        
        //Password Validation
        const { id: userId, password: hashedPassword } = await AuthRepository.getCredentials({ email: email.trim() })
        const isPasswordOkay = await PasswordHasher.compare(password, hashedPassword)

        if(!isPasswordOkay)
            return res.json({sucess: false, message: "mot de passe invalide"}).status(401)

        //Clear previous blacklisted token
        await BlacklistedTokenRepository.deleteMany({ userId })

        //JWT-Security validation
        const playload = AuthJwtPayload({sub: userId})

        const token = jwt.sign(
            playload, 
            getJwtSecret(),
            { 
                expiresIn: 3600 //1h
            }
        );
        return res.json({
            token,
            success: true,
            message: 'Everuthing went smootly'
        }).status(200)
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.json({success: false, message: "Une erreur est survenue, Veuillez reéssayer"}).status(400)
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
            git_access_token
        } = req.body;

        if(!email || !password)
            return res.json({
                success: false,
                message: "Les champs email et password sont requis"}).status(400)

        if(git_url.trim() && !git_url.startsWith('https://github.com/'))
        {
            return res.json({
                success: false,
                message: 'S\'il vous plaît, veuillez saisir une url github valide'
            }).status(400)
        }

        const user = await AuthRepository.save({
            name, 
            email,
            password: PasswordHasher.hash(password),
            git_url,
            git_access_token: git_access_token || null
        })
        return res.json({
            user,
            success: true,
            message: "Opération exécuté avec succès"
        }).status(200)
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.json({
            success: false,
            message: "Une erreur est survenue, Veuillez reéssayer"
        }).status(400)
    }
}


exports.logout = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Token manquant ou mal formé"
            });
        }

        const token = authHeader.replace("Bearer ", "");

        let expiresAt;

        try {
            // Vérifie signature MAIS ignore expiration
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET,
                { ignoreExpiration: true }
            );

            expiresAt = decoded?.exp
                ? new Date(decoded.exp * 1000)
                : new Date();

        } catch (error) {
            return res.status(400).json({
                sucess: false,
                message: "Token invalide"
            });
        }

        await BlacklistedTokenRepository.save({
            token,
            expired_at: expiresAt
        });

        return res.status(200).json({
            success: true,
            message: "Déconnexion effectuée avec succès"
        });

    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({
            sucess:false,
            message: "Une erreur inattendue est survenue"
        });
    }
};