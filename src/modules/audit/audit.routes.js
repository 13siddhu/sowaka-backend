const express = require('express');
const router = express.Router();
const prisma = require('../../config/db');
const { authenticate, authorize } = require('../../middleware/auth');

router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await prisma.auditLog.findMany({
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });
    
    const total = await prisma.auditLog.count();
    res.json({ success: true, data: logs, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
