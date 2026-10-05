const app = require('./app');
const { startExpiryJob } = require('./services/expiry.service');
const { startReminderJob } = require('./services/schedule.service');
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    startExpiryJob();   // hourly sweep marks expired food as EXPIRED
    startReminderJob(); // scheduled-donation reminders
});
