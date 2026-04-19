const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  clientDetails: {
    name: String,
    contact: String,
    background: String
  },
  caseType: {
    type: String,
    enum: ['Civil', 'Criminal', 'Corporate', 'Family', 'Other'],
    default: 'Other'
  },
  extractedData: {
    sections: [String], // e.g., IPC sections
    keyDates: [String],
    extractedEntities: [String]
  },
  urgency: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  caseSummary: {
    type: String,
    default: ''
  },
  referenceCases: [{
    source: String,
    title: String,
    summary: String
  }],
  status: {
    type: String,
    default: 'Intake'
  },
  documents: [{
    fileName: String,
    fileType: String,
    path: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  hearings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hearing'
  }],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Case', caseSchema);
