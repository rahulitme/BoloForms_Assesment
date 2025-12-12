import React, { useState } from 'react';

function DateInputModal({ onSubmit, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!date) {
      alert('Please select a date');
      return;
    }
    // Format date nicely
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    onSubmit({ date: formattedDate });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>📅 Select Date</h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          autoFocus
        />
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            Add Date
          </button>
        </div>
      </div>
    </div>
  );
}

export default DateInputModal;
