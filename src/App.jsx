import React, { useState, useEffect } from 'react';
import './App.css';
import DictationTool from './components/DictationTool';
import { MobileWrapper, useResponsive } from './responsive';
import './responsive/mobileStyles.css';
// Import for testing only - can be removed in production
import testResponsiveness from './responsive/responsiveTest';

function App() {
  // Default exercise ID - in the future this would be passed from Teachable
  const defaultExerciseId = 1;
  
  // Run the responsive test once the component mounts (for testing only)
  useEffect(() => {
    // Small delay to ensure everything is rendered
    const timer = setTimeout(() => {
      testResponsiveness();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Get the device type for conditional rendering if needed
  const { isMobile, isTablet, isTouch } = useResponsive();
  
  // Log the detected device type (for testing only)
  useEffect(() => {
    console.log('Detected device type:', { isMobile, isTablet, isTouch });
  }, [isMobile, isTablet, isTouch]);

  return (
    <div className="app">
      <main className="app-content">
        <MobileWrapper
          stackOnMobile={true}
          fullWidthOnMobile={true}
          enableTouch={true}
          touchTargets={true}
        >
          <DictationTool exerciseId={defaultExerciseId} />
        </MobileWrapper>
      </main>
    </div>
  );
}

export default App; 