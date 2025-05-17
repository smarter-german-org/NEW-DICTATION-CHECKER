import React, { useState, useEffect } from 'react';
import { useResponsive } from "../../responsive/ResponsiveContext";
import { MobileGestureHandler } from "./MobileGestureHandler";
import DictationToolWithRef from "../DictationToolWithRef.jsx";
import MobileDictationTool from "./MobileDictationTool";
import "./MobileWrapper.css";

export const MobileWrapper = (props) => {
  const { isMobile } = useResponsive();
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const trackExerciseStart = () => {
      setHasStarted(true);
    };
    
    document.addEventListener('exerciseStarted', trackExerciseStart);
    
    return () => {
      document.removeEventListener('exerciseStarted', trackExerciseStart);
    };
  }, []);

  if (!isMobile) {
    return <DictationToolWithRef {...props} isMobile={false} />;
  }

  return (
    <div className="mobile-wrapper">
      <MobileGestureHandler>
        <MobileDictationTool {...props} isMobile={true} />
      </MobileGestureHandler>
    </div>
  );
};