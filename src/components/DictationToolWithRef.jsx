import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import DictationTool from './DictationTool';

const DictationToolWithRef = forwardRef((props, ref) => {
  const dictationToolRef = useRef(null);
  
  // Expose methods to parent components through ref
  useImperativeHandle(ref, () => ({
    // Start the exercise
    startExercise: () => {
      console.log("startExercise called via ref");
      if (dictationToolRef.current && dictationToolRef.current.startExercise) {
        dictationToolRef.current.startExercise();
      }
    },
    
    // Cancel the exercise
    cancelExercise: () => {
      console.log("cancelExercise called via ref in DictationToolWithRef");
      if (dictationToolRef.current && dictationToolRef.current.cancelExercise) {
        dictationToolRef.current.cancelExercise();
      } else {
        console.error("cancelExercise not available on dictationToolRef");
      }
    },
    
    // Handle navigation - going to next sentence
    goToNextSentence: (force = false) => {
      if (dictationToolRef.current && dictationToolRef.current.goToNextSentence) {
        dictationToolRef.current.goToNextSentence(force);
      }
    },
    
    // Handle navigation - going to previous sentence
    handlePreviousSentence: () => {
      if (dictationToolRef.current && dictationToolRef.current.handlePreviousSentence) {
        dictationToolRef.current.handlePreviousSentence();
      }
    },
    
    // Play the current sentence again
    playCurrentSentence: () => {
      if (dictationToolRef.current && dictationToolRef.current.playCurrentSentence) {
        dictationToolRef.current.playCurrentSentence();
      }
    },
    
    // Basic navigation - next sentence without force
    handleNextSentence: () => {
      if (dictationToolRef.current && dictationToolRef.current.handleNextSentence) {
        dictationToolRef.current.handleNextSentence();
      }
    }
  }));

  return <DictationTool {...props} ref={dictationToolRef} />;
});

export default DictationToolWithRef;