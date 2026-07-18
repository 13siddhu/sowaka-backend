const express = require('express');
const router = express.Router();
const feedbackController = require('./feedback.controller');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

// Employee routes
router.get('/my-assignments', feedbackController.getMyAssignments);
router.get('/:submissionId', feedbackController.getSubmission);
router.post('/:submissionId', feedbackController.submitFeedback);

module.exports = router;
