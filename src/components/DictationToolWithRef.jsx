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
    },

    // Change playback speed
    changePlaybackSpeed: () => {
      if (dictationToolRef.current && dictationToolRef.current.changePlaybackSpeed) {
        dictationToolRef.current.changePlaybackSpeed();
      } else if (dictationToolRef.current && dictationToolRef.current.audioRef && 
                dictationToolRef.current.audioRef.current) {
        const audio = dictationToolRef.current.audioRef.current;
        const currentSpeed = audio.playbackRate;
        if (currentSpeed >= 1.0) audio.playbackRate = 0.75;
        else if (currentSpeed >= 0.75) audio.playbackRate = 0.5;
        else audio.playbackRate = 1.0;
      }
    },

    // Get current speed
    getCurrentSpeed: () => {
      if (dictationToolRef.current && dictationToolRef.current.getCurrentSpeed) {
        return dictationToolRef.current.getCurrentSpeed();
      } else if (dictationToolRef.current && dictationToolRef.current.audioRef && 
                dictationToolRef.current.audioRef.current) {
        const speed = dictationToolRef.current.audioRef.current.playbackRate;
        return Math.round(speed * 100);
      }
      return 100; // Default
    },

    // Get audio element
    getAudioElement: () => {
      if (dictationToolRef.current && dictationToolRef.current.audioRef && 
          dictationToolRef.current.audioRef.current) {
        return dictationToolRef.current.audioRef.current;
      }
      return null;
    }
  }));

  return <DictationTool {...props} ref={dictationToolRef} />;
});

export default DictationToolWithRef;