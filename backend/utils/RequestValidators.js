
/**
 * Ensures that a specific property exists in the request body.
 * If the property is missing, a 400 response is returned with the provided error message.
 * Intended to be used with requests whose body is JSON.
 *
 * @param {import('express').Request} req - Express request object.
 * @param {import('express').Response} res - Express response object.
 * @param {string} field - The name of the property to check in req.body.
 * @param {string} errorMessage - The error message returned if the property is missing.
 */

const ensureBodyProperty = (req, res, field, errorMessage) => {
    const body = req?.body;

    if (!(field in body)) {
        res.status(400).json({ message: errorMessage });
        return false;
    }

    return true;
};


module.exports = { ensureBodyProperty }