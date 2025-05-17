import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import DictationTool from './DictationTool';

const DictationToolWithRef = forwardRef((props, ref) => {
  const dictationToolRef = useRef(null);
  
  // Expose methods to parent components through ref
  useImperativeHandle(ref, () => ({
    // Start the exercise
    startExercise: () => {
      if (dictationToolRef.current && dictationToolRef.current.startExercise) {
        dictationToolRef.current.startExercise();
      }
    },
    
    // Cancel the exercise
    cancelExercise: () => {
      console.log("Cancel exercise called via ref");
      if (dictationToolRef.current && dictationToolRef.current.cancelExercise) {
        dictationToolRef.current.cancelExercise();
      }
    },
    
    // Handle navigation - going to next sentence
    goToNextSentence: (skipInput) => {
      if (dictationToolRef.current && dictationToolRef.current.goToNextSentence) {
        dictationToolRef.current.goToNextSentence(skipInput);
      }
    },
    
    // Handle navigation - going to previous sentence
    handlePreviousSentence: () => {
      if (dictationToolRef.current && dictationToolRef.current.handlePreviousSentence) {
        dictationToolRef.current.handlePreviousSentence();
      }
    },
    
    // Play the current sentence again
    repeatCurrentSentence: () => {
      console.log("Repeating current sentence from ref");
      if (dictationToolRef.current && dictationToolRef.current.repeatCurrentSentence) {
        dictationToolRef.current.repeatCurrentSentence();
      } else if (dictationToolRef.current && dictationToolRef.current.audioRef && 
                dictationToolRef.current.audioRef.current) {
        // Fallback if method doesn't exist
        dictationToolRef.current.audioRef.current.currentTime = 0;
        dictationToolRef.current.audioRef.current.play();
      }
    },
    
    // Toggle play/pause
    togglePlayPause: () => {
      console.log("Toggling play/pause from ref");
      if (dictationToolRef.current && dictationToolRef.current.togglePlayPause) {
        dictationToolRef.current.togglePlayPause();
      } else if (dictationToolRef.current && dictationToolRef.current.audioRef && 
                dictationToolRef.current.audioRef.current) {
        // Fallback if method doesn't exist
        const audio = dictationToolRef.current.audioRef.current;
        if (audio.paused) {
          audio.play();
        } else {
          audio.pause();
        }
      }
    },
    
    // Pause audio
    pauseAudio: () => {
      if (dictationToolRef.current && dictationToolRef.current.pauseAudio) {
        dictationToolRef.current.pauseAudio();
      } else if (dictationToolRef.current && dictationToolRef.current.audioRef && 
                dictationToolRef.current.audioRef.current) {
        dictationToolRef.current.audioRef.current.pause();
      }
    }
  }));

  return <DictationTool {...props} ref={dictationToolRef} />;
});

export default DictationToolWithRef;