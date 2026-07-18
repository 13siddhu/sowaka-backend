const prisma = require('../../config/db');
const { analyzeSentiment } = require('../../utils/sentiment');
const { getIO } = require('../../sockets');

const getMyAssignments = async (req, res, next) => {
  try {
    const assignments = await prisma.feedbackSubmission.findMany({
      where: { userId: req.user.id },
      include: {
        campaign: {
          include: {
            form: {
              include: {
                questions: {
                  include: { options: true },
                  orderBy: { orderIndex: 'asc' }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

const getAllFeedbacks = async (req, res, next) => {
  try {
    const { campaignId, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      status: 'SUBMITTED',
      ...(campaignId && { campaignId })
    };

    const submissions = await prisma.feedbackSubmission.findMany({
      where,
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        campaign: { select: { title: true, isAnonymous: true } },
        user: { select: { name: true, email: true, employeeId: true, department: { select: { name: true } } } },
        answers: { include: { question: { select: { text: true, type: true } } } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Handle anonymity
    const sanitizedSubmissions = submissions.map(sub => {
      if (sub.campaign.isAnonymous) {
        return {
          ...sub,
          userId: 'ANONYMOUS',
          user: { name: 'Anonymous', department: sub.user.department } // Keep department maybe? Usually anonymized fully or kept partial.
        };
      }
      return sub;
    });

    const total = await prisma.feedbackSubmission.count({ where });

    res.json({
      success: true,
      data: sanitizedSubmissions,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (error) {
    next(error);
  }
};

const getSubmission = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const submission = await prisma.feedbackSubmission.findFirst({
      where: { id: submissionId, userId: req.user.id },
      include: {
        campaign: { include: { form: { include: { questions: { include: { options: true } } } } } },
        answers: true
      }
    });
    if (!submission) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: submission });
  } catch (error) {
    next(error);
  }
};

const submitFeedback = async (req, res, next) => {
  try {
    const { submissionId } = req.params;
    const { answers, isDraft } = req.body; // answers is an array of { questionId, answerText, answerNumeric, answerArray }

    const submission = await prisma.feedbackSubmission.findUnique({
      where: { id: submissionId },
      include: { campaign: true }
    });

    if (!submission || submission.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    if (submission.status === 'SUBMITTED') {
      return res.status(400).json({ success: false, message: 'Already submitted' });
    }

    // Process answers with sentiment analysis for TEXT types
    const processedAnswers = answers.map(ans => {
      let sentiment = { score: null, label: null };
      if (ans.answerText) {
        sentiment = analyzeSentiment(ans.answerText);
      }
      return {
        ...ans,
        sentimentScore: sentiment.score,
        sentimentLabel: sentiment.label
      };
    });

    // Save answers
    await prisma.$transaction(async (tx) => {
      // Delete existing answers if draft was saved before
      await tx.feedbackAnswer.deleteMany({ where: { submissionId } });
      
      await tx.feedbackAnswer.createMany({
        data: processedAnswers.map(ans => ({ ...ans, submissionId }))
      });

      await tx.feedbackSubmission.update({
        where: { id: submissionId },
        data: {
          status: isDraft ? 'DRAFT' : 'SUBMITTED',
          submittedAt: isDraft ? null : new Date()
        }
      });
    });

    if (!isDraft) {
      // Real-time update
      getIO().emit('feedback_submitted', { campaignId: submission.campaignId });
      
      // Audit log
      await prisma.auditLog.create({
        data: { userId: req.user.id, action: 'SUBMIT_FEEDBACK', metadata: { submissionId, campaignId: submission.campaignId } }
      });
    }

    res.json({ success: true, message: isDraft ? 'Draft saved' : 'Feedback submitted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyAssignments, getSubmission, submitFeedback, getAllFeedbacks };
