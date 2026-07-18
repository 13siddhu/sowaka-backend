const express = require('express');
const router = express.Router();
const employeeController = require('./employees.controller');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);

// List employees (can be HR or Super Admin)
router.get('/', authorize('HR_ADMIN', 'SUPER_ADMIN'), employeeController.listEmployees);

// Add employee
router.post('/', authorize('HR_ADMIN', 'SUPER_ADMIN'), employeeController.addEmployee);

// Edit employee
router.put('/:id', authorize('HR_ADMIN', 'SUPER_ADMIN'), employeeController.editEmployee);

// Change Status (Deactivate/Activate)
router.patch('/:id/status', authorize('HR_ADMIN', 'SUPER_ADMIN'), employeeController.changeStatus);

// Delete employee
router.delete('/:id', authorize('SUPER_ADMIN'), employeeController.deleteEmployee);

// Bulk import (simplified)
router.post('/bulk-import', authorize('HR_ADMIN', 'SUPER_ADMIN'), employeeController.bulkImport);

module.exports = router;
