import React, { useState, useRef, useEffect } from 'react';
import DictationToolWithRef from "../DictationToolWithRef";
import MobileAudioPlayer from './MobileAudioPlayer';
import './MobileDictationTool.css';

const MobileDictationTool = (props) => {
  const [isStarted, setIsStarted] = useState(false);
  const dictationToolRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    if (isStarted) {
      // Mobile swipe event handling...
    }
  }, [isStarted]);

  const handleStartDictation = () => {
    setIsStarted(true);
    
    setTimeout(() => {
      if (dictationToolRef.current && dictationToolRef.current.startExercise) {
        dictationToolRef.current.startExercise();
      }
    }, 100);
  };

  const handleCancel = () => {
    console.log("MobileDictationTool cancel called"); // Add logging
    
    // Check if we can access the dictationToolRef
    if (dictationToolRef.current) {
      console.log("DictationToolRef available, checking for cancelExercise method");
      
      // Check if the cancelExercise method exists
      if (typeof dictationToolRef.current.cancelExercise === 'function') {
        console.log("Calling cancelExercise method");
        dictationToolRef.current.cancelExercise();
      } else {
        console.error("cancelExercise method not found on dictationToolRef");
        
        // Fallback to props.onCancel if available
        if (props.onCancel) {
          console.log("Falling back to props.onCancel");
          props.onCancel();
        }
      }
    } else {
      console.error("dictationToolRef is not available");
    }
  };

  const injectMobileAudioPlayer = () => {
    return {
      component: MobileAudioPlayer,
      additionalProps: {
        onStartDictation: handleStartDictation,
        onCancel: handleCancel // Make sure this is passed
      }
    };
  };

  // Directly show the DictationTool component with audioPlayerOverride
  return (
    <div className="mobile-dictation-container">
      <DictationToolWithRef 
        {...props}
        ref={dictationToolRef}
        audioPlayerOverride={injectMobileAudioPlayer()}
        isMobile={true}
        hideShortcuts={true}
      />
    </div>
  );
};

export default MobileDictationTool;
