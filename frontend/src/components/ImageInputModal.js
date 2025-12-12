import React, { useState } from 'react';

function ImageInputModal({ onSubmit, onClose }) {
  const [imageBase64, setImageBase64] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      setImageBase64(base64);
      setPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!imageBase64) {
      alert('Please select an image');
      return;
    }
    onSubmit({ imageBase64 });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>🖼️ Upload Image</h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ marginBottom: '15px' }}
        />
        {preview && (
          <div style={{ marginBottom: '15px', textAlign: 'center' }}>
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
        )}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={!imageBase64}>
            Add Image
          </button>
        </div>
      </div>
    </div>
  );
}

export default ImageInputModal;
