const express = require('express');
const router = express.Router({ mergeParams: true }); // to access campaignId if nested
const formController = require('./forms.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// Forms & Questions management (HR only)
router.post('/', authorize('HR_ADMIN', 'SUPER_ADMIN'), formController.createForm);
router.get('/:campaignId', formController.getFormByCampaign);
router.post('/:formId/questions', authorize('HR_ADMIN', 'SUPER_ADMIN'), formController.addQuestion);
router.put('/questions/:questionId', authorize('HR_ADMIN', 'SUPER_ADMIN'), formController.updateQuestion);
router.delete('/questions/:questionId', authorize('HR_ADMIN', 'SUPER_ADMIN'), formController.deleteQuestion);

module.exports = router;
