import { useState, useEffect } from 'react';

// Breakpoints in pixels
const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  largeDesktop: 1280
};

/**
 * Custom hook that provides responsive design utilities
 * 
 * @returns {Object} Object containing responsive utilities and information
 */
const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });
  
  const [deviceType, setDeviceType] = useState('desktop');
  
  // Handler to call on window resize
  const handleResize = () => {
    // Update window size
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    // Update device type based on window width
    if (window.innerWidth <= breakpoints.mobile) {
      setDeviceType('mobile');
    } else if (window.innerWidth <= breakpoints.tablet) {
      setDeviceType('tablet');
    } else if (window.innerWidth <= breakpoints.desktop) {
      setDeviceType('desktop');
    } else {
      setDeviceType('largeDesktop');
    }
  };
  
  // Set up event listener
  useEffect(() => {
    // Only add listener if window exists (client-side)
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      // Call handler right away so state gets updated with initial window size
      handleResize();
      
      // Remove event listener on cleanup
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []); // Empty array ensures effect runs only on mount and unmount
  
  // Convenience methods for checking device type
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop' || deviceType === 'largeDesktop';
  const isTouchDevice = isMobile || isTablet;
  
  // Determine if the device supports touch
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    // Check if device supports touch
    const touchSupported = 
      ('ontouchstart' in window) || 
      (window.DocumentTouch && document instanceof DocumentTouch) ||
      navigator.maxTouchPoints > 0;
    setIsTouch(touchSupported);
  }, []);
  
  return {
    windowSize,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isTouch,
    breakpoints
  };
};

export default useResponsive; 