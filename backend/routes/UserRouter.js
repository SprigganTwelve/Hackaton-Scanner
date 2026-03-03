const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { checkUserAuthorization } = require('../middlewares/checkUserAuthorization');

router.post('/scan', checkUserAuthorization, UserController.scanRepo);

module.exports = router;