import mongoose from 'mongoose';
import Document from '../../models/Document.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Connect to MongoDB if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.status(200).json({
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
}
