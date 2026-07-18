const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('HR_ADMIN', 'SUPER_ADMIN'));

router.get('/dashboard', analyticsController.getDashboardMetrics);
router.get('/sentiment', analyticsController.getSentimentAnalysis);

module.exports = router;
