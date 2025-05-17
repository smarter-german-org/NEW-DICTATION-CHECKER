import React, { useRef, useEffect } from 'react';
import './MobileGestureHandler.css';

export const MobileGestureHandler = ({ children }) => {
  const touchStartRef = useRef(null);
  const lastTouchRef = useRef(null);

  useEffect(() => {
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
        lastTouchRef.current = touchStartRef.current;
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 1) {
        lastTouchRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
      }
    };

    const handleTouchEnd = (e) => {
      if (!touchStartRef.current || !lastTouchRef.current) return;
      const dx = lastTouchRef.current.x - touchStartRef.current.x;
      const dy = lastTouchRef.current.y - touchStartRef.current.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      const minDist = 40; // Minimum px for swipe
      if (absDx < minDist && absDy < minDist) return;
      if (absDx > absDy) {
        // Horizontal swipe
        if (dx < 0) {
          // Left swipe: skip audio back
          window.dispatchEvent(new CustomEvent('mobile-swipe-left'));
        } else {
          // Right swipe: skip audio forward
          window.dispatchEvent(new CustomEvent('mobile-swipe-right'));
        }
      } else {
        // Vertical swipe
        if (dy < 0) {
          // Up swipe: repeat
          window.dispatchEvent(new CustomEvent('mobile-swipe-up'));
        } else {
          // Down swipe: cycle speed
          window.dispatchEvent(new CustomEvent('mobile-swipe-down'));
        }
      }
      touchStartRef.current = null;
      lastTouchRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return <div className="mobile-gesture-handler">{children}</div>;
}; 