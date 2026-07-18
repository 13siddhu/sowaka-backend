const express = require('express');
const router = express.Router();
const prisma = require('../../config/db');
const { authenticate } = require('../../middleware/auth');

router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true }
    });
    res.json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
