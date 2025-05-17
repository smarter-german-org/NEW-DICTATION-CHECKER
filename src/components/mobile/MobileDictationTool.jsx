import React, { useState, useRef, useEffect } from 'react';
import DictationToolWithRef from "../DictationToolWithRef";
import MobileAudioPlayer from './MobileAudioPlayer';

// Inline styles
const styles = {
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    width: '100vw',
    height: '100vh',
    touchAction: 'none',
    backgroundColor: '#000'
  },
  content: {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '100vw',
    maxHeight: '100vh'
  },
  indicators: {
    position: 'fixed',
    bottom: '20px',
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    pointerEvents: 'none'
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    margin: '0 10px',
    padding: '8px 12px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: '20px',
    color: 'white'
  },
  icon: {
    marginRight: '8px',
    fontSize: '18px'
  },
  feedback: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '10px',
    zIndex: 1000,
    opacity: 1,
    pointerEvents: 'none'
  }
};

const MobileDictationTool = (props) => {
  const [isStarted, setIsStarted] = useState(false);
  const [swipeFeedback, setSwipeFeedback] = useState(null);
  const dictationToolRef = useRef(null);
  const containerRef = useRef(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const minSwipeDistance = 50;
  const swipeFeedbackTimeoutRef = useRef(null);

  // Function to show swipe feedback
  const showSwipeFeedback = (message) => {
    setSwipeFeedback(message);
    if (swipeFeedbackTimeoutRef.current) {
      clearTimeout(swipeFeedbackTimeoutRef.current);
    }
    swipeFeedbackTimeoutRef.current = setTimeout(() => {
      setSwipeFeedback(null);
    }, 1500); // Hide after 1.5 seconds
  };

  // Prevent default touchmove behavior on container to stop scrolling
  useEffect(() => {
    const container = containerRef.current;
    
    const preventDefaultScroll = (e) => {
      // Always prevent default scroll behavior except for textarea
      let target = e.target;
      while (target && target !== document) {
        if (target.tagName && target.tagName.toLowerCase() === 'textarea') {
          return; // Allow scrolling in textareas
        }
        target = target.parentNode;
      }
      e.preventDefault();
    };
    
    if (container) {
      container.addEventListener('touchmove', preventDefaultScroll, { passive: false });
      document.body.addEventListener('touchmove', preventDefaultScroll, { passive: false });
      
      // Also prevent scrolling on body
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }
    
    return () => {
      if (container) {
        container.removeEventListener('touchmove', preventDefaultScroll);
        document.body.removeEventListener('touchmove', preventDefaultScroll);
        
        // Restore scrolling
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
      }
    };
  }, []);

  // Set up handlers for the dictation tool
  const handleStartDictation = () => {
    if (dictationToolRef.current && dictationToolRef.current.startExercise) {
      dictationToolRef.current.startExercise();
      setIsStarted(true);
    }
  };

  // Handle direct cancel action
  const handleDirectCancel = () => {
    console.log("Direct cancel handler in MobileDictationTool");
    if (dictationToolRef.current && dictationToolRef.current.cancelExercise) {
      console.log("Calling cancelExercise on dictationToolRef");
      dictationToolRef.current.cancelExercise();
    }
  };
  
  // Add swipe gesture handling - works in both orientations
  useEffect(() => {
    const container = containerRef.current;
    
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    
    // Fix swipe directions (right/left were exchanged)
    const handleTouchEnd = (e) => {
      if (!e.changedTouches || !e.changedTouches[0]) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;
      
      // Check if this is a swipe on a textarea
      let target = e.target;
      let isTextarea = false;
      while (target && target !== document) {
        if (target.tagName && target.tagName.toLowerCase() === 'textarea') {
          isTextarea = true;
          break;
        }
        if (!target.parentNode) break;
        target = target.parentNode;
      }
      
      // Only handle swipes outside of textarea
      if (!isTextarea) {
        // Horizontal swipe detection
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > minSwipeDistance) {
          console.log("Horizontal swipe detected:", deltaX > 0 ? "right" : "left");
          
          if (deltaX > 0) {
            // Swipe right (finger moves right) - Next sentence (FIX: WAS PREVIOUS)
            console.log("Swipe right - next sentence");
            if (dictationToolRef.current && typeof dictationToolRef.current.goToNextSentence === 'function') {
              dictationToolRef.current.goToNextSentence(true);
              showSwipeFeedback("Next sentence");
              
              // Pause audio after navigation
              if (dictationToolRef.current.pauseAudio) {
                dictationToolRef.current.pauseAudio();
              }
            }
          } else {
            // Swipe left (finger moves left) - Previous sentence (FIX: WAS NEXT)
            console.log("Swipe left - previous sentence");
            if (dictationToolRef.current && typeof dictationToolRef.current.handlePreviousSentence === 'function') {
              dictationToolRef.current.handlePreviousSentence();
              showSwipeFeedback("Previous sentence");
              
              // Pause audio after navigation
              if (dictationToolRef.current.pauseAudio) {
                dictationToolRef.current.pauseAudio();
              }
            }
          }
        }
        
        // Vertical swipe detection
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5 && Math.abs(deltaY) > minSwipeDistance) {
          console.log("Vertical swipe detected:", deltaY > 0 ? "down" : "up");
          
          if (deltaY < 0) {
            // Swipe up (finger moves up) - should repeat current sentence
            console.log("Swipe up - repeat sentence");
            if (dictationToolRef.current) {
              // Log what methods are available on the ref
              console.log("Available methods:", Object.keys(dictationToolRef.current));
              
              // Try to call repeatCurrentSentence with better error handling
              try {
                if (typeof dictationToolRef.current.repeatCurrentSentence === 'function') {
                  dictationToolRef.current.repeatCurrentSentence();
                  showSwipeFeedback("Repeat sentence");
                } else if (typeof dictationToolRef.current.audioRef?.current?.play === 'function') {
                  // Direct fallback to audio element
                  const audio = dictationToolRef.current.audioRef.current;
                  audio.currentTime = 0;
                  audio.play();
                  showSwipeFeedback("Repeat sentence");
                } else {
                  console.error("No repeat function available");
                }
              } catch (err) {
                console.error("Error repeating sentence:", err);
              }
            }
          } else {
            // Swipe down (finger moves down) - change playback speed
            console.log("Swipe down - change playback speed");
            if (dictationToolRef.current) {
              try {
                // Directly find the audio element in the DOM for most reliable access
                const audioElement = document.querySelector('audio');
                
                if (audioElement) {
                  // Get the current playback rate
                  const currentSpeed = audioElement.playbackRate;
                  console.log("Current audio speed:", currentSpeed);
                  let newSpeed;
                  
                  // Cycle through speeds with very clear thresholds
                  if (Math.abs(currentSpeed - 1.0) < 0.1) { // Very close to 1.0
                    newSpeed = 0.75;
                    showSwipeFeedback("Speed: 75%");
                  } else if (Math.abs(currentSpeed - 0.75) < 0.1) { // Very close to 0.75
                    newSpeed = 0.5;
                    showSwipeFeedback("Speed: 50%");
                  } else {
                    newSpeed = 1.0;
                    showSwipeFeedback("Speed: 100%");
                  }
                  
                  console.log("Setting new speed to:", newSpeed);
                  
                  // Apply the new speed directly to the audio element
                  audioElement.playbackRate = newSpeed;
                  
                  // For debugging - verify the speed was actually changed
                  setTimeout(() => {
                    console.log("Speed after change:", audioElement.playbackRate);
                  }, 100);
                  
                  // Also try to set the speed using the method from the ref
                  if (typeof dictationToolRef.current.changePlaybackSpeed === 'function') {
                    dictationToolRef.current.changePlaybackSpeed(newSpeed);
                  }
                  
                  // Force a redraw/update by touching the DOM
                  audioElement.volume = audioElement.volume;
                } else {
                  console.error("No audio element found in the DOM");
                  
                  // Fallback to using the component method
                  if (typeof dictationToolRef.current.changePlaybackSpeed === 'function') {
                    dictationToolRef.current.changePlaybackSpeed();
                    
                    // Try to get the speed for display
                    if (dictationToolRef.current.getCurrentSpeed) {
                      const speed = dictationToolRef.current.getCurrentSpeed();
                      showSwipeFeedback("Speed: " + speed + "%");
                    } else {
                      showSwipeFeedback("Speed changed");
                    }
                  }
                }
              } catch (err) {
                console.error("Error changing playback speed:", err);
              }
            }
          }
        }
      }
    };
    
    if (container) {
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, []); // Always active, not just when isStarted

  // Override the audio player with mobile version
  const injectMobileAudioPlayer = () => {
    return {
      component: MobileAudioPlayer,
      additionalProps: {
        onStartDictation: handleStartDictation,
        onCancel: handleDirectCancel
      }
    };
  };

  return (
    <div className="mobile-dictation-container" ref={containerRef} style={styles.container}>
      <div className="mobile-dictation-content" style={styles.content}>
        <DictationToolWithRef 
          {...props}
          ref={dictationToolRef}
          audioPlayerOverride={injectMobileAudioPlayer()}
          isMobile={true}
          hideShortcuts={true}
        />
      </div>
      
      {/* Swipe indicators at the bottom */}
      <div style={styles.indicators}>
        <div style={styles.indicator}>
          <span style={styles.icon}>←</span>
          <span>Previous</span>
        </div>
        <div style={styles.indicator}>
          <span style={styles.icon}>→</span>
          <span>Next</span>
        </div>
        <div style={styles.indicator}>
          <span style={styles.icon}>↑</span>
          <span>Repeat</span>
        </div>
        <div style={styles.indicator}>
          <span style={styles.icon}>↓</span>
          <span>Speed</span>
        </div>
      </div>
      
      {swipeFeedback && (
        <div style={styles.feedback}>
          {swipeFeedback}
        </div>
      )}
    </div>
  );
};

export default MobileDictationTool;
