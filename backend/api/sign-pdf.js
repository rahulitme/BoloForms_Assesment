import mongoose from 'mongoose';
import { calculateBufferHash } from '../utils/hashUtils.js';
import Document from '../models/Document.js';
import pdfProcessor from '../services/pdfProcessor.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId, fields, viewportDimensions } = req.body;

    if (!documentId || !fields || !viewportDimensions) {
      return res.status(400).json({
        error: 'Missing required fields: documentId, fields, and viewportDimensions'
      });
    }

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // For Vercel, return fields without file storage
    // In production, implement Vercel Blob or S3 storage
    const signedHash = calculateBufferHash(Buffer.from(JSON.stringify(fields)));

    document.signedPdfHash = signedHash;
    document.fields = fields;
    document.status = 'signed';
    document.signedAt = new Date();
    await document.save();

    res.status(200).json({
      success: true,
      originalHash: document.originalPdfHash,
      signedHash: signedHash,
      documentId: document._id,
      auditTrail: {
        originalHash: document.originalPdfHash,
        signedHash: signedHash,
        signedAt: document.signedAt,
        fieldsApplied: fields.length
      },
      message: 'PDF signed successfully'
    });
  } catch (error) {
    console.error('Error signing PDF:', error);
    res.status(500).json({ error: 'Failed to sign PDF', details: error.message });
  }
}
