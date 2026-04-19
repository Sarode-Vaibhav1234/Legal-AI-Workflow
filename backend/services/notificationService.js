const nodemailer = require('nodemailer');
const cron = require('node-cron');
const Hearing = require('../models/Hearing');
const Case = require('../models/Case');
const User = require('../models/User');

// Configure transporter
// For production, use actual SMTP credentials from .env
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Legal AI Workflow" <${process.env.EMAIL_USER || 'your-email@gmail.com'}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
};

const formatEmailTemplate = (caseTitle, hearing, user) => {
  const dateStr = new Date(hearing.hearingDate).toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  
  const caseLink = `http://localhost:3000/cases/${hearing.caseId._id}`;

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 10px;">
      <h2 style="color: #008080;">Hearing Reminder</h2>
      <p>Dear Counsel ${user.name},</p>
      <p>This is an automated reminder for an upcoming hearing in the following case:</p>
      
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Case:</strong> ${caseTitle}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${hearing.hearingTime || 'As scheduled'}</p>
        <p><strong>Court:</strong> ${hearing.courtName || 'Not specified'}</p>
        <p><strong>Type:</strong> ${hearing.hearingType}</p>
      </div>
      
      <p>You can view the case details, evidence, and AI summaries by clicking the button below:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${caseLink}" style="background-color: #d4af37; color: #000; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Open Case Workspace</a>
      </div>
      
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #888;">Legal AI Lawer Workflow - Automated Notification System</p>
    </div>
  `;
};

const processNotifications = async () => {
  console.log('Running hearing notification check...');
  
  try {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const tomorrowStart = new Date(new Date(todayStart).setDate(todayStart.getDate() + 1));
    const sevenDaysLater = new Date(new Date(todayStart).setDate(todayStart.getDate() + 7));
    const sevenDaysLaterEnd = new Date(new Date(sevenDaysLater).setDate(sevenDaysLater.getDate() + 1));

    // Fetch all upcoming hearings with case and user data
    const hearings = await Hearing.find({
      hearingDate: { $gte: todayStart }
    }).populate({
      path: 'caseId',
      populate: [
        { path: 'user' },
        { path: 'assignedTo' }
      ]
    });

    for (const hearing of hearings) {
      if (!hearing.caseId) continue;

      const caseTitle = hearing.caseId.title;
      const hDate = new Date(hearing.hearingDate);
      const diffTime = hDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isSameDay = hDate.toDateString() === new Date().toDateString();

      const recipients = [];
      if (hearing.caseId.user) recipients.push(hearing.caseId.user);
      if (hearing.caseId.assignedTo) recipients.push(hearing.caseId.assignedTo);

      // Unique recipients
      const uniqueRecipients = Array.from(new Set(recipients.map(r => r._id.toString())))
        .map(id => recipients.find(r => r._id.toString() === id));

      for (const recipient of uniqueRecipients) {
        if (!recipient.email) continue;

        let reminderType = null;
        let subjectPrefix = 'Reminder';

        const dateTag = hDate.toISOString().split('T')[0];

        // 1. 7-day reminder
        if (diffDays === 7 && !hearing.notifiedReminders.includes(`7days-${dateTag}-${recipient._id}`)) {
          reminderType = `7days-${dateTag}-${recipient._id}`;
          subjectPrefix = '7-Day Notice';
        }
        // 2. 1-day reminder
        else if (diffDays === 1 && !hearing.notifiedReminders.includes(`1day-${dateTag}-${recipient._id}`)) {
          reminderType = `1day-${dateTag}-${recipient._id}`;
          subjectPrefix = 'Tomorrow: Hearing Notice';
        }
        // 3. Same-day reminder (sent early morning)
        else if (isSameDay && !hearing.notifiedReminders.includes(`sameday-${dateTag}-${recipient._id}`)) {
          reminderType = `sameday-${dateTag}-${recipient._id}`;
          subjectPrefix = 'TODAY: Hearing Reminder';
        }

        if (reminderType) {
          const sent = await sendEmail(
            recipient.email,
            `[${subjectPrefix}] ${caseTitle} - ${hearing.hearingType}`,
            formatEmailTemplate(caseTitle, hearing, recipient)
          );
          if (sent) {
            hearing.notifiedReminders.push(reminderType);
          }
        }
      }

      // 4. Hourly reminders on the last day if hearings are < 3 days apart
      if (isSameDay) {
        // Check if there was a previous hearing or is a future hearing within 3 days
        const otherHearings = await Hearing.find({
          caseId: hearing.caseId._id,
          _id: { $ne: hearing._id }
        });

        const isVeryClose = otherHearings.some(oh => {
          const gap = Math.abs(new Date(oh.hearingDate) - hDate);
          return gap > 0 && gap < (3 * 24 * 60 * 60 * 1000);
        });

        if (isVeryClose) {
          const currentHour = new Date().getHours();
          for (const recipient of uniqueRecipients) {
            const hourlyTag = `hourly-${currentHour}-${recipient._id}`;
            if (!hearing.notifiedReminders.includes(hourlyTag)) {
              await sendEmail(
                recipient.email,
                `[HOURLY URGENT] ${caseTitle} - Hearing in progress/upcoming`,
                formatEmailTemplate(caseTitle, hearing, recipient)
              );
              hearing.notifiedReminders.push(hourlyTag);
            }
          }
        }
      }
      
      await hearing.save();
    }
  } catch (error) {
    console.error('Error in notification service:', error);
  }
};

// Start the scheduler
const startScheduler = () => {
  // Run every hour at the top of the hour
  cron.schedule('0 * * * *', () => {
    processNotifications();
  });
  
  // Also run once immediately on startup
  processNotifications();
};

module.exports = { startScheduler, processNotifications };
