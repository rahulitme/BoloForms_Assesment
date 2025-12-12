import React, { useState } from 'react';

function TextInputModal({ onSubmit, onClose }) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim()) {
      alert('Please enter some text');
      return;
    }
    onSubmit({ text });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>📝 Enter Text</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your text here..."
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Add Text
          </button>
        </div>
      </div>
    </div>
  );
}

export default TextInputModal;
