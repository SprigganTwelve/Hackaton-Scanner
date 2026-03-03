


const express = require('express');
const router = express.Router();
const multer = require('multer');
const CodeScanner = require('../controllers/UserController');
const { checkUserAuthorization } = require('../middlewares/checkUserAuthorization');

const upload = multer({ dest: 'uploads/' });

router.post('/scan', checkUserAuthorization, UserController.scanRepo);
router.post('/scan-zip', checkUserAuthorization, upload.single('file'), UserController.scanZip);


module.exports = router;