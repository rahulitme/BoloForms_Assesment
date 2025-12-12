const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const Document = require('./models/Document');
const pdfProcessor = require('./services/pdfProcessor');
const { calculateFileHash, calculateBufferHash } = require('./utils/hashUtils');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));
app.use('/signed', express.static(path.join(__dirname, 'signed')));

// Create necessary directories
const initDirectories = async () => {
  const dirs = ['pdfs', 'signed'];
  for (const dir of dirs) {
    const dirPath = path.join(__dirname, dir);
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ==================== ROUTES ====================

/**
 * POST /api/upload-pdf
 * Upload a PDF and get its hash for audit trail
 */
app.post('/api/upload-pdf', async (req, res) => {
  try {
    const { pdfBase64, fileName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    // Convert base64 to buffer
    const pdfData = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(pdfData, 'base64');

    // Calculate hash of original PDF
    const originalHash = calculateBufferHash(pdfBuffer);

    // Save PDF to disk
    const filename = fileName || `pdf_${Date.now()}.pdf`;
    const filepath = path.join(__dirname, 'pdfs', filename);
    await fs.writeFile(filepath, pdfBuffer);

    // Create document record in MongoDB
    const document = new Document({
      originalPdfHash: originalHash,
      originalPdfPath: filepath,
      status: 'pending'
    });
    await document.save();

    res.json({
      success: true,
      documentId: document._id,
      originalHash: originalHash,
      pdfUrl: `/pdfs/${filename}`
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Failed to upload PDF', details: error.message });
  }
});

/**
 * POST /api/sign-pdf
 * Main endpoint to inject signatures and other fields into PDF
 */
app.post('/api/sign-pdf', async (req, res) => {
  try {
    const { documentId, fields, viewportDimensions } = req.body;

    // Validate input
    if (!documentId || !fields || !viewportDimensions) {
      return res.status(400).json({ 
        error: 'Missing required fields: documentId, fields, and viewportDimensions are required' 
      });
    }

    // Find document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Read original PDF
    const originalPdfBuffer = await fs.readFile(document.originalPdfPath);

    // Process all fields and inject into PDF
    const signedPdfBuffer = await pdfProcessor.processAllFields(
      originalPdfBuffer,
      fields,
      viewportDimensions
    );

    // Calculate hash of signed PDF
    const signedHash = calculateBufferHash(signedPdfBuffer);

    // Save signed PDF
    const signedFilename = `signed_${Date.now()}.pdf`;
    const signedFilepath = path.join(__dirname, 'signed', signedFilename);
    await fs.writeFile(signedFilepath, signedPdfBuffer);

    // Update document record
    document.signedPdfHash = signedHash;
    document.signedPdfPath = signedFilepath;
    document.fields = fields;
    document.status = 'signed';
    document.signedAt = new Date();
    await document.save();

    res.json({
      success: true,
      signedPdfUrl: `/signed/${signedFilename}`,
      originalHash: document.originalPdfHash,
      signedHash: signedHash,
      documentId: document._id,
      auditTrail: {
        originalHash: document.originalPdfHash,
        signedHash: signedHash,
        signedAt: document.signedAt,
        fieldsApplied: fields.length
      }
    });
  } catch (error) {
    console.error('Error signing PDF:', error);
    res.status(500).json({ error: 'Failed to sign PDF', details: error.message });
  }
});

/**
 * GET /api/document/:id
 * Get document details including audit trail
 */
app.get('/api/document/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      documentId: document._id,
      status: document.status,
      originalHash: document.originalPdfHash,
      signedHash: document.signedPdfHash,
      createdAt: document.createdAt,
      signedAt: document.signedAt,
      fieldsCount: document.fields.length
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document', details: error.message });
  }
});

/**
 * GET /api/audit-trail/:id
 * Get complete audit trail for a document
 */
app.get('/api/audit-trail/:id', async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Verify file integrity
    let originalFileHash = null;
    let signedFileHash = null;

    try {
      originalFileHash = await calculateFileHash(document.originalPdfPath);
    } catch (err) {
      console.error('Error reading original file:', err);
    }

    if (document.signedPdfPath) {
      try {
        signedFileHash = await calculateFileHash(document.signedPdfPath);
      } catch (err) {
        console.error('Error reading signed file:', err);
      }
    }

    res.json({
      documentId: document._id,
      auditTrail: {
        originalPdfHash: document.originalPdfHash,
        signedPdfHash: document.signedPdfHash,
        originalFileIntact: originalFileHash === document.originalPdfHash,
        signedFileIntact: signedFileHash === document.signedPdfHash,
        createdAt: document.createdAt,
        signedAt: document.signedAt,
        status: document.status
      },
      fields: document.fields.map(field => ({
        type: field.type,
        timestamp: field.timestamp
      }))
    });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    res.status(500).json({ error: 'Failed to fetch audit trail', details: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;

initDirectories().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 PDF storage ready`);
    console.log(`🔐 Security layer active (SHA-256 hashing)`);
  });
});
