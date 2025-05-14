import React from 'react';
import './ConfirmDialog.css';

const ConfirmDialog = ({ 
  isOpen, 
  title = 'Confirm Action', 
  message = 'Are you sure?', 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  onConfirm, 
  onCancel
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="confirm-dialog-overlay">
      <div className="confirm-dialog">
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        
        <div className="confirm-dialog-buttons">
          <button 
            className="confirm-dialog-button confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
          <button 
            className="confirm-dialog-button cancel" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 