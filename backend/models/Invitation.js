const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 172800 // 48 hours
  }
});

module.exports = mongoose.model('Invitation', InvitationSchema);
