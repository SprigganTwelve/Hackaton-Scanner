const router = require('express').Router()

const AuthController = require('../controllers/AuthController')


router.post('login', AuthController.login  )


/**
 * This route is to register a new user into the system
 */
router.post('register', AuthController.register)


module.exports = router;