


const express = require('express');
const router = express.Router();
const multer = require('multer');
const { checkUserAuthorization } = require('../middlewares/checkUserAuthorization');
const UserController = require('../controllers/UserController');

const upload = multer({ dest: 'uploads/' });

router.post('/git/add-project', checkUserAuthorization, UserController.addProjectWithURL);

router.post('/scan', checkUserAuthorization, UserController.scanRepo);
router.post('/scan-zip', checkUserAuthorization, upload.single('file'), UserController.scanZip);


module.exports = router;