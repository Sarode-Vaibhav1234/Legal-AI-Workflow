const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { runResearcherAgent, runScribeAgent, runAuditorAgent } = require('../services/agents');

const Case = require('../models/Case');

/**
 * Helper to verify that a user has access to a case
 */
const verifyCaseAccess = async (caseId, userId) => {
  if (!caseId) return null;
  return await Case.findOne({ 
    _id: caseId, 
    $or: [{ user: userId }, { assignedTo: userId }]
  });
};

// POST /api/ai/research
router.post('/research', auth, async (req, res) => {
  try {
    const { query, caseContext, caseId } = req.body;
    
    // Optional check: if caseId is provided, verify access
    if (caseId) {
      const caseObj = await verifyCaseAccess(caseId, req.user.id);
      if (!caseObj) return res.status(403).json({ error: 'Access denied to this case' });
    }

    const response = await runResearcherAgent(query, caseContext);
    res.json({ result: response });
  } catch (error) {
    console.error('AI Research Error:', error);
    res.status(500).json({ error: 'Failed to run Researcher Agent' });
  }
});

// POST /api/ai/draft
router.post('/draft', auth, async (req, res) => {
  try {
    const { documentType, caseContext, caseId } = req.body;
    
    if (!caseId) return res.status(400).json({ error: 'Case ID is required for drafting' });
    
    const caseObj = await verifyCaseAccess(caseId, req.user.id);
    if (!caseObj) return res.status(403).json({ error: 'Access denied to this case' });

    const response = await runScribeAgent(documentType, caseContext);
    res.json({ result: response });
  } catch (error) {
    console.error('AI Scribe Error:', error);
    res.status(500).json({ error: 'Failed to run Scribe Agent' });
  }
});

// POST /api/ai/audit
router.post('/audit', auth, async (req, res) => {
  try {
    const { draftContent, caseId } = req.body;
    
    if (caseId) {
      const caseObj = await verifyCaseAccess(caseId, req.user.id);
      if (!caseObj) return res.status(403).json({ error: 'Access denied to this case' });
    }

    const response = await runAuditorAgent(draftContent);
    res.json({ result: response });
  } catch (error) {
    console.error('AI Auditor Error:', error);
    res.status(500).json({ error: 'Failed to run Auditor Agent' });
  }
});

module.exports = router;
