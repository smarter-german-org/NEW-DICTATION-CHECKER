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

  // Direct cancel handler that doesn't rely on the ref
  const handleDirectCancel = () => {
    console.log("Direct cancel handler in MobileDictationTool");
    // Use the props.onCancel if available
    if (props.onCancel && typeof props.onCancel === 'function') {
      console.log("Calling props.onCancel directly");
      props.onCancel();
      return;
    }
    
    // Otherwise try to use the ref
    if (dictationToolRef.current && dictationToolRef.current.cancelExercise) {
      console.log("Calling cancelExercise on dictationToolRef");
      dictationToolRef.current.cancelExercise();
    } else {
      console.error("No cancel method available");
    }
  };

  const injectMobileAudioPlayer = () => {
    return {
      component: MobileAudioPlayer,
      additionalProps: {
        onStartDictation: handleStartDictation,
        onCancel: handleDirectCancel // Use the direct handler
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
