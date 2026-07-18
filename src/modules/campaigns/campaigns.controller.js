const prisma = require('../../config/db');
const { getIO } = require('../../sockets');

const createCampaign = async (req, res, next) => {
  try {
    const { title, description, startDate, endDate, isAnonymous } = req.body;
    const campaign = await prisma.campaign.create({
      data: {
        title, description, startDate: new Date(startDate), endDate: new Date(endDate),
        isAnonymous, createdBy: req.user.id
      }
    });
    
    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'CREATE_CAMPAIGN', metadata: { campaignId: campaign.id } }
    });

    getIO().emit('campaign_created', campaign);

    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

const updateCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, endDate, isAnonymous } = req.body;
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { title, description, startDate: startDate ? new Date(startDate) : undefined, endDate: endDate ? new Date(endDate) : undefined, isAnonymous }
    });
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

const deleteCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.campaign.delete({ where: { id } });
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    next(error);
  }
};

const publishCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

const closeCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'CLOSED' }
    });
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

const assignCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { employeeIds } = req.body;

    const assignments = employeeIds.map(userId => ({
      campaignId: id,
      userId,
      status: 'ASSIGNED'
    }));

    await prisma.feedbackSubmission.createMany({
      data: assignments,
      skipDuplicates: true
    });

    // Notify users
    const notifications = employeeIds.map(userId => ({
      userId,
      title: 'New Campaign Assigned',
      message: 'You have a new feedback campaign to complete.',
      type: 'NEW_CAMPAIGN'
    }));
    await prisma.notification.createMany({ data: notifications });

    employeeIds.forEach(userId => {
      getIO().to(userId).emit('new_notification', { title: 'New Campaign Assigned' });
    });

    res.json({ success: true, message: `Assigned to ${employeeIds.length} employees` });
  } catch (error) {
    next(error);
  }
};

const listCampaigns = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = { ...(status && { status }) };
    const campaigns = await prisma.campaign.findMany({
      where, skip: parseInt(skip), take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
    const total = await prisma.campaign.count({ where });

    res.json({ success: true, data: campaigns, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    next(error);
  }
};

const getCampaign = async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { form: { include: { questions: { include: { options: true } } } } }
    });
    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

// Analytics / Tracking specific to campaign
const getSubmitted = async (req, res, next) => {
  try {
    const { id } = req.params;
    const submissions = await prisma.feedbackSubmission.findMany({
      where: { campaignId: id, status: 'SUBMITTED' },
      include: { user: { select: { name: true, email: true } } }
    });
    res.json({ success: true, data: submissions });
  } catch (error) {
    next(error);
  }
};

const getPending = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pending = await prisma.feedbackSubmission.findMany({
      where: { campaignId: id, status: { in: ['ASSIGNED', 'PENDING', 'DRAFT'] } },
      include: { user: { select: { name: true, email: true } } }
    });
    res.json({ success: true, data: pending });
  } catch (error) {
    next(error);
  }
};

const getCompletionRate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const total = await prisma.feedbackSubmission.count({ where: { campaignId: id } });
    const submitted = await prisma.feedbackSubmission.count({ where: { campaignId: id, status: 'SUBMITTED' } });
    
    const rate = total === 0 ? 0 : (submitted / total) * 100;
    res.json({ success: true, data: { total, submitted, rate: rate.toFixed(2) } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCampaign, updateCampaign, deleteCampaign, publishCampaign, closeCampaign,
  assignCampaign, listCampaigns, getCampaign, getSubmitted, getPending, getCompletionRate
};
