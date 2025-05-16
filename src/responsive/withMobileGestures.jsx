import React from 'react';
import MobileGestureInput from './MobileGestureInput';
import { useResponsive } from './index';

/**
 * Higher-order component that adds mobile gesture support to input components
 * 
 * @param {React.Component} Component The component to wrap
 * @returns {React.Component} Enhanced component with mobile gesture support
 */
const withMobileGestures = (Component) => {
  // Return a new component that includes mobile gesture support
  return function WithMobileGesturesComponent(props) {
    const { isMobile, isTouch } = useResponsive();
    
    // Only apply mobile gestures when on mobile devices or explicitly requested
    const shouldUseGestures = isMobile || props.useMobileGestures;
    
    // If not mobile, just render the original component
    if (!shouldUseGestures) {
      return <Component {...props} />;
    }
    
    // Otherwise, wrap with MobileGestureInput to add gesture support
    return (
      <Component 
        {...props} 
        renderInput={(inputProps) => (
          <MobileGestureInput
            value={inputProps.value}
            onChange={inputProps.onChange}
            expectedText={inputProps.expectedText}
            onPrevious={inputProps.onPrevious}
            onNext={inputProps.onNext}
            onRepeat={inputProps.onRepeat}
            onSpeedChange={inputProps.onSpeedChange}
            onSubmit={inputProps.onSubmit}
            disabled={inputProps.disabled}
            checkCapitalization={inputProps.checkCapitalization}
          />
        )}
      />
    );
  };
};

export default withMobileGestures; 