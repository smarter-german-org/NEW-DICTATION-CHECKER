import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOBILE_BREAKPOINT } from './constants';

// Create context
export const ResponsiveContext = createContext();

export const ResponsiveProvider = ({ children }) => {
  // Initial state is based on current window width
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );
  
  // Add device type state
  const [deviceType, setDeviceType] = useState({
    isMobile: typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false,
    isTablet: typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches : false,
    isDesktop: typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  });
  
  // Use media query for more reliable detection
  useEffect(() => {
    // Create media query list
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    
    // Set the initial value
    setIsMobile(mediaQuery.matches);
    
    // Define handler for changes
    const handleChange = (e) => {
      setIsMobile(e.matches);
    };
    
    // Add event listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Add this to prevent resetting state on orientation change
  useEffect(() => {
    // Store the current exercise state in sessionStorage when orientation changes
    const handleOrientationChange = () => {
      // Don't reset the app state on orientation change
      // Just update the device type without reloading
      setDeviceType({
        isMobile: window.matchMedia('(max-width: 767px)').matches,
        isTablet: window.matchMedia('(min-width: 768px) and (max-width: 1023px)').matches,
        isDesktop: window.matchMedia('(min-width: 1024px)').matches
      });
    };

    // Add event listener for orientation change
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Also listen for resize events which happen during orientation changes
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);
  
  // Provide the context value
  return (
    <ResponsiveContext.Provider value={{ isMobile, deviceType }}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// Custom hook for using the responsive context
export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
};
