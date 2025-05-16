import React, { useEffect } from 'react';
import { useResponsive } from './index';
import DictationTool from '../components/DictationTool';
import MobileWrapper from './MobileWrapper';
import MobileDictationAdapter from './MobileDictationAdapter';
import './mobileStyles.css';

/**
 * This file provides a template for how to integrate mobile responsiveness at the App level.
 * It's meant as an example - not to replace the existing App.jsx.
 * 
 * To use this:
 * 1. Import the required components in App.jsx
 * 2. Apply the pattern shown here to wrap your existing components
 */

/**
 * AppIntegration component that handles conditional rendering
 * based on device type (mobile vs desktop)
 * 
 * This component serves as the main entry point for the mobile-optimized app
 */
const AppIntegration = ({ exerciseId = 1 }) => {
  // Get responsive environment info
  const { isMobile, isTablet, isTouch } = useResponsive();
  
  // Log the detected device type (for debugging only)
  useEffect(() => {
    console.log('Detected device type:', { isMobile, isTablet, isTouch });
  }, [isMobile, isTablet, isTouch]);
  
  return (
    <div className="app-integration">
      <main className="app-content">
        {isMobile ? (
          // Mobile-specific wrapper with enhanced gesture support
          <MobileWrapper
            stackOnMobile={true}
            fullWidthOnMobile={true}
            enableTouch={true}
            touchTargets={true}
          >
            <MobileDictationAdapter 
              exerciseId={exerciseId}
              useMobileGestures={true}
            />
          </MobileWrapper>
        ) : (
          // Desktop/tablet experience
          <MobileWrapper
            stackOnMobile={false}
            fullWidthOnMobile={isTablet}
            enableTouch={isTouch}
          >
            <DictationTool exerciseId={exerciseId} />
          </MobileWrapper>
        )}
      </main>
    </div>
  );
};

/**
 * To apply this to the actual App.jsx:
 * 
 * 1. import { MobileWrapper } from './responsive';
 * 2. import './responsive/mobileStyles.css';
 * 3. Wrap the <DictationTool> component with <MobileWrapper>
 * 
 * That's it! The mobile styles and behavior will be applied automatically.
 */

export default AppIntegration; 