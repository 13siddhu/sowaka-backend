const express = require('express');
const router = express.Router();
const campaignController = require('./campaigns.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// HR Routes
router.post('/', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.createCampaign);
router.put('/:id', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.updateCampaign);
router.delete('/:id', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.deleteCampaign);
router.post('/:id/publish', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.publishCampaign);
router.post('/:id/close', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.closeCampaign);
router.post('/:id/assign', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.assignCampaign);

// Analytics / Tracking (HR)
router.get('/:id/submitted', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.getSubmitted);
router.get('/:id/pending', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.getPending);
router.get('/:id/completion-rate', authorize('HR_ADMIN', 'SUPER_ADMIN'), campaignController.getCompletionRate);

// Common
router.get('/', campaignController.listCampaigns);
router.get('/:id', campaignController.getCampaign);

module.exports = router;
