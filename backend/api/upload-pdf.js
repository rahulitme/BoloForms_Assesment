import mongoose from 'mongoose';
import { calculateBufferHash } from '../utils/hashUtils.js';
import Document from '../models/Document.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pdfBase64, fileName } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ error: 'No PDF data provided' });
    }

    const pdfData = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(pdfData, 'base64');
    const originalHash = calculateBufferHash(pdfBuffer);

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const document = new Document({
      originalPdfHash: originalHash,
      originalPdfPath: fileName || `pdf_${Date.now()}.pdf`,
      status: 'pending'
    });
    await document.save();

    res.status(200).json({
      success: true,
      documentId: document._id,
      originalHash: originalHash,
      message: 'PDF uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Failed to upload PDF', details: error.message });
  }
}
