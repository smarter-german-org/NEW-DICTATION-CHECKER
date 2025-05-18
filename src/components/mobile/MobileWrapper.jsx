import React, { useState, useEffect } from 'react';
import { useResponsive } from "../../responsive/ResponsiveContext";
import { MobileGestureHandler } from "./MobileGestureHandler";
import DictationToolWithRef from "../DictationToolWithRef.jsx";
import MobileDictationTool from "./MobileDictationTool";
import { getEmbeddedResources } from '../../utils/embeddedLoader';
import "./MobileWrapper.css";

export const MobileWrapper = ({ embeddedExercise, ...props }) => {
  const { isMobile } = useResponsive();
  const [hasStarted, setHasStarted] = useState(false);
  const { isEmbedded } = getEmbeddedResources();

  useEffect(() => {
    const trackExerciseStart = () => {
      setHasStarted(true);
    };
    
    document.addEventListener('exerciseStarted', trackExerciseStart);
    
    // If we're in embedded mode, add special handling for Teachable environment
    if (isEmbedded) {
      // Notify parent frame (Teachable) that the app is ready
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'DICTATION_APP_READY',
          height: document.documentElement.scrollHeight
        }, '*');
      }
    }
    
    return () => {
      document.removeEventListener('exerciseStarted', trackExerciseStart);
    };
  }, [isEmbedded]);

  // Props to pass to the dictation tool
  const toolProps = {
    ...props,
    customExercise: embeddedExercise // Pass embedded exercise if available
  };

  if (!isMobile) {
    return <DictationToolWithRef {...toolProps} isMobile={false} />;
  }

  return (
    <div className="mobile-wrapper">
      <MobileGestureHandler>
        <MobileDictationTool {...toolProps} isMobile={true} />
      </MobileGestureHandler>
    </div>
  );
};