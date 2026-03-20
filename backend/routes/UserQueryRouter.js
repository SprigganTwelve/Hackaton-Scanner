


// This router is responsible for handling user queries related to adding projects and scanning repositories.

const router = require('express').Router()

const { checkUserAuthorization } = require('../middlewares/checkUserAuthorization');
const UserQueryController = require('../controllers/UserQueryController');


router.get('/profile', checkUserAuthorization, UserQueryController.getUserProfile);
router.get('/projects', checkUserAuthorization, UserQueryController.getUserProjects);


router.get('/projects/:projectId/analysis', checkUserAuthorization, UserQueryController.getProjectAnalysis);
router.get('/analysis/:analysisId/findings', checkUserAuthorization, UserQueryController.getAnalysisFindings);
router.get('/analysis/:analysisId/reports', checkUserAuthorization, UserQueryController.getAnalysisReports);

router.get('/:analysisId/stats/kpi', checkUserAuthorization, UserQueryController.getKPIStats) //Key Performance Indicator

module.exports = router;