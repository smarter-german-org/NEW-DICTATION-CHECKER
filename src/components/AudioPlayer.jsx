import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { debug } from '../utils/debug';
import './AudioPlayer.css';

const AudioPlayer = forwardRef(({ 
  audioSrc, 
  onEnded, 
  onPlayStateChange,
  checkCapitalization = false,
  onToggleCapitalization = () => {},
  onPrevious = () => {},
  onNext = () => {},
  onCancel = () => {}
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [volume, setVolume] = useState(1);
  const [speedIndex, setSpeedIndex] = useState(0);
  
  // Track current sentence boundaries using refs
  const sentenceEndTimeRef = useRef(null);
  // Add flag to prevent multiple callbacks
  const endEventProcessedRef = useRef(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  // Define playback speed options (100%, 75%, 50%)
  const speedOptions = [1, 0.75, 0.5];
  
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
        audioRef.current.play().catch(error => {
          debug('AUDIO_ERROR', 'Could not play audio:', error);
        });
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
        // Play the current sentence again
        audioRef.current.play().catch(error => {
          debug('AUDIO_ERROR', 'Could not play audio:', error);
        });
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
    } else {
      audioRef.current.play().catch(error => {
        debug('AUDIO_ERROR', 'Could not play audio:', error);
      });
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
    
    // Use the ref's repeatSentence method to properly handle repeating
    if (ref && ref.current) {
      ref.current.repeatSentence();
    } else {
      // Fallback if no ref handler
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(error => {
        debug('AUDIO_ERROR', 'Could not play audio:', error);
      });
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
  
  // Cycle through playback speeds
  const cyclePlaybackSpeed = () => {
    setSpeedIndex((prevIndex) => {
      const newIndex = (prevIndex + 1) % speedOptions.length;
      
      if (audioRef.current) {
        audioRef.current.playbackRate = speedOptions[newIndex];
      }
      
      return newIndex;
    });
  };
  
  // Get current speed icon and title
  const getSpeedIcon = () => {
    return '🐢';
  };
  
  const getSpeedTitle = () => {
    const currentSpeed = speedOptions[speedIndex];
    if (currentSpeed === 1) return 'Normal speed (click to slow down)';
    if (currentSpeed === 0.75) return '75% speed (click to slow down more)';
    return '50% speed (click to reset to normal)';
  };
  
  // Apply the speed setting when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speedOptions[speedIndex];
    }
  }, [speedIndex]);

  // Determine the speed indicator label
  const getSpeedLabel = () => {
    const currentSpeed = speedOptions[speedIndex];
    return currentSpeed === 1 ? '1×' : `${currentSpeed}×`;
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
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
              onClick={handleRepeatSentence}
              title="Repeat Current Sentence"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10" />
                <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14" />
              </svg>
            </button>
            
            <button 
              className={`option-toggle speed ${speedIndex > 0 ? 'active' : ''}`}
              onClick={cyclePlaybackSpeed}
              title={getSpeedTitle()}
            >
              <span className="speed-icon">{getSpeedIcon()}</span>
              <span className="speed-label">{getSpeedLabel()}</span>
            </button>
            
            <button 
              className="cancel-button"
              onClick={onCancel}
              title="Stop Dictation and Show Results"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className="volume-container">
        <span className="volume-icon">🔊</span>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={volume} 
          onChange={handleVolumeChange} 
          className="volume-slider"
        />
      </div>
    </div>
  );
});

export default AudioPlayer; 