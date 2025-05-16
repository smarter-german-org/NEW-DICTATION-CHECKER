import { useEffect, useRef } from 'react';

/**
 * Custom hook to handle swipe gestures on touch devices
 * Supports: swipe left, right, up, down with customizable handlers
 * 
 * @param {Object} options Configuration options
 * @param {Function} options.onSwipeLeft Handler for left swipe
 * @param {Function} options.onSwipeRight Handler for right swipe
 * @param {Function} options.onSwipeUp Handler for up swipe
 * @param {Function} options.onSwipeDown Handler for down swipe
 * @param {number} options.minDistance Minimum distance to trigger swipe (px)
 * @param {number} options.maxTime Maximum time for swipe to be valid (ms)
 * @param {string} options.targetSelector CSS selector for target element
 * @returns {Object} Ref to attach to the element
 */
const useSwipeGestures = ({
  onSwipeLeft = () => {},
  onSwipeRight = () => {},
  onSwipeUp = () => {},
  onSwipeDown = () => {},
  minDistance = 50, // Minimum distance to register as swipe (px)
  maxTime = 300,    // Maximum time for swipe to be valid (ms)
  targetSelector = null // Optional CSS selector for delegation
}) => {
  const elementRef = useRef(null);
  
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;
    
    const handleTouchStart = (e) => {
      // Check if we should delegate to a specific child element
      if (targetSelector) {
        const target = e.target.closest(targetSelector);
        if (!target) return;
      }
      
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchStartTime = new Date().getTime();
    };
    
    const handleTouchEnd = (e) => {
      // Skip if no touch start recorded
      if (touchStartX === 0 && touchStartY === 0) return;
      
      // Check if we're still within time threshold
      const touchEndTime = new Date().getTime();
      const timeDiff = touchEndTime - touchStartTime;
      if (timeDiff > maxTime) {
        resetTouch();
        return;
      }
      
      // Check if touch ended outside target element
      if (targetSelector) {
        const target = e.target.closest(targetSelector);
        if (!target) {
          resetTouch();
          return;
        }
      }
      
      // Calculate distance and determine swipe direction
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const distanceX = touchEndX - touchStartX;
      const distanceY = touchEndY - touchStartY;
      
      const absX = Math.abs(distanceX);
      const absY = Math.abs(distanceY);
      
      // Determine if swipe is horizontal or vertical
      if (absX > absY) {
        // Horizontal swipe
        if (absX >= minDistance) {
          if (distanceX > 0) {
            onSwipeRight(e);
          } else {
            onSwipeLeft(e);
          }
        }
      } else {
        // Vertical swipe
        if (absY >= minDistance) {
          if (distanceY > 0) {
            onSwipeDown(e);
          } else {
            onSwipeUp(e);
          }
        }
      }
      
      resetTouch();
    };
    
    const handleTouchCancel = () => {
      resetTouch();
    };
    
    const resetTouch = () => {
      touchStartX = 0;
      touchStartY = 0;
      touchStartTime = 0;
    };
    
    // Add event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchCancel);
    
    // Clean up
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [
    onSwipeLeft, 
    onSwipeRight, 
    onSwipeUp, 
    onSwipeDown, 
    minDistance, 
    maxTime, 
    targetSelector
  ]);
  
  return elementRef;
};

export default useSwipeGestures; 