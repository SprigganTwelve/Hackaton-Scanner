

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

}