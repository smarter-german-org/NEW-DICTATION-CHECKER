import React, { useState, useEffect } from 'react';
import useResponsive from './useResponsive';
import './mobileStyles.css';

/**
 * A wrapper component that adds mobile responsiveness to children
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.enableTouch - Whether to enable touch-specific optimizations
 * @param {boolean} props.stackOnMobile - Whether to stack children vertically on mobile
 * @param {boolean} props.fullWidthOnMobile - Whether children should be full width on mobile
 * @returns {JSX.Element} Rendered component
 */
const MobileWrapper = ({ 
  children, 
  className = '',
  enableTouch = true,
  stackOnMobile = true,
  fullWidthOnMobile = true,
  hideOnMobile = false,
  touchTargets = false
}) => {
  const { isMobile, isTablet, isTouch } = useResponsive();
  
  // Add viewport meta tag to ensure proper scaling on mobile
  useEffect(() => {
    // Check if viewport meta tag already exists
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    
    // If not, create it
    if (!viewportMeta) {
      viewportMeta = document.createElement('meta');
      viewportMeta.name = 'viewport';
      document.head.appendChild(viewportMeta);
    }
    
    // Set appropriate content attribute
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    
    // Clean up on unmount
    return () => {
      // Don't remove the tag, but reset its content to a more flexible value
      // This way we don't break other components that might expect the tag
      if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0';
      }
    };
  }, []);
  
  // Compile CSS classes based on props and responsive state
  const mobileClasses = [
    className,
    'mobile-container',
    isMobile && stackOnMobile ? 'mobile-stack' : '',
    isMobile && fullWidthOnMobile ? 'mobile-full-width' : '',
    isMobile && hideOnMobile ? 'mobile-hidden' : '',
    isTablet ? 'tablet-container' : '',
    touchTargets && (isMobile || isTouch) ? 'mobile-touch-target' : ''
  ].filter(Boolean).join(' ');
  
  // Enable touch behavior for interactive elements on mobile devices
  const enhanceTouchBehavior = () => {
    if (!enableTouch || !isTouch) return;
    
    // Find all buttons within the wrapper
    const buttons = document.querySelectorAll('button, .button, .control-button, .option-toggle');
    
    // Apply touch-friendly styles
    buttons.forEach(button => {
      button.classList.add('touch-friendly');
    });
  };
  
  // Apply touch enhancements on mount or when isTouch changes
  useEffect(() => {
    if (enableTouch && isTouch) {
      enhanceTouchBehavior();
    }
  }, [enableTouch, isTouch]);
  
  return (
    <div className={mobileClasses}>
      {children}
    </div>
  );
};

export default MobileWrapper; 