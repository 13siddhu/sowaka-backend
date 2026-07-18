const express = require('express');
const router = express.Router();
const feedbackController = require('./feedback.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// Admin/HR routes
router.get('/', authorize('HR_ADMIN', 'SUPER_ADMIN'), feedbackController.getAllFeedbacks);

// Employee routes
router.get('/my-assignments', feedbackController.getMyAssignments);
router.get('/:submissionId', feedbackController.getSubmission);
router.post('/:submissionId', feedbackController.submitFeedback);

module.exports = router;
