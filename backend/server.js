const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { startScheduler } = require('./services/notificationService');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const casesRouter = require('./routes/cases');
const aiRouter = require('./routes/ai');
const authRouter = require('./routes/auth');
const translateRouter = require('./routes/translate');
const hearingsRouter = require('./routes/hearings');
const teamRouter = require('./routes/team');
const noticesRouter = require('./routes/notices');
app.use('/api/cases', casesRouter);
app.use('/api/ai', aiRouter);
app.use('/api/auth', authRouter);
app.use('/api/translate', translateRouter);
app.use('/api/hearings', hearingsRouter);
app.use('/api/team', teamRouter);
app.use('/api/notices', noticesRouter);

// Basic Route
app.get('/', (req, res) => {
    res.send('Legal AI Workflow API is running...');
});

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/legal-ai')
.then(() => {
    console.log('MongoDB Connected');
    startScheduler(); // Start the hearing notification scheduler
})
.catch(err => console.log('MongoDB Connection Error:', err));

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
