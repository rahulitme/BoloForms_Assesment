const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  originalPdfHash: {
    type: String,
    required: true
  },
  signedPdfHash: {
    type: String,
    required: false
  },
  originalPdfPath: {
    type: String,
    required: true
  },
  signedPdfPath: {
    type: String,
    required: false
  },
  fields: [{
    type: {
      type: String,
      enum: ['signature', 'text', 'image', 'date', 'radio'],
      required: true
    },
    coordinates: {
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      pageNumber: Number
    },
    value: String,
    timestamp: Date
  }],
  status: {
    type: String,
    enum: ['pending', 'signed', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  signedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Document', documentSchema);
