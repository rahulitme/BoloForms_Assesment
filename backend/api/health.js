import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
