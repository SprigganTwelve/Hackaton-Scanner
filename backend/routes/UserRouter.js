


const express = require('express');
const path = require('path');

const router = express.Router();
const multer = require('multer');

const { generateReportController } = require('../controllers/reportController');
const { checkUserAuthorization } = require('../middlewares/checkUserAuthorization');
const UserController = require('../controllers/UserController');





const storage = multer.memoryStorage()
const upload = multer({ storage});


router.post('/add-project/url', checkUserAuthorization, UserController.addProjectWithURL);
router.post('/add-project/zip', checkUserAuthorization, upload.single('file'), UserController.addProjectWithZip);

router.post('/scan', checkUserAuthorization, UserController.scanRepo);
router.post('/scan-zip', checkUserAuthorization, upload.single('file'), UserController.scanZip);

router.post('/analysis/:analysisId/report', checkUserAuthorization, generateReportController);

module.exports = router;