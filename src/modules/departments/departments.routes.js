const express = require('express');
const router = express.Router();
const deptController = require('./departments.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', deptController.listDepartments);
router.post('/', authorize('HR_ADMIN', 'SUPER_ADMIN'), deptController.createDepartment);
router.put('/:id', authorize('HR_ADMIN', 'SUPER_ADMIN'), deptController.updateDepartment);
router.delete('/:id', authorize('SUPER_ADMIN'), deptController.deleteDepartment);

// Team endpoints
router.post('/:departmentId/teams', authorize('HR_ADMIN', 'SUPER_ADMIN'), deptController.createTeam);
router.get('/:departmentId/teams', deptController.listTeams);

module.exports = router;
