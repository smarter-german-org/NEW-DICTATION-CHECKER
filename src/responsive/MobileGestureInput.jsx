import React, { useState, useRef, useEffect } from 'react';
import useSwipeGestures from './useSwipeGestures';
import './mobileStyles.css';

/**
 * Mobile-optimized input component with gesture controls and unified display
 * 
 * Supported gestures:
 * - Swipe left: Previous sentence
 * - Swipe right: Next sentence
 * - Swipe up: Repeat sentence
 * - Swipe down: Toggle playback speed
 * 
 * @param {Object} props Component props
 * @param {string} props.value Current input value
 * @param {Function} props.onChange Handler for input changes
 * @param {string} props.expectedText Expected text for comparison
 * @param {Function} props.onPrevious Handler for previous sentence
 * @param {Function} props.onNext Handler for next sentence 
 * @param {Function} props.onRepeat Handler for repeat sentence
 * @param {Function} props.onSpeedChange Handler for speed change
 * @param {Function} props.onSubmit Handler for submitting input
 * @param {boolean} props.disabled Whether input is disabled
 * @param {boolean} props.checkCapitalization Whether to check capitalization
 * @param {boolean} props.isPlaying Whether audio is currently playing
 * @param {Function} props.onTogglePlay Handler for play/pause toggle
 * @param {number} props.progressPercent Current audio progress percentage
 * @param {Function} props.onEndDictation Handler for ending dictation
 * @param {boolean} props.hasAudioError Whether there was an audio error
 */
const MobileGestureInput = ({
  value = '',
  onChange,
  expectedText = '',
  onPrevious,
  onNext,
  onRepeat,
  onSpeedChange,
  onSubmit,
  disabled = false,
  checkCapitalization = false,
  isPlaying = false,
  onTogglePlay = () => {},
  progressPercent = 0,
  onEndDictation = () => {},
  hasAudioError = false
}) => {
  const [showFeedback, setShowFeedback] = useState(true);
  const [showGestureHint, setShowGestureHint] = useState(true);
  const [lastGesture, setLastGesture] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [gestureActive, setGestureActive] = useState(false);
  const [audioReachedEnd, setAudioReachedEnd] = useState(false);
  const [playButtonState, setPlayButtonState] = useState('play'); // 'play', 'pause', 'next'
  
  const inputRef = useRef(null);
  
  // Check if audio has reached the end of current sentence - using ended event
  useEffect(() => {
    const audioElement = document.querySelector('audio');
    if (!audioElement) return;
    
    const handleAudioEnded = () => {
      setAudioReachedEnd(true);
      setPlayButtonState('next');
    };
    
    // Use ended event instead of timeupdate for more reliability
    audioElement.addEventListener('ended', handleAudioEnded);
    
    // Also handle pause event to update UI state
    const handlePause = () => {
      if (audioElement.currentTime >= audioElement.duration - 0.1) {
        setAudioReachedEnd(true);
        setPlayButtonState('next');
      } else {
        setPlayButtonState('play');
      }
    };
    
    audioElement.addEventListener('pause', handlePause);
    
    // Update state when play starts
    const handlePlay = () => {
      setPlayButtonState('pause');
      setAudioReachedEnd(false);
    };
    
    audioElement.addEventListener('play', handlePlay);
    
    // Reset on seeking (for repeat functionality)
    const handleSeeking = () => {
      if (audioElement.currentTime < 0.1) {
        setAudioReachedEnd(false);
        if (!audioElement.paused) {
          setPlayButtonState('pause');
        } else {
          setPlayButtonState('play');
        }
      }
    };
    
    // Directly check the current state on mount
    if (!audioElement.paused) {
      setPlayButtonState('pause');
    } else if (audioElement.currentTime >= audioElement.duration - 0.1) {
      setPlayButtonState('next');
    } else {
      setPlayButtonState('play');
    }
    
    audioElement.addEventListener('seeking', handleSeeking);
    
    // Set up a periodic check to ensure UI state matches actual audio state
    const syncInterval = setInterval(() => {
      if (!audioElement) return;
      
      const isPaused = audioElement.paused;
      const isAtEnd = audioElement.currentTime >= audioElement.duration - 0.1;
      
      if (!isPaused && playButtonState !== 'pause') {
        setPlayButtonState('pause');
      } else if (isPaused && isAtEnd && playButtonState !== 'next') {
        setPlayButtonState('next');
      } else if (isPaused && !isAtEnd && playButtonState !== 'play') {
        setPlayButtonState('play');
      }
    }, 100);
    
    return () => {
      audioElement.removeEventListener('ended', handleAudioEnded);
      audioElement.removeEventListener('pause', handlePause);
      audioElement.removeEventListener('play', handlePlay);
      audioElement.removeEventListener('seeking', handleSeeking);
      clearInterval(syncInterval);
    };
  }, [playButtonState]);
  
  // Close gesture hint after a few seconds
  useEffect(() => {
    if (showGestureHint) {
      const timer = setTimeout(() => {
        setShowGestureHint(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [showGestureHint]);
  
  // Show gesture feedback briefly
  useEffect(() => {
    if (lastGesture) {
      setGestureActive(true);
      const timer = setTimeout(() => {
        setGestureActive(false);
        setLastGesture(null);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [lastGesture]);
  
  // Handle swipe gestures
  const containerRef = useSwipeGestures({
    onSwipeLeft: () => {
      if (onPrevious && !disabled) {
        onPrevious();
        setLastGesture('previous');
      }
    },
    onSwipeRight: () => {
      if (onNext && !disabled) {
        onNext();
        setLastGesture('next');
      }
    },
    onSwipeUp: () => {
      if (onRepeat && !disabled) {
        onRepeat();
        setLastGesture('repeat');
      }
    },
    onSwipeDown: () => {
      if (onSpeedChange && !disabled) {
        // Cycle through speeds: 1.0 -> 0.75 -> 0.5 -> 1.0
        const newSpeed = playbackSpeed === 1.0 ? 0.75 :
                         playbackSpeed === 0.75 ? 0.5 : 1.0;
        
        setPlaybackSpeed(newSpeed);
        onSpeedChange(newSpeed);
        setLastGesture('speed');
      }
    },
    minDistance: 50,
    maxTime: 500 // Slightly longer to make gestures easier to trigger
  });
  
  // Handle input change
  const handleChange = (e) => {
    // Get value from event target
    const newValue = e.target.value;
    
    // Prevent unnecessary updates that could cause resets
    if (newValue === value) return;
    
    // Update local state immediately to prevent flickering
    if (onChange) {
      onChange(newValue);
    }
  };
  
  // Handle submit (Enter key)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };
  
  // Get gesture feedback text
  const getGestureFeedbackText = () => {
    switch (lastGesture) {
      case 'previous':
        return 'Previous Sentence';
      case 'next':
        return 'Next Sentence';
      case 'repeat':
        return 'Repeat Sentence';
      case 'speed':
        return `Speed: ${playbackSpeed === 1.0 ? '100%' : 
                          playbackSpeed === 0.75 ? '75%' : '50%'}`;
      default:
        return '';
    }
  };
  
  // Handle play/next button function with simplified logic
  const handlePlayNextButton = () => {
    // Add visual feedback for the tap
    const button = document.querySelector('.mobile-control-button.play-next');
    if (button) {
      button.classList.add('tapped');
      setTimeout(() => {
        button.classList.remove('tapped');
      }, 100);
    }
    
    if (isPlaying) {
      // If playing, pause
      onTogglePlay();
    } else if (value.trim() !== '') {
      // If has input, go to next sentence
      onSubmit();
    } else {
      // If no input, play current sentence
      onTogglePlay();
    }
  };
  
  return (
    <div 
      ref={containerRef}
      className={`mobile-gesture-container ${gestureActive ? 'gesture-active' : ''}`}
    >
      {/* Minimalist audio control pill */}
      <div className="mobile-audio-controls">
        <button 
          className={`mobile-control-button play-next ${isPlaying ? 'playing' : ''} ${hasAudioError ? 'error' : ''}`}
          onClick={handlePlayNextButton}
          aria-label={isPlaying ? "Pause" : value.trim() !== '' ? "Next sentence" : "Play"}
        >
          {isPlaying ? '⏸' : value.trim() !== '' ? '→' : '▶'}
        </button>
        
        {/* Progress bar */}
        <div className="mobile-progress-bar">
          <div 
            className="mobile-progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        
        {/* End dictation button */}
        <button 
          className="mobile-control-button end-dictation"
          onClick={onEndDictation}
          aria-label="End dictation"
        >
          ✕
        </button>
      </div>
      
      {/* Initial hint for gestures */}
      {showGestureHint && (
        <div className="gesture-hint">
          <div className="hint-title">Gesture Controls:</div>
          <div className="hint-item">
            <span className="hint-icon">←</span>
            <span className="hint-text">Previous</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">→</span>
            <span className="hint-text">Next</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">↑</span>
            <span className="hint-text">Repeat</span>
          </div>
          <div className="hint-item">
            <span className="hint-icon">↓</span>
            <span className="hint-text">Speed</span>
          </div>
          <button 
            className="hint-close"
            onClick={() => setShowGestureHint(false)}
          >
            Got it
          </button>
        </div>
      )}
      
      {/* Gesture feedback indicator */}
      {lastGesture && (
        <div className={`gesture-feedback ${lastGesture}`}>
          <div className="gesture-feedback-text">
            {getGestureFeedbackText()}
          </div>
        </div>
      )}
      
      {/* Unified input/display area */}
      <div className="unified-input-display">
        {/* Text input area with integrated feedback */}
        <div className="integrated-input-container">
          <textarea
            ref={inputRef}
            className={`gesture-input ${disabled ? 'disabled' : ''}`}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type what you hear..."
            disabled={disabled}
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          
          {/* Optional overlay for real-time correction feedback */}
          {false && showFeedback && expectedText && (
            <div className="text-correction-overlay">
              {compareText(expectedText, value, checkCapitalization).map((part, index) => (
                <span 
                  key={index} 
                  className={`correction-${part.type}`}
                >
                  {part.text}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to compare and mark up text differences
function compareText(expected, actual, checkCase) {
  if (!expected) return [];
  if (!actual) return [{ type: 'expected', text: expected }];
  
  // Split both strings into words
  const expectedWords = expected.split(/\s+/);
  const actualWords = actual.split(/\s+/);
  
  // Track current position in both word arrays
  let expectedIndex = 0;
  let actualIndex = 0;
  const result = [];
  
  // Process words until we reach the end of the actual input
  while (actualIndex < actualWords.length) {
    const actualWord = actualWords[actualIndex];
    
    // If we've run out of expected words, mark the rest as extra
    if (expectedIndex >= expectedWords.length) {
      result.push({
        type: 'extra',
        text: actualWords.slice(actualIndex).join(' ')
      });
      break;
    }
    
    const expectedWord = expectedWords[expectedIndex];
    
    // Simple word comparison (can be improved with more sophisticated matching)
    const isMatch = checkCase 
      ? actualWord === expectedWord
      : actualWord.toLowerCase() === expectedWord.toLowerCase();
    
    // Add spaces between words
    if (result.length > 0) {
      result.push({ type: 'correct', text: ' ' });
    }
    
    if (isMatch) {
      // Correct word
      result.push({ type: 'correct', text: actualWord });
      expectedIndex++;
      actualIndex++;
    } else {
      // Incorrect word - mark as incorrect and move on
      result.push({ type: 'incorrect', text: actualWord });
      actualIndex++;
      
      // If the next actual word matches the current expected word, advance the expected index
      // This handles insertion errors
      if (actualIndex < actualWords.length && 
         (checkCase ? actualWords[actualIndex] === expectedWord 
                    : actualWords[actualIndex].toLowerCase() === expectedWord.toLowerCase())) {
        // Don't advance expectedIndex here, will match in next iteration
      } else {
        // If no match found in next word, assume replacement and advance
        expectedIndex++;
      }
    }
  }
  
  // Add any remaining expected text
  if (expectedIndex < expectedWords.length) {
    if (result.length > 0) {
      result.push({ type: 'correct', text: ' ' });
    }
    result.push({ 
      type: 'expected', 
      text: expectedWords.slice(expectedIndex).join(' ')
    });
  }
  
  return result;
}

export default MobileGestureInput; 