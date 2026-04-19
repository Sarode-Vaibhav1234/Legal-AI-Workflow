const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Case = require('../models/Case');
const auth = require('../middleware/auth');
const { exec } = require('child_process');
const path = require('path');
const Groq = require("groq-sdk");
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * @route   GET /api/cases
 * @desc    Fetch all cases for the LOGGED-IN user
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const cases = await Case.find({ 
      $or: [
        { user: req.user.id },
        { assignedTo: req.user.id }
      ]
    })
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ updatedAt: -1 });
    res.json(cases);
  } catch (error) {
    console.error('Fetch All Cases Error:', error);
    res.status(500).json({ error: 'Server error fetching cases' });
  }
});

const callGroq = async (promptText) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: promptText }],
      model: "llama-3.3-70b-versatile",
    });
    return chatCompletion.choices[0]?.message?.content || "";
  } catch (err) {
    return "**[MOCK SUMMARY]** Groq unavailable. Case involves: " + promptText.substring(0, 50);
  }
};

/**
 * @route   POST /api/cases/intake
 * @desc    Create a new case tied to the user
 * @access  Private
 */
router.post('/intake', auth, async (req, res) => {
  try {
    const { title, clientDetails, caseType, complaintText } = req.body;

    const extractedData = {
      sections: [],
      keyDates: [],
      extractedEntities: []
    };

    if (complaintText) {
      const lower = complaintText.toLowerCase();
      if (lower.includes('murder')) extractedData.sections.push('IPC Sec 302');
      if (lower.includes('theft')) extractedData.sections.push('IPC Sec 378');
    }

    const newCase = new Case({
      title,
      clientDetails,
      caseType,
      extractedData,
      urgency: 'Medium',
      status: 'Intake Complete',
      user: req.user.id // Tie case to logged-in user
    });

    // Run Python Kaggle Script
    const scriptPath = path.join(__dirname, '..', 'scripts', 'kaggle_search.py');
    const query = complaintText || caseType || title;
    
    exec(`python "${scriptPath}" "${query.replace(/"/g, '\\"')}"`, { timeout: 120000 }, async (error, stdout) => {
      let referenceCases = [];
      if (stdout) {
        try {
          referenceCases = JSON.parse(stdout.trim());
        } catch (e) {}
      }
      
      // --- Quantum Optimization Pass (Non-blocking) ---
      if (referenceCases.length > 0) {
        try {
          const quantumScript = path.join(__dirname, '..', 'scripts', 'quantum_search.py');
          const qData = JSON.stringify(referenceCases);
          // Pass as arguments or stdin if too large, but for 3-5 results arguments are fine
          const qProc = exec(`python "${quantumScript}" "${query.replace(/"/g, '\\"')}" '${qData.replace(/'/g, "'\\''")}'`);
          qProc.stdout.on('data', (data) => {
             try {
               newCase.referenceCases = JSON.parse(data.trim());
               newCase.save(); // Async update after quantum re-ranking
             } catch(e) {}
          });
        } catch (err) {}
      }

      newCase.referenceCases = referenceCases;
      const summary = await callGroq(`Summarize: ${complaintText}`);
      newCase.caseSummary = summary;
      
      await newCase.save();

      res.status(201).json({
        message: 'Case successfully created.',
        caseId: newCase._id,
        extractedData,
        referenceCases,
        caseSummary: summary
      });
    });
  } catch (error) {
    console.error('Intake Error:', error);
    res.status(500).json({ error: 'Server error during case intake' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Case ID' });
    }
    const caseItem = await Case.findOne({ 
      _id: req.params.id, 
      $or: [{ user: req.user.id }, { assignedTo: req.user.id }] 
    }).populate('hearings');
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });
    res.json(caseItem);
  } catch (error) {
    res.status(500).json({ error: 'Server error fetching case' });
  }
});

/**
 * @route   PUT /api/cases/:id
 * @access  Private
 */
router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Case ID' });
    }
    const updatedCase = await Case.findOneAndUpdate(
      { _id: req.params.id, $or: [{ user: req.user.id }, { assignedTo: req.user.id }] },
      { $set: req.body },
      { new: true }
    );
    if (!updatedCase) return res.status(404).json({ error: 'Case not found' });
    res.json(updatedCase);
  } catch (error) {
    res.status(500).json({ error: 'Server error updating case' });
  }
});

/**
 * @route   DELETE /api/cases/:id
 * @access  Private
 */
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid Case ID' });
    }
    const caseItem = await Case.findOne({ _id: req.params.id, user: req.user.id });
    if (!caseItem) return res.status(404).json({ error: 'Case not found' });

    const Hearing = require('../models/Hearing');
    await Hearing.deleteMany({ caseId: req.params.id });
    await Case.findByIdAndDelete(req.params.id);
    res.json({ message: 'Case deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
