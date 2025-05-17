import React, { useState, useRef, useEffect } from 'react';
import DictationToolWithRef from "../DictationToolWithRef";
import MobileAudioPlayer from './MobileAudioPlayer';
import MobileStartButton from './MobileStartButton';
import './MobileDictationTool.css';

const MobileDictationTool = (props) => {
  const [isStarted, setIsStarted] = useState(false);
  const dictationToolRef = useRef(null);

  // Listen for mobile swipe gestures
  useEffect(() => {
    const handleSwipeLeft = () => {
      if (dictationToolRef.current && isStarted) {
        console.log("[MOBILE] Swipe left detected - going to next sentence");
        // Go to next sentence using goToNextSentence with force=true to bypass validation
        if (dictationToolRef.current.goToNextSentence) {
          dictationToolRef.current.goToNextSentence(true);
        } else {
          // Fallback method
          console.log("[MOBILE] Using fallback next sentence method");
          dictationToolRef.current.handleNextSentence && dictationToolRef.current.handleNextSentence();
        }
      }
    };
    
    const handleSwipeRight = () => {
      if (dictationToolRef.current && isStarted) {
        console.log("[MOBILE] Swipe right detected - going to previous sentence");
        if (dictationToolRef.current.handlePreviousSentence) {
          dictationToolRef.current.handlePreviousSentence();
        }
      }
    };
    
    const handleSwipeUp = () => {
      if (dictationToolRef.current && isStarted) {
        console.log("[MOBILE] Swipe up detected - repeating current sentence");
        if (dictationToolRef.current.playCurrentSentence) {
          dictationToolRef.current.playCurrentSentence();
        }
      }
    };
    
    const handleSwipeDown = () => {
      if (dictationToolRef.current && isStarted) {
        console.log("[MOBILE] Swipe down detected - toggling playback speed");
        // We'll handle this in the audio player, but could add a feature here if needed
      }
    };
    
    window.addEventListener('mobile-swipe-left', handleSwipeLeft);
    window.addEventListener('mobile-swipe-right', handleSwipeRight);
    window.addEventListener('mobile-swipe-up', handleSwipeUp);
    window.addEventListener('mobile-swipe-down', handleSwipeDown);
    
    return () => {
      window.removeEventListener('mobile-swipe-left', handleSwipeLeft);
      window.removeEventListener('mobile-swipe-right', handleSwipeRight);
      window.removeEventListener('mobile-swipe-up', handleSwipeUp);
      window.removeEventListener('mobile-swipe-down', handleSwipeDown);
    };
  }, [isStarted]);

  const handleStartDictation = () => {
    console.log("Start dictation button clicked in MobileDictationTool");
    
    // Set the started state first for immediate UI feedback
    setIsStarted(true);
    
    // Use a small timeout to ensure the state change has been processed
    setTimeout(() => {
      if (dictationToolRef.current && dictationToolRef.current.startExercise) {
        console.log("Calling dictationToolRef.startExercise()");
        dictationToolRef.current.startExercise();
      } else {
        console.error("dictationToolRef or startExercise method is not available");
      }
    }, 100);
  };

  const injectMobileAudioPlayer = () => {
    // This is a way of overriding the default AudioPlayer with our mobile version
    // We're providing this as a prop to the DictationToolWithRef component,
    // which will be passed down to the actual DictationTool
    return {
      component: MobileAudioPlayer,
      additionalProps: {
        // Mobile-specific props that will be passed to the MobileAudioPlayer
      }
    };
  };

  return (
    <div className="mobile-dictation-container">
      {!isStarted ? (
        <div className="mobile-start-screen">
          <h2>Dictation Practice</h2>
          <MobileStartButton onClick={handleStartDictation} />
        </div>
      ) : (
        <DictationToolWithRef 
          {...props}
          ref={dictationToolRef}
          audioPlayerOverride={injectMobileAudioPlayer()}
          isMobile={true}
          hideShortcuts={true}
        />
      )}
    </div>
  );
};

export default MobileDictationTool;
