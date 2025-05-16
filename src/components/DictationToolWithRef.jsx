import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import DictationTool from './DictationTool';

/**
 * Forward ref wrapper for DictationTool that exposes key methods
 * for use by the MobileDictationAdapter
 */
const DictationToolWithRef = forwardRef((props, ref) => {
  const dictationToolRef = useRef(null);
  
  // Expose necessary methods to parent components
  useImperativeHandle(ref, () => ({
    // Navigation methods
    handlePreviousSentence: () => {
      // Find the previous sentence button and click it
      const prevButton = document.querySelector('.audio-player .prev-button');
      if (prevButton) prevButton.click();
    },
    
    handleNextSentence: () => {
      // Find the next sentence button and click it
      const nextButton = document.querySelector('.audio-player .next-button');
      if (nextButton) nextButton.click();
    },
    
    repeatCurrentSentence: () => {
      // Find the play button and click it twice to restart
      const playButton = document.querySelector('.audio-player .play-button');
      if (playButton) {
        playButton.click(); // Pause
        setTimeout(() => playButton.click(), 50); // Play again
      }
    },
    
    // Toggle play/pause
    togglePlay: () => {
      // Find the play button and click it
      const playButton = document.querySelector('.audio-player .play-button');
      
      // Try direct audio control first
      const audio = document.querySelector('audio');
      if (audio && playButton) {
        const isCurrentlyPlaying = !audio.paused;
        
        if (isCurrentlyPlaying) {
          audio.pause();
        } else {
          // Add error handling for audio play
          audio.play().catch(err => {
            console.error("Audio playback error:", err);
          });
        }
        
        // Also click the button to ensure UI is synced
        playButton.click();
        return;
      }
      
      // Fallback to just clicking the button
      if (playButton) {
        playButton.click();
      }
    },
    
    // Input handling
    handleInputChange: (e) => {
      // Find the input and set its value
      const input = document.querySelector('.dictation-input');
      if (input) {
        // Create a synthetic input event
        const event = new Event('input', { bubbles: true });
        input.value = e.target.value;
        input.dispatchEvent(event);
      }
    },
    
    submitInput: () => {
      // Find the input and trigger an enter key event
      const input = document.querySelector('.dictation-input');
      if (input) {
        const event = new KeyboardEvent('keydown', {
          key: 'Enter',
          code: 'Enter',
          keyCode: 13,
          which: 13,
          bubbles: true
        });
        input.dispatchEvent(event);
      }
    },
    
    // Playback control
    setPlaybackSpeed: (speed) => {
      // Find the speed button and check its current state
      const speedButton = document.querySelector('.playback-speed-button');
      if (!speedButton) return;
      
      // Parse current speed from button text
      const currentText = speedButton.textContent;
      let currentSpeed = 1.0;
      if (currentText.includes('75%')) currentSpeed = 0.75;
      else if (currentText.includes('50%')) currentSpeed = 0.5;
      
      // Click the button until we reach the desired speed
      while (currentSpeed !== speed) {
        speedButton.click();
        if (currentSpeed === 1.0) currentSpeed = 0.75;
        else if (currentSpeed === 0.75) currentSpeed = 0.5;
        else currentSpeed = 1.0;
      }
    },
    
    // End dictation
    handleEndDictation: () => {
      // Find the cancel button and click it
      const cancelButton = document.querySelector('.audio-player .cancel-button');
      if (cancelButton) cancelButton.click();
    }
  }));
  
  return (
    <DictationTool 
      ref={dictationToolRef} 
      {...props} 
    />
  );
});

DictationToolWithRef.displayName = 'DictationToolWithRef';

export default DictationToolWithRef; 