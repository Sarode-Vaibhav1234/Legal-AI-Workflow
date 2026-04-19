const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs');
const Case = require('../models/Case');
const Hearing = require('../models/Hearing');
const auth = require('../middleware/auth');
const { secureAndStoreFile, retrieveAndDecryptFile, extractText } = require('../services/documentService');
const { addDocumentToStore } = require('../services/ragService');
const { processChatQuery, generateReports } = require('../services/mcpAgent');

const upload = multer({ dest: 'uploads/temp/' });

/**
 * Helper to verify that a case belongs to the logged-in user
 */
const verifyCaseOwnership = async (caseId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(caseId)) return null;
  const caseObj = await Case.findOne({ 
    _id: caseId, 
    $or: [{ user: userId }, { assignedTo: userId }]
  });
  return caseObj;
};

// GET /api/hearings — Get all hearings for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const cases = await Case.find({ 
      $or: [{ user: req.user.id }, { assignedTo: req.user.id }]
    });
    const caseIds = cases.map(c => c._id);
    const hearings = await Hearing.find({ caseId: { $in: caseIds } })
      .populate('caseId', 'title')
      .sort({ hearingDate: 1 });
    res.status(200).json(hearings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/hearings/case/:caseId — Create a new hearing
router.post('/case/:caseId', auth, async (req, res) => {
  try {
    const { hearingDate, hearingTime, courtName, judgeName, hearingType, notes } = req.body;
    
    const caseObj = await verifyCaseOwnership(req.params.caseId, req.user.id);
    if (!caseObj) return res.status(403).json({ error: 'Access denied to this case' });

    if (!hearingDate) return res.status(400).json({ error: 'Hearing date is required' });

    const newHearing = new Hearing({
      caseId: caseObj._id,
      hearingDate,
      hearingTime: hearingTime || '',
      courtName: courtName || '',
      judgeName: judgeName || '',
      hearingType: hearingType || 'Other',
      notes: notes || ''
    });

    await newHearing.save();
    caseObj.hearings.push(newHearing._id);
    await caseObj.save();

    res.status(201).json(newHearing);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload document to a hearing
router.post('/:hearingId/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.hearingId)) {
      return res.status(400).json({ error: 'Invalid Hearing ID' });
    }
    const hearing = await Hearing.findById(req.params.hearingId).populate('caseId');
    if (!hearing) return res.status(404).json({ error: 'Hearing not found' });
    
    if (hearing.caseId.user.toString() !== req.user.id && hearing.caseId.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const fileBuffer = fs.readFileSync(file.path);
    const { encryptedPath, iv } = await secureAndStoreFile(fileBuffer, file.originalname);
    const extractedText = await extractText(fileBuffer, file.mimetype);

    if (extractedText) {
      await addDocumentToStore(hearing.caseId._id.toString(), extractedText, {
        fileName: file.originalname,
        hearingId: hearing._id.toString()
      });
    }

    hearing.documents.push({
      fileName: file.originalname,
      originalType: file.mimetype,
      path: file.path,
      encryptedPath,
      iv,
      extractedText: extractedText ? 'Extracted successfully' : 'No text extracted',
      summary: ''
    });

    await hearing.save();
    fs.unlinkSync(file.path);

    res.status(200).json({ message: 'Document securely uploaded and processed', document: hearing.documents[hearing.documents.length - 1] });
  } catch (error) {
    res.status(500).json({ error: 'Server error during upload' });
  }
});

// Download/Decrypt Document
router.get('/:hearingId/document/:docId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.hearingId)) {
      return res.status(400).json({ error: 'Invalid Hearing ID' });
    }
    const hearing = await Hearing.findById(req.params.hearingId).populate('caseId');
    if (!hearing) return res.status(404).json({ error: 'Hearing not found' });

    if (hearing.caseId.user.toString() !== req.user.id && hearing.caseId.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const doc = hearing.documents.id(req.params.docId) || hearing.reports.id(req.params.docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const originalData = await retrieveAndDecryptFile(doc.encryptedPath || doc.path, doc.iv);
    res.setHeader('Content-Disposition', `attachment; filename="${doc.fileName || doc.type + '.txt'}"`);
    res.setHeader('Content-Type', doc.originalType || 'text/plain');
    res.send(originalData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve document' });
  }
});

// Chatbot Endpoint (Single MCP Agent)
router.post('/:hearingId/chat', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.hearingId)) {
      return res.status(400).json({ error: 'Invalid Hearing ID' });
    }
    const { query } = req.body;
    const hearing = await Hearing.findById(req.params.hearingId).populate('caseId');
    if (!hearing) return res.status(404).json({ error: 'Hearing not found' });

    if (hearing.caseId.user.toString() !== req.user.id && hearing.caseId.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    if (query.toLowerCase().trim() === 'generate report') {
      const reports = await generateReports(hearing.caseId, hearing);
      const sumBuf = Buffer.from(reports.summarizationReport, 'utf-8');
      const astBuf = Buffer.from(reports.assistanceReport, 'utf-8');
      const sumSecure = await secureAndStoreFile(sumBuf, 'Summarization_Report.txt');
      const astSecure = await secureAndStoreFile(astBuf, 'Assistance_Report.txt');

      hearing.reports.push({ type: 'Summarization', content: reports.summarizationReport, path: sumSecure.encryptedPath, iv: sumSecure.iv });
      hearing.reports.push({ type: 'Assistance', content: reports.assistanceReport, path: astSecure.encryptedPath, iv: astSecure.iv });
      await hearing.save();

      return res.status(200).json({ message: 'Reports generated', reportsAdded: true });
    }

    const response = await processChatQuery(hearing.caseId, hearing, query);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to process query' });
  }
});

// Get all hearings for a case
router.get('/case/:caseId', auth, async (req, res) => {
  try {
    const caseObj = await verifyCaseOwnership(req.params.caseId, req.user.id);
    if (!caseObj) return res.status(403).json({ error: 'Access denied' });

    const hearings = await Hearing.find({ caseId: req.params.caseId }).sort({ hearingDate: -1 });
    res.status(200).json(hearings);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific hearing
router.get('/:hearingId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.hearingId)) {
      return res.status(400).json({ error: 'Invalid Hearing ID' });
    }
    const hearing = await Hearing.findById(req.params.hearingId).populate('caseId');
    if (!hearing) return res.status(404).json({ error: 'Hearing not found' });

    if (hearing.caseId.user.toString() !== req.user.id && hearing.caseId.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    res.status(200).json(hearing);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/hearings/:hearingId
router.delete('/:hearingId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.hearingId)) {
      return res.status(400).json({ error: 'Invalid Hearing ID' });
    }
    const hearing = await Hearing.findById(req.params.hearingId).populate('caseId');
    if (!hearing) return res.status(404).json({ error: 'Hearing not found' });

    if (hearing.caseId.user.toString() !== req.user.id && hearing.caseId.assignedTo?.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    await Case.findByIdAndUpdate(hearing.caseId._id, { $pull: { hearings: hearing._id } });
    await Hearing.findByIdAndDelete(req.params.hearingId);
    res.status(200).json({ message: 'Hearing deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
