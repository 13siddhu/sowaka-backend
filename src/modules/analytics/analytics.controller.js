const prisma = require('../../config/db');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const totalEmployees = await prisma.user.count({ where: { role: 'EMPLOYEE' } });
    const activeCampaigns = await prisma.campaign.count({ where: { status: 'ACTIVE' } });
    
    const submittedFeedback = await prisma.feedbackSubmission.count({ where: { status: 'SUBMITTED' } });
    const pendingFeedback = await prisma.feedbackSubmission.count({ where: { status: { in: ['ASSIGNED', 'PENDING'] } } });

    const totalSubmissions = submittedFeedback + pendingFeedback;
    const completionPercentage = totalSubmissions === 0 ? 0 : ((submittedFeedback / totalSubmissions) * 100).toFixed(2);

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeCampaigns,
        submittedFeedback,
        pendingFeedback,
        completionPercentage
      }
    });
  } catch (error) {
    next(error);
  }
};

const getSentimentAnalysis = async (req, res, next) => {
  try {
    // Aggregate sentiments from feedback answers
    const answers = await prisma.feedbackAnswer.groupBy({
      by: ['sentimentLabel'],
      _count: { sentimentLabel: true },
      where: { sentimentLabel: { not: null } }
    });

    const formatted = { POSITIVE: 0, NEUTRAL: 0, NEGATIVE: 0 };
    answers.forEach(a => {
      if (a.sentimentLabel) {
        formatted[a.sentimentLabel] = a._count.sentimentLabel;
      }
    });

    res.json({ success: true, data: formatted });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardMetrics, getSentimentAnalysis };
