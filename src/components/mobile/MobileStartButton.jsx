import React, { useCallback } from 'react';
import './MobileStartButton.css';

const MobileStartButton = ({ onClick }) => {
  // Add a callback wrapper for debugging
  const handleClick = useCallback((e) => {
    console.log('Mobile start button clicked!');
    // Prevent any default behavior just to be safe
    e.preventDefault();
    e.stopPropagation();
    // Call the original onClick handler
    if (onClick) onClick();
  }, [onClick]);
  
  return (
    <div className="mobile-start-button-container">
      <button 
        className="mobile-start-button"
        onClick={handleClick}
        // Add touch events explicitly for mobile
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={handleClick}
      >
        Start Dictation
      </button>
    </div>
  );
};

export default MobileStartButton;
