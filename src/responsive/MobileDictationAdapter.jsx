import React, { useState, useEffect, useRef } from 'react';
import DictationTool from '../components/DictationTool';
import MobileGestureInput from './MobileGestureInput';
import { useResponsive } from './index';
import './mobileStyles.css';

/**
 * Adapter component that connects DictationTool with mobile gesture features
 * This avoids having to modify the core DictationTool component directly
 */
const MobileDictationAdapter = ({ exerciseId, useMobileGestures }) => {
  const { isMobile } = useResponsive();
  const [inputValue, setInputValue] = useState('');
  const [expectedText, setExpectedText] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [checkCaps, setCheckCaps] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [audioError, setAudioError] = useState(false);
  
  // References to DOM elements for event delegation
  const prevButtonRef = useRef(null);
  const nextButtonRef = useRef(null); 
  const playButtonRef = useRef(null);
  const cancelButtonRef = useRef(null);
  const inputRef = useRef(null);
  
  // Track sentence progress
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [totalSentences, setTotalSentences] = useState(1);
  
  // Track the original audio controls to connect them
  const trackOriginalControls = () => {
    prevButtonRef.current = document.querySelector('.audio-player .prev-button');
    nextButtonRef.current = document.querySelector('.audio-player .next-button');
    playButtonRef.current = document.querySelector('.audio-player .play-button');
    cancelButtonRef.current = document.querySelector('.audio-player .cancel-button');
    inputRef.current = document.querySelector('.dictation-input');
    
    // Extract play state
    if (playButtonRef.current) {
      const isCurrentlyPlaying = playButtonRef.current.classList.contains('playing');
      setIsPlaying(isCurrentlyPlaying);
    }
    
    // Extract progress
    const progressBar = document.querySelector('.progress-bar-fill');
    if (progressBar) {
      const width = progressBar.style.width;
      if (width) {
        const percentMatch = width.match(/^(\d+(\.\d+)?)%$/);
        if (percentMatch && percentMatch[1]) {
          const percent = parseFloat(percentMatch[1]);
          setProgressPercent(percent);
        }
      }
    }
    
    // Extract expected text
    const feedbackContainer = document.querySelector('.feedback-container');
    if (feedbackContainer) {
      const textContent = feedbackContainer.textContent;
      if (textContent) {
        setExpectedText(textContent);
      }
    }
    
    // Extract input value and state
    if (inputRef.current) {
      setInputValue(inputRef.current.value);
      setIsDisabled(inputRef.current.disabled);
    }
    
    // Extract capitalization setting
    const capsButton = document.querySelector('.capitalization-toggle');
    if (capsButton) {
      setCheckCaps(capsButton.classList.contains('active'));
    }
  };
  
  // Set up monitoring of audio element events and progress
  useEffect(() => {
    const audioElement = document.querySelector('audio');
    
    if (audioElement) {
      // Forcibly stop any existing playback
      audioElement.pause();
      audioElement.currentTime = 0;
      
      // Override the play method to properly handle sentence playback
      const originalPlay = audioElement.play;
      audioElement.play = function() {
        // Calculate the current segment duration from the data attributes
        let duration = 5; // Default 5 seconds if no data available
        
        try {
          // Try to extract segment duration from the DictationTool
          const currentSentence = document.querySelector('.dictation-tool').getAttribute('data-current-sentence');
          if (currentSentence) {
            const sentenceData = JSON.parse(currentSentence);
            if (sentenceData && sentenceData.duration) {
              duration = sentenceData.duration;
            }
          }
          
          // If we have the actual audio duration, use that as a fallback
          if (duration <= 0 && audioElement.duration && audioElement.duration > 0) {
            duration = audioElement.duration;
          }
          
          // Ensure minimum duration
          duration = Math.max(duration, 2); 
        } catch (e) {
          console.log('Could not extract sentence duration:', e);
        }
        
        // Call the original play method
        const playPromise = originalPlay.apply(this);
        
        // We don't need to auto-stop anymore - will use ended event instead
        // Let the audio play to its natural conclusion
        
        return playPromise;
      };
      
      const handleAudioPlay = () => {
        setIsPlaying(true);
        setAudioError(false);
      };
      
      const handleAudioPause = () => {
        setIsPlaying(false);
      };
      
      const handleAudioEnded = () => {
        setIsPlaying(false);
        // We don't reset the position here as we want to 
        // detect it reached the end
      };
      
      const handleAudioError = () => {
        setIsPlaying(false);
        setAudioError(true);
        console.error('Audio playback error detected');
      };
      
      audioElement.addEventListener('play', handleAudioPlay);
      audioElement.addEventListener('playing', handleAudioPlay);
      audioElement.addEventListener('pause', handleAudioPause);
      audioElement.addEventListener('ended', handleAudioEnded);
      audioElement.addEventListener('error', handleAudioError);
      
      return () => {
        // Restore original play method
        if (originalPlay) {
          audioElement.play = originalPlay;
        }
        
        audioElement.removeEventListener('play', handleAudioPlay);
        audioElement.removeEventListener('playing', handleAudioPlay);
        audioElement.removeEventListener('pause', handleAudioPause);
        audioElement.removeEventListener('ended', handleAudioEnded);
        audioElement.removeEventListener('error', handleAudioError);
      };
    }
  }, []);
  
  // Set up interval to track original controls and state
  useEffect(() => {
    trackOriginalControls();
    
    // Update progress more frequently for smoother UI
    const intervalId = setInterval(() => {
      // Track original controls
      trackOriginalControls();
      
      // Update progress directly from audio element for more reliability
      const audioElement = document.querySelector('audio');
      if (audioElement && audioElement.duration > 0) {
        const percent = (audioElement.currentTime / audioElement.duration) * 100;
        setProgressPercent(Math.min(100, Math.max(0, percent)));
        
        // Also check playing state to ensure UI consistency
        const isCurrentlyPlaying = !audioElement.paused;
        if (isPlaying !== isCurrentlyPlaying) {
          setIsPlaying(isCurrentlyPlaying);
        }
      }
    }, 50); // More frequent updates (50ms)
    
    return () => clearInterval(intervalId);
  }, [isPlaying]); // Re-establish interval if playing state changes
  
  // Track sentence progress
  useEffect(() => {
    // Find the sentence progress indicator
    const progressIndicator = document.querySelector('.progress-numbers');
    if (progressIndicator) {
      const progressText = progressIndicator.textContent;
      // Extract numbers like "1/10" to get current and total
      const match = progressText.match(/(\d+)\/(\d+)/);
      if (match && match.length === 3) {
        const current = parseInt(match[1], 10);
        const total = parseInt(match[2], 10);
        
        if (!isNaN(current) && !isNaN(total) && total > 0) {
          setCurrentSentenceIndex(current - 1); // Convert to 0-based index
          setTotalSentences(total);
          
          // Calculate progress percentage
          const percent = (current / total) * 100;
          setProgressPercent(percent);
        }
      }
    }
  }, [inputValue, isPlaying]); // Re-check when input or playing state changes
  
  // Direct UI event handlers that delegate to original controls
  const handlePrevious = () => {
    if (prevButtonRef.current) {
      prevButtonRef.current.click();
    }
  };
  
  const handleNext = () => {
    if (nextButtonRef.current) {
      nextButtonRef.current.click();
    }
  };
  
  const handleRepeat = () => {
    // Direct approach using audio element
    const audioElement = document.querySelector('audio');
    
    if (audioElement && playButtonRef.current) {
      // If currently playing, pause first
      if (isPlaying) {
        playButtonRef.current.click(); // Pause
      }
      
      // Reset audio position
      audioElement.currentTime = 0;
      
      // Short delay before playing again
      setTimeout(() => {
        playButtonRef.current.click(); // Play
      }, 50);
    } else if (playButtonRef.current) {
      // Fallback if no direct access
      if (isPlaying) {
        playButtonRef.current.click(); // Pause
        setTimeout(() => {
          playButtonRef.current.click(); // Play again
        }, 50);
      } else {
        playButtonRef.current.click(); // Just play
      }
    }
  };
  
  const handleTogglePlay = () => {
    // Find the audio element directly
    const audioElement = document.querySelector('audio');
    
    if (audioElement && playButtonRef.current) {
      // Try to use the audio element directly
      if (audioElement.paused) {
        // Force reset position if at end
        if (audioElement.currentTime >= audioElement.duration - 0.1) {
          audioElement.currentTime = 0;
        }
        
        // Directly play the audio
        const playPromise = audioElement.play();
        if (playPromise) {
          playPromise.catch(error => {
            console.error("Error playing audio:", error);
            setAudioError(true);
          });
        }
        
        // Update UI state
        setIsPlaying(true);
        
        // Also update the original player UI
        if (!playButtonRef.current.classList.contains('playing')) {
          playButtonRef.current.click();
        }
      } else {
        // Directly pause the audio
        audioElement.pause();
        
        // Update UI state
        setIsPlaying(false);
        
        // Also update the original player UI
        if (playButtonRef.current.classList.contains('playing')) {
          playButtonRef.current.click();
        }
      }
    } else if (playButtonRef.current) {
      // Fallback to just clicking the button
      playButtonRef.current.click();
    }
  };
  
  const handleEndDictation = () => {
    // First, find the cancel button
    if (cancelButtonRef.current) {
      // Click the cancel button to open the confirmation dialog
      cancelButtonRef.current.click();
      
      // After a short delay, find and click the confirm button in the dialog
      setTimeout(() => {
        const confirmButton = document.querySelector('.confirm-dialog .confirm-button');
        if (confirmButton) {
          confirmButton.click();
        }
      }, 100);
    }
  };
  
  const handleInputChange = (text) => {
    // Update local state immediately
    setInputValue(text);
    
    // Only update original if needed and prevent rapid resets
    if (inputRef.current && inputRef.current.value !== text) {
      // Just set the value directly without events
      inputRef.current.value = text;
    }
  };
  
  const handleSubmit = () => {
    if (inputRef.current) {
      // Simulate Enter key press on the input
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      inputRef.current.dispatchEvent(event);
    }
  };
  
  const handleSpeedChange = () => {
    // Find the speed toggle button and click it
    const speedButton = document.querySelector('.playback-speed-button');
    if (speedButton) {
      speedButton.click();
    }
  };
  
  // Only use mobile UI when on mobile or explicitly requested
  const shouldUseGestures = isMobile || useMobileGestures;
  
  return (
    <div className="mobile-dictation-container">
      {shouldUseGestures ? (
        <>
          <MobileGestureInput
            value={inputValue}
            onChange={handleInputChange}
            expectedText={expectedText}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onRepeat={handleRepeat}
            onSpeedChange={handleSpeedChange}
            onSubmit={handleSubmit}
            disabled={isDisabled}
            checkCapitalization={checkCaps}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            progressPercent={progressPercent}
            onEndDictation={handleEndDictation}
            hasAudioError={audioError}
          />
          
          {/* Positioned off-screen but still rendered */}
          <div className="original-dictation-tool" aria-hidden="true">
            <DictationTool exerciseId={exerciseId} />
          </div>
        </>
      ) : (
        <DictationTool exerciseId={exerciseId} />
      )}
    </div>
  );
};

export default MobileDictationAdapter; 