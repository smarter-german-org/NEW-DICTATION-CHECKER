/**
 * This file provides utility functions for testing responsive behavior
 * It can be run in the browser console to check device detection and responsive styles
 */

const testResponsiveness = () => {
  console.log('📱 Testing Mobile Responsiveness');
  
  // Check if our responsive module is loaded
  const mobileContainer = document.querySelector('.mobile-container');
  console.log('Mobile container found:', !!mobileContainer);
  
  // Check viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  console.log('Viewport meta tag:', viewportMeta ? viewportMeta.content : 'Not found');
  
  // Check window dimensions
  console.log('Window dimensions:', {
    width: window.innerWidth,
    height: window.innerHeight
  });
  
  // Check if touch is supported
  const isTouchDevice = 
    ('ontouchstart' in window) || 
    (navigator.maxTouchPoints > 0) ||
    (navigator.msMaxTouchPoints > 0);
  console.log('Touch support detected:', isTouchDevice);
  
  // Check media query matches
  const isMobile = window.matchMedia('(max-width: 480px)').matches;
  const isTablet = window.matchMedia('(min-width: 481px) and (max-width: 768px)').matches;
  const isDesktop = window.matchMedia('(min-width: 769px)').matches;
  
  console.log('Device type based on media queries:', {
    isMobile,
    isTablet,
    isDesktop
  });
  
  // Check if our styles are being applied
  if (isMobile) {
    // Check for mobile-specific styles
    console.log('Checking mobile styles...');
    const audioSection = document.querySelector('.dictation-tool .audio-section');
    if (audioSection) {
      const computedStyle = window.getComputedStyle(audioSection);
      console.log('Audio section display flex direction:', computedStyle.flexDirection);
      console.log('Should be "column" on mobile');
    }
  }
  
  // Test touch target sizes
  const buttons = document.querySelectorAll('button, .button, .control-button, .option-toggle');
  if (buttons.length > 0) {
    const firstButton = buttons[0];
    const buttonStyle = window.getComputedStyle(firstButton);
    console.log('Button dimensions:', {
      width: buttonStyle.width,
      height: buttonStyle.height,
      padding: buttonStyle.padding
    });
  }
  
  console.log('📱 Responsive test complete!');
};

// Execute the test
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'complete') {
    testResponsiveness();
  } else {
    window.addEventListener('load', testResponsiveness);
  }
}

export default testResponsiveness; 