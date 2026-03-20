

//...
const express = require('express');
const path = require('path');

const router = express.Router();
const multer = require('multer');

//-- Middlewares
const { checkUserAuthorization } = require('../middlewares/checkUserAuthorization');

const storage = multer.memoryStorage()
const upload = multer({ storage });


//-- Controllers
const CorrectionController = require('../controllers/CorrectionController');
const UserController = require('../controllers/UserController');
const ReportController = require('../controllers/ReportController');


//-- Routes

router.post('/add-project/url', checkUserAuthorization, UserController.addProjectWithURL);
router.post('/add-project/zip', 
    checkUserAuthorization,
    upload.single('file'),
    UserController.addProjectWithZip
);


router.post('/scan', checkUserAuthorization, UserController.scanRepo);
router.post('/scan-zip', checkUserAuthorization, UserController.scanZip);


router.get('/finding/:findingId/preview', checkUserAuthorization, CorrectionController.previewCorrection);
router.post('/finding/:findingId/apply', checkUserAuthorization, CorrectionController.applyCorrection);
router.post('/finding/:findingId/reject', checkUserAuthorization, CorrectionController.rejectCorrection);


router.get('/reports/:reportId', checkUserAuthorization, ReportController.downloadPdf )
router.get('/analysis/:analysisId/report', checkUserAuthorization, ReportController.generateUserReport);
router.post('/analysis/:analysisId/report', checkUserAuthorization, ReportController.generateUserReport);

//-- Exports

module.exports = router;