const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Case = require('../models/Case');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const Invitation = require('../models/Invitation');
const mongoose = require('mongoose');

// @route   POST /api/team/invite
// @desc    Invite a junior lawyer via email
// @access  Private
router.post('/invite', auth, async (req, res) => {
  const { caseId, email } = req.body;

  try {
    const caseItem = await Case.findOne({ _id: caseId, user: req.user.id });
    if (!caseItem) {
      return res.status(404).json({ msg: 'Case not found' });
    }

    // Check if user exists
    const junior = await User.findOne({ email });
    if (!junior) {
      return res.status(404).json({ msg: 'No registered user found with this email' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const invitation = new Invitation({
      caseId,
      email,
      token,
      invitedBy: req.user.id
    });

    await invitation.save();

    // In a real app, send email here. 
    // For now, we return the link for the user to share manually if needed.
    const inviteLink = `http://localhost:5173/accept-invite/${token}`;
    console.log(`[Invitation] Link generated: ${inviteLink}`);

    res.json({ msg: 'Invitation sent successfully', inviteLink });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/team/my-invitations
// @desc    Get all invitations sent to the current user
// @access  Private
router.get('/my-invitations', auth, async (req, res) => {
  try {
    const invitations = await Invitation.find({ email: req.user.email, status: 'pending' })
      .populate('caseId', 'title caseType urgency')
      .populate('invitedBy', 'name email');
    res.json(invitations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/team/invitations
// @desc    Get all pending invitations for the lead
// @access  Private
router.get('/invitations', auth, async (req, res) => {
  try {
    const invitations = await Invitation.find({ invitedBy: req.user.id, status: 'pending' }).populate('caseId', 'title');
    res.json(invitations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/team/accept-invite
// @desc    Accept an invitation and grant access
// @access  Private
router.post('/accept-invite', auth, async (req, res) => {
  const { token } = req.body;

  try {
    const invitation = await Invitation.findOne({ token, status: 'pending' });
    if (!invitation) {
      return res.status(404).json({ msg: 'Invalid or expired invitation' });
    }

    // Assign the case to the current logged-in user
    const caseItem = await Case.findById(invitation.caseId);
    if (!caseItem) {
      return res.status(404).json({ msg: 'Case no longer exists' });
    }

    caseItem.assignedTo = req.user.id;
    await caseItem.save();

    invitation.status = 'accepted';
    await invitation.save();

    res.json({ msg: 'Case access granted successfully', caseId: invitation.caseId });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST /api/team/revoke
// @desc    Revoke case access
// @access  Private
router.post('/revoke', auth, async (req, res) => {
  const { caseId } = req.body;
  try {
    const caseItem = await Case.findOne({ _id: caseId, user: req.user.id });
    if (!caseItem) return res.status(404).json({ msg: 'Case not found' });
    caseItem.assignedTo = null;
    await caseItem.save();
    res.json({ msg: 'Access revoked' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   DELETE /api/team/invitation/:id
// @desc    Cancel a pending invitation
// @access  Private
router.delete('/invitation/:id', auth, async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ _id: req.params.id, invitedBy: req.user.id });
    if (!invitation) return res.status(404).json({ msg: 'Invitation not found' });
    
    await Invitation.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Invitation cancelled' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
