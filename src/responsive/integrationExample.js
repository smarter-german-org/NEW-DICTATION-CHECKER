/**
 * Example of how to integrate the responsive components
 * 
 * This file is for documentation purposes only and doesn't need to be included in the final build.
 */

import React from 'react';
import { MobileWrapper, useResponsive } from './index';

// Example 1: Using the MobileWrapper component
const ResponsiveComponent = () => {
  return (
    <MobileWrapper 
      stackOnMobile={true} 
      fullWidthOnMobile={true}
      touchTargets={true}
    >
      <div className="some-content">
        This content will be properly styled for mobile devices
      </div>
      <button>This button will have increased touch target size on mobile</button>
    </MobileWrapper>
  );
};

// Example 2: Using the useResponsive hook directly
const ComponentWithResponsiveLogic = () => {
  const { isMobile, isTablet, isTouch } = useResponsive();
  
  // Conditional rendering based on device type
  if (isMobile) {
    return (
      <div className="mobile-layout">
        {/* Simplified mobile layout */}
        <h2>Mobile View</h2>
        <div>Simplified controls for small screens</div>
      </div>
    );
  }
  
  // Full layout for larger screens
  return (
    <div className="desktop-layout">
      <h2>Desktop View</h2>
      <div className="complex-ui">
        <div className="sidebar">Sidebar Navigation</div>
        <div className="main-content">Rich Content Area</div>
      </div>
    </div>
  );
};

// Example 3: Integrating with existing components (DictationTool example)
const EnhanceDictationTool = () => {
  return (
    <div>
      {/* 
      To integrate with DictationTool component:
      
      1. In App.jsx or index.js, import the responsive styles:
         import 'src/responsive/mobileStyles.css';
      
      2. Wrap the DictationTool with MobileWrapper:
      */}
      <MobileWrapper>
        {/* <DictationTool exerciseId={1} /> */}
      </MobileWrapper>
      
      {/*
      3. Or use the hook inside DictationTool.jsx:
      
      import { useResponsive } from 'src/responsive';
      
      const DictationTool = ({ exerciseId = 1 }) => {
        const { isMobile, isTablet } = useResponsive();
        
        // Use the responsive information in the component logic
        const layoutClass = isMobile ? 'mobile-layout' : 'desktop-layout';
        
        return (
          <div className={`dictation-tool ${layoutClass}`}>
            {/* Component content */}
      {/*  </div>
        );
      };
      */}
    </div>
  );
};

// This is just documentation - do not actually export these components
export { ResponsiveComponent, ComponentWithResponsiveLogic, EnhanceDictationTool }; 