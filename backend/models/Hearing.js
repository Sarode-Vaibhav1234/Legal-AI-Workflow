const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  fileName: String,
  originalType: String,
  path: String,
  encryptedPath: String,
  iv: String,
  extractedText: String,
  summary: String,
  uploadDate: { type: Date, default: Date.now }
});

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Summarization', 'Assistance']
  },
  content: String,
  path: String,
  iv: String,
  createdAt: { type: Date, default: Date.now }
});

const hearingSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
    required: true
  },
  hearingDate: {
    type: Date,
    required: true
  },
  hearingTime: {
    type: String,  // e.g. "10:30"
    default: ''
  },
  courtName: {
    type: String,
    default: ''
  },
  judgeName: {
    type: String,
    default: ''
  },
  hearingType: {
    type: String,
    enum: ['Argument', 'Evidence', 'Final Hearing', 'Bail', 'Mention', 'Judgment', 'Other'],
    default: 'Other'
  },
  notes: {
    type: String,
    default: ''
  },
  documents: [documentSchema],
  reports: [reportSchema],
  notifiedReminders: {
    type: [String], // e.g. ['7days', '1day', 'sameday', 'hourly-09', 'hourly-10'...]
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('Hearing', hearingSchema);
