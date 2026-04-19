const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notice = require('../models/Notice');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const { runNoticeExtractionAgent } = require('../services/agents');

// @route   POST /api/notices/upload
// @desc    Upload and extract notice data
// @access  Private
router.post('/upload', auth, async (req, res) => {
  try {
    const { title, textContent } = req.body;
    
    if (!textContent) return res.status(400).json({ msg: 'No text content provided' });

    // Extract data using AI
    const extractedData = await runNoticeExtractionAgent(textContent);

    const newNotice = new Notice({
      user: req.user.id,
      title: title || extractedData.caseNumber || 'New Notice',
      extractedData: {
        ...extractedData,
        hearingDate: extractedData.hearingDate ? new Date(extractedData.hearingDate) : null
      }
    });

    await newNotice.save();
    res.json(newNotice);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/notices
// @desc    Get all notices for a user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const notices = await Notice.find({ user: req.user.id }).populate('caseId');
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

const mongoose = require('mongoose');

// @route   GET /api/notices/case/:caseId
// @desc    Get all notices for a specific case
// @access  Private
router.get('/case/:caseId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.caseId)) {
      return res.status(400).json({ msg: 'Invalid Case ID' });
    }
    const notices = await Notice.find({ caseId: req.params.caseId, user: req.user.id });
    res.json(notices);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/notices/:id/link
// @desc    Link notice to case and create hearing
// @access  Private
router.post('/:id/link', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid Notice ID' });
    }
    const { caseId } = req.body;
    const notice = await Notice.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!notice) return res.status(404).json({ msg: 'Notice not found' });

    notice.caseId = caseId;
    notice.status = 'Linked';
    await notice.save();

    // Automatically create a hearing if a date was found
    if (notice.extractedData.hearingDate) {
      const newHearing = new Hearing({
        user: req.user.id,
        caseId: caseId,
        hearingDate: notice.extractedData.hearingDate,
        courtName: notice.extractedData.courtName || 'As per notice',
        hearingType: 'Mention',
        notes: `Automatically created from notice: ${notice.extractedData.summary}`
      });
      await newHearing.save();
    }

    res.json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/notices/:id/create-case
// @desc    Create new case from notice
// @access  Private
router.post('/:id/create-case', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid Notice ID' });
    }
    const notice = await Notice.findOne({ _id: req.params.id, user: req.user.id });
    if (!notice) return res.status(404).json({ msg: 'Notice not found' });

    const newCase = new Case({
      user: req.user.id,
      title: notice.extractedData.caseNumber || notice.title,
      caseType: 'Litigation',
      clientDetails: { name: notice.extractedData.parties || 'As per notice' },
      caseSummary: notice.extractedData.summary
    });

    const savedCase = await newCase.save();
    
    notice.caseId = savedCase._id;
    notice.status = 'Linked';
    await notice.save();

    // Create hearing
    if (notice.extractedData.hearingDate) {
      const newHearing = new Hearing({
        user: req.user.id,
        caseId: savedCase._id,
        hearingDate: notice.extractedData.hearingDate,
        courtName: notice.extractedData.courtName || 'As per notice',
        hearingType: 'Mention',
        notes: `Automatically created from notice: ${notice.extractedData.summary}`
      });
      await newHearing.save();
    }

    res.json({ notice, case: savedCase });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
