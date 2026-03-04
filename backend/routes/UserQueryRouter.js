


// This router is responsible for handling user queries related to adding projects and scanning repositories.

const express = require('express');
const path = require('path');

const router = express.Router();

const { checkUserAuthorization } = require('../middlewares/checkUserAuthorization');
const UserQueryController = require('../controllers/UserQueryController');


router.post('/profile', checkUserAuthorization, UserQueryController.getUserProfile);
router.get('/projects', checkUserAuthorization, UserQueryController.getUserProjects);


router.get('/projects/:projectId/analysis', checkUserAuthorization, UserQueryController.getProjectAnalysis);
router.get('/analysis/:analysisId/findings', checkUserAuthorization, UserQueryController.getAnalysisFindings);

router.get('/stats/kpi', checkUserAuthorization, UserQueryController.getKPIStats) //Key Performance Indicator

module.exports = router;