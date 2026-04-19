const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case' },
  title: { type: String, required: true },
  fileName: String,
  fileUrl: String,
  extractedData: {
    caseNumber: String,
    parties: String,
    hearingDate: Date,
    courtName: String,
    summary: String
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Linked', 'Processed'], 
    default: 'Pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notice', NoticeSchema);
