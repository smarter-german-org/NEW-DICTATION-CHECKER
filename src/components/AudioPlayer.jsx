import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './AudioPlayer.css';
import './mobile/MobileResponsiveControls.css';

const AudioPlayer = forwardRef(({ 
  audioSrc, 
  onEnded, 
  onPlayStateChange,
  checkCapitalization = false,
  onToggleCapitalization = () => {},
  onPrevious = () => {},
  onNext = () => {},
  onCancel = () => {},
  onRepeat = () => {}
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  // Track current sentence boundaries using refs
  const sentenceEndTimeRef = useRef(null);
  const sentenceStartTimeRef = useRef(0);  // Add start time tracking
  // Add flag to prevent multiple callbacks
  const endEventProcessedRef = useRef(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  // Handle audio source change
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoaded(false);
    
    // Reset audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [audioSrc]);
  
  // Expose audio methods to parent component
  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current && isLoaded) {
        endEventProcessedRef.current = false;
        audioRef.current.play();
      }
    },
    pause: () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    },
    stop: () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    },
    seekTo: (timeInSeconds) => {
      if (audioRef.current && isLoaded) {
        // Store the start time when seeking to a new sentence
        sentenceStartTimeRef.current = timeInSeconds;
        audioRef.current.currentTime = timeInSeconds;
        setCurrentTime(timeInSeconds);
        // Reset the processed flag when seeking to a new position
        endEventProcessedRef.current = false;
        
        // When seeking to a new sentence start, we need to know where it ends
        // This will be set by the parent component through the setCurrentSentenceEndTime method
        return true;
      }
      return false;
    },
    setCurrentSentenceEndTime: (endTimeInSeconds) => {
      // Store the end time of the current sentence
      sentenceEndTimeRef.current = endTimeInSeconds;
      // Reset the processed flag when setting a new end time
      endEventProcessedRef.current = false;
      console.log("Set sentence end time to:", endTimeInSeconds);
    },
    getCurrentTime: () => {
      return audioRef.current ? audioRef.current.currentTime : 0;
    },
    getDuration: () => {
      return audioRef.current ? audioRef.current.duration : 0;
    },
    repeatSentence: () => {
      if (audioRef.current && isLoaded) {
        // Reset the processed flag
        endEventProcessedRef.current = false;
        
        // Use the stored sentence start time
        audioRef.current.currentTime = sentenceStartTimeRef.current;
        
        // The end time should still be valid from the previous setCurrentSentenceEndTime call
        if (sentenceEndTimeRef.current === null) {
          console.warn('No end time set for sentence repeat');
        }
        
        // Start playback
        audioRef.current.play();
        return true;
      }
      return false;
    }
  }));
  
  // Format time to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handlePlayPause = () => {
    if (!isLoaded) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (onPlayStateChange) {
        onPlayStateChange('paused');
      }
    } else {
      // If we're not playing, start playback
      if (onPlayStateChange) {
        // Signal that we're starting playback
        onPlayStateChange('playing');
      }
      
      // Start playback
      audioRef.current.play();
    }
  };
  
  const handleRewind = () => {
    if (onPrevious) {
      onPrevious();
    } else {
      if (!isLoaded) return;
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
    }
  };
  
  const handleForward = () => {
    if (onNext) {
      onNext();
    } else {
      if (!isLoaded) return;
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + 5
      );
    }
  };

  const handleReset = () => {
    if (!isLoaded) return;
    audioRef.current.currentTime = 0;
  };
  
  const handleRepeatSentence = () => {
    if (!isLoaded) return;
    
    // Stop any current playback first
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Reset flags
    endEventProcessedRef.current = false;
    
    // Use the stored sentence start time
    audioRef.current.currentTime = sentenceStartTimeRef.current;
    
    // Make sure we still have the end time set
    if (sentenceEndTimeRef.current) {
      // Start playback
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      console.warn('No end time set for sentence repeat');
    }
  };
  
  const handleProgressClick = (e) => {
    if (!isLoaded || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * audioRef.current.duration;
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentAudioTime = audioRef.current.currentTime;
      setCurrentTime(currentAudioTime);
      
      // Check if we've reached the end of the current sentence
      if (sentenceEndTimeRef.current !== null && 
          currentAudioTime >= sentenceEndTimeRef.current && 
          !endEventProcessedRef.current) {  // Only process if not already handled
        
        console.log("Reached sentence end time:", sentenceEndTimeRef.current, "current time:", currentAudioTime);
        
        // Mark as processed to prevent multiple callbacks
        endEventProcessedRef.current = true;
        
        // Stop playback when we reach the end time
        audioRef.current.pause();
        setIsPlaying(false);
        
        // Call the onEnded callback to notify parent
        if (onEnded) {
          // Reset sentence end time
          const prevEndTime = sentenceEndTimeRef.current;
          sentenceEndTimeRef.current = null;
          
          // Small delay to ensure state is updated before callback
          setTimeout(() => {
            if (audioRef.current && Math.abs(audioRef.current.currentTime - prevEndTime) < 0.5) {
              onEnded();
            }
          }, 50);
        }
      }
    }
  };
  
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setIsLoaded(true);
    }
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
    
    // Ensure playback is truly stopped
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    if (onEnded) {
      // Small delay to ensure state is updated before callback
      setTimeout(() => {
        onEnded();
      }, 50);
    }
  };
  
  const handlePlayingState = () => {
    const playing = audioRef.current && !audioRef.current.paused;
    setIsPlaying(playing);
    if (onPlayStateChange) onPlayStateChange(playing);
  };
  
  const togglePlaybackSpeed = () => {
    let newSpeed;
    if (playbackSpeed === 1.0) {
      newSpeed = 0.75;
    } else if (playbackSpeed === 0.75) {
      newSpeed = 0.5;
    } else {
      newSpeed = 1.0;
    }
    
    // Set the playback rate immediately with the new value
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
    
    // Update the state to reflect the new speed
    setPlaybackSpeed(newSpeed);
  };

  // Check the cancel button implementation
  const handleCancel = (e) => {
    // Stop the event to prevent any bubbling issues
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Cancel button clicked in AudioPlayer");
    
    // Try the prop callback first
    if (typeof onCancel === 'function') {
      console.log("Calling onCancel prop");
      onCancel();
    } 
    // Fallback - dispatch custom event
    else {
      console.log("Dispatching custom cancelDictation event");
      const cancelEvent = new CustomEvent('dictationCancel');
      document.dispatchEvent(cancelEvent);
    }
  };
  
  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        onPlay={handlePlayingState}
        onPause={handlePlayingState}
        loop={false}
      />
      
      <div className="player-container">
        <div className="controls-left">
          <button 
            className="control-button" 
            onClick={handleRewind}
            disabled={!isLoaded}
            title="Previous Sentence"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          <button 
            className="play-button" 
            onClick={handlePlayPause}
            disabled={!isLoaded}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            )}
          </button>
          
          <button 
            className="control-button" 
            onClick={handleForward}
            disabled={!isLoaded}
            title="Next Sentence"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
        
        <div className="progress-wrapper">
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              ref={progressRef}
              onClick={handleProgressClick}
            >
              <div 
                className="progress-fill" 
                style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
              ></div>
            </div>
            <div className="time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="controls-right">
            <button 
              className={`option-toggle ${checkCapitalization ? 'active' : ''}`}
              onClick={onToggleCapitalization}
              title={`Case Sensitivity: ${checkCapitalization ? 'Strict (Hard Mode)' : 'Relaxed (Normal Mode)'}`}
            >
              Aa
            </button>
            
            <button 
              className="option-toggle"
              onClick={onRepeat}
              title="Repeat Sentence"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
              </svg>
            </button>
            
            <button onClick={togglePlaybackSpeed} className="playback-speed-button">
              {playbackSpeed === 1.0 ? '100%' : playbackSpeed === 0.75 ? '75%' : '50%'}
            </button>
            
            <button 
              className="cancel-button"
              onClick={handleCancel}
              title="Cancel exercise"
            >
              <span>✕</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AudioPlayer;