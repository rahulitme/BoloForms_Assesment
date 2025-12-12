import React, { useState, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { uploadPdf, signPdf, getAuditTrail } from './services/api';
import { normalizeCoordinates, denormalizeCoordinates, getContainerDimensions } from './utils/coordinateUtils';
import SignatureModal from './components/SignatureModal';
import TextInputModal from './components/TextInputModal';
import DateInputModal from './components/DateInputModal';
import ImageInputModal from './components/ImageInputModal';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const FIELD_TYPES = [
  { type: 'signature', label: 'Signature', icon: '✍️' },
  { type: 'text', label: 'Text Box', icon: '📝' },
  { type: 'image', label: 'Image Box', icon: '🖼️' },
  { type: 'date', label: 'Date', icon: '📅' },
  { type: 'radio', label: 'Radio Button', icon: '⭕' }
];

function App() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfBase64, setPdfBase64] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [fields, setFields] = useState([]);
  const [documentId, setDocumentId] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [auditTrail, setAuditTrail] = useState(null);
  
  const pdfContainerRef = useRef(null);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (pdfContainerRef.current) {
        const dims = getContainerDimensions(pdfContainerRef.current);
        setContainerDimensions(dims);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [pdfFile]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      showStatus('Please select a valid PDF file', 'error');
      return;
    }

    setLoading(true);
    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        setPdfBase64(base64);
        setPdfFile(base64);

        // Upload to backend
        const result = await uploadPdf(base64, file.name);
        setDocumentId(result.documentId);
        showStatus('PDF uploaded successfully! Start adding fields.', 'success');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      showStatus('Failed to upload PDF: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    // Update container dimensions after PDF loads
    setTimeout(() => {
      if (pdfContainerRef.current) {
        const dims = getContainerDimensions(pdfContainerRef.current);
        setContainerDimensions(dims);
      }
    }, 100);
  };

  const handleDragStart = (e, fieldType) => {
    e.dataTransfer.setData('fieldType', fieldType);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fieldType = e.dataTransfer.getData('fieldType');
    
    if (!pdfContainerRef.current) return;

    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const defaultSize = {
      signature: { width: 200, height: 60 },
      text: { width: 200, height: 40 },
      image: { width: 150, height: 150 },
      date: { width: 150, height: 40 },
      radio: { width: 30, height: 30 }
    };

    const size = defaultSize[fieldType] || { width: 150, height: 40 };

    const newField = {
      id: Date.now(),
      type: fieldType,
      coordinates: {
        x,
        y,
        width: size.width,
        height: size.height,
        pageNumber: currentPage - 1
      },
      normalizedCoords: normalizeCoordinates(
        { x, y, width: size.width, height: size.height, pageNumber: currentPage - 1 },
        containerDimensions
      )
    };

    setFields([...fields, newField]);

    // Show modal for input if needed
    if (fieldType === 'signature') {
      setSelectedField(newField);
      setModalType('signature');
    } else if (fieldType === 'text') {
      setSelectedField(newField);
      setModalType('text');
    } else if (fieldType === 'date') {
      setSelectedField(newField);
      setModalType('date');
    } else if (fieldType === 'image') {
      setSelectedField(newField);
      setModalType('image');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const updateFieldPosition = (id, newPosition) => {
    setFields(fields.map(field => {
      if (field.id === id) {
        const updatedCoords = {
          x: newPosition.x,
          y: newPosition.y,
          width: newPosition.width,
          height: newPosition.height,
          pageNumber: field.coordinates.pageNumber
        };
        return {
          ...field,
          coordinates: updatedCoords,
          normalizedCoords: normalizeCoordinates(updatedCoords, containerDimensions)
        };
      }
      return field;
    }));
  };

  const deleteField = (id) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleModalSubmit = (data) => {
    if (!selectedField) return;

    setFields(fields.map(field => {
      if (field.id === selectedField.id) {
        return { ...field, ...data };
      }
      return field;
    }));

    setModalType(null);
    setSelectedField(null);
  };

  const handleSignPdf = async () => {
    if (!documentId) {
      showStatus('Please upload a PDF first', 'error');
      return;
    }

    if (fields.length === 0) {
      showStatus('Please add at least one field', 'error');
      return;
    }

    // Check if all fields have data
    const incompleteFields = fields.filter(field => {
      if (field.type === 'signature' && !field.imageBase64) return true;
      if (field.type === 'text' && !field.text) return true;
      if (field.type === 'date' && !field.date) return true;
      if (field.type === 'image' && !field.imageBase64) return true;
      if (field.type === 'radio' && field.selected === undefined) return true;
      return false;
    });

    if (incompleteFields.length > 0) {
      showStatus(`Please fill in all fields (${incompleteFields.length} incomplete)`, 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await signPdf(documentId, fields, containerDimensions);
      
      showStatus('PDF signed successfully!', 'success');
      
      // Get audit trail
      const audit = await getAuditTrail(documentId);
      setAuditTrail(audit);

      // Open signed PDF in new tab
      const signedUrl = `http://localhost:5000${result.signedPdfUrl}`;
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Sign error:', error);
      showStatus('Failed to sign PDF: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (message, type) => {
    setStatus({ message, type });
    setTimeout(() => setStatus(null), 5000);
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h1>BoloForms</h1>
          <p>Signature Injection Engine</p>
        </div>

        <div className="field-palette">
          <h3>Drag Fields to PDF</h3>
          {FIELD_TYPES.map(field => (
            <div
              key={field.type}
              className="draggable-field"
              draggable
              onDragStart={(e) => handleDragStart(e, field.type)}
            >
              <span className="field-icon">{field.icon}</span>
              {field.label}
            </div>
          ))}
        </div>

        <div className="sidebar-actions">
          {fields.length > 0 && (
            <div style={{ marginBottom: '10px', fontSize: '12px', color: '#666' }}>
              {fields.length} field(s) added
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSignPdf}
            disabled={loading || !documentId || fields.length === 0}
          >
            {loading ? <span className="loading"></span> : 'Sign PDF'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => setFields([])}
            disabled={fields.length === 0}
          >
            Clear All Fields
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="toolbar">
          <div className="toolbar-left">
            <label className="upload-label">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              📄 Upload PDF
            </label>
            {pdfFile && (
              <span style={{ fontSize: '14px', color: '#666' }}>
                Page {currentPage} of {numPages}
              </span>
            )}
          </div>

          <div className="toolbar-right">
            <div className="zoom-controls">
              <button className="zoom-btn" onClick={() => handleZoom(-0.1)}>−</button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button className="zoom-btn" onClick={() => handleZoom(0.1)}>+</button>
            </div>
          </div>
        </div>

        {status && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}

        <div className="pdf-viewer-container">
          {pdfFile ? (
            <div
              ref={pdfContainerRef}
              className="pdf-canvas-wrapper"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              <Document
                file={pdfFile}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div>Loading PDF...</div>}
              >
                <Page
                  pageNumber={currentPage}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />
              </Document>

              {/* Render fields */}
              {fields.map(field => (
                field.coordinates.pageNumber === currentPage - 1 && (
                  <Rnd
                    key={field.id}
                    position={{ x: field.coordinates.x, y: field.coordinates.y }}
                    size={{ width: field.coordinates.width, height: field.coordinates.height }}
                    onDragStop={(e, d) => {
                      updateFieldPosition(field.id, {
                        x: d.x,
                        y: d.y,
                        width: field.coordinates.width,
                        height: field.coordinates.height
                      });
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      updateFieldPosition(field.id, {
                        ...position,
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height)
                      });
                    }}
                    bounds="parent"
                    className="field-box"
                  >
                    <div style={{ width: '100%', height: '100%', pointerEvents: 'none' }}>
                      {field.type === 'signature' && (field.imageBase64 ? '✅ Signed' : '✍️ Sign')}
                      {field.type === 'text' && (field.text || '📝 Text')}
                      {field.type === 'image' && (field.imageBase64 ? '✅ Image' : '🖼️ Image')}
                      {field.type === 'date' && (field.date || '📅 Date')}
                      {field.type === 'radio' && '⭕'}
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => deleteField(field.id)}
                      style={{ pointerEvents: 'auto' }}
                    >
                      ×
                    </button>
                  </Rnd>
                )
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '100px', color: '#999' }}>
              <h2>Upload a PDF to get started</h2>
              <p>Click "Upload PDF" button to begin</p>
            </div>
          )}
        </div>

        {/* Audit Trail */}
        {auditTrail && (
          <div className="audit-trail">
            <h3>🔐 Audit Trail</h3>
            <div className="audit-item">
              <strong>Document ID:</strong> {auditTrail.documentId}
            </div>
            <div className="audit-item">
              <strong>Original PDF Hash:</strong>
              <div className="hash-value">{auditTrail.auditTrail.originalPdfHash}</div>
            </div>
            <div className="audit-item">
              <strong>Signed PDF Hash:</strong>
              <div className="hash-value">{auditTrail.auditTrail.signedPdfHash}</div>
            </div>
            <div className="audit-item">
              <strong>Status:</strong> {auditTrail.auditTrail.status}
            </div>
            <div className="audit-item">
              <strong>Files Intact:</strong>{' '}
              {auditTrail.auditTrail.originalFileIntact && auditTrail.auditTrail.signedFileIntact
                ? '✅ Verified'
                : '⚠️ Warning'}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modalType === 'signature' && (
        <SignatureModal
          onSubmit={handleModalSubmit}
          onClose={() => {
            setModalType(null);
            setSelectedField(null);
          }}
        />
      )}

      {modalType === 'text' && (
        <TextInputModal
          onSubmit={handleModalSubmit}
          onClose={() => {
            setModalType(null);
            setSelectedField(null);
          }}
        />
      )}

      {modalType === 'date' && (
        <DateInputModal
          onSubmit={handleModalSubmit}
          onClose={() => {
            setModalType(null);
            setSelectedField(null);
          }}
        />
      )}

      {modalType === 'image' && (
        <ImageInputModal
          onSubmit={handleModalSubmit}
          onClose={() => {
            setModalType(null);
            setSelectedField(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
