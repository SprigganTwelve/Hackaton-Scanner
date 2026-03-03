

const AuthRepository = require('../repositories/AuthRepository')

exports.login = async () => {
    try{

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
        const { email, password, git_url, access_token } = req.body;
        // Control...
        // await AuthRepository.save({ email, password, git_url, access_token })
        return res.json({ message: "Opération exécuté avec succès" }).status(200)
    }
    catch(error)
    {
        console.log("Something went wrong !! ", error)
        return res.json({message: "Une erreur est survenue, Veuillez reéssayer"}).status(400)
    }
}