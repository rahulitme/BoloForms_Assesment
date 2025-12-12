import axios from 'axios';

// For Vercel: API_BASE_URL should point to backend Vercel project /api routes
// For local dev: http://localhost:5000/api
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const uploadPdf = async (pdfBase64, fileName) => {
  const response = await api.post('/upload-pdf', {
    pdfBase64,
    fileName
  });
  return response.data;
};

export const signPdf = async (documentId, fields, viewportDimensions) => {
  const response = await api.post('/sign-pdf', {
    documentId,
    fields,
    viewportDimensions
  });
  return response.data;
};

export const getDocument = async (documentId) => {
  const response = await api.get(`/document/${documentId}`);
  return response.data;
};

export const getAuditTrail = async (documentId) => {
  const response = await api.get(`/audit-trail/${documentId}`);
  return response.data;
};

export default api;
