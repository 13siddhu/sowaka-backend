const cron = require('node-cron');
const prisma = require('../config/db');
const { getIO } = require('../sockets');

const initJobs = () => {
  // Run every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running reminder cron job...');
    try {
      const now = new Date();
      
      const campaigns = await prisma.campaign.findMany({
        where: { status: 'ACTIVE' }
      });

      for (const campaign of campaigns) {
        const daysLeft = Math.ceil((campaign.endDate - now) / (1000 * 60 * 60 * 24));
        
        if ([3, 1, 0].includes(daysLeft)) {
          // Find pending submissions for this campaign
          const pending = await prisma.feedbackSubmission.findMany({
            where: { campaignId: campaign.id, status: { in: ['ASSIGNED', 'PENDING'] } }
          });

          for (const sub of pending) {
            const message = daysLeft === 0 
              ? `Today is the deadline for campaign: ${campaign.title}`
              : `Reminder: ${daysLeft} days left to submit feedback for ${campaign.title}`;
            
            await prisma.notification.create({
              data: {
                userId: sub.userId,
                title: 'Feedback Reminder',
                message,
                type: 'REMINDER'
              }
            });

            // Emit socket event
            getIO().to(sub.userId).emit('new_notification', { title: 'Feedback Reminder', message });
          }
        }
      }
    } catch (error) {
      console.error('Error in cron job', error);
    }
  });
};

module.exports = initJobs;
