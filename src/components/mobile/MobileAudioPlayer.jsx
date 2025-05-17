import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './MobileAudioPlayer.css';

// Mobile-specific simplified version of the audio player
// This version has minimal controls (just play, speed, and cancel buttons)
const MobileAudioPlayer = forwardRef((props, ref) => {
  const { 
    audioSrc, 
    onEnded, 
    onPlayStateChange,
    onCancel = () => {}
  } = props;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  
  // Track current sentence boundaries using refs
  const sentenceEndTimeRef = useRef(null);
  const sentenceStartTimeRef = useRef(0);
  const endEventProcessedRef = useRef(false);
  
  const audioRef = useRef(null);
  
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
  
  // Expose audio methods to parent component - same as desktop version
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
        sentenceStartTimeRef.current = timeInSeconds;
        audioRef.current.currentTime = timeInSeconds;
        setCurrentTime(timeInSeconds);
        endEventProcessedRef.current = false;
        return true;
      }
      return false;
    },
    setCurrentSentenceEndTime: (endTimeInSeconds) => {
      sentenceEndTimeRef.current = endTimeInSeconds;
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
        endEventProcessedRef.current = false;
        audioRef.current.currentTime = sentenceStartTimeRef.current;
        
        if (sentenceEndTimeRef.current === null) {
          console.warn('No end time set for sentence repeat');
        }
        
        audioRef.current.play();
        return true;
      }
      return false;
    }
  }));
  
  const handlePlayPause = () => {
    if (!isLoaded) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      if (onPlayStateChange) {
        onPlayStateChange('paused');
      }
    } else {
      // If starting to play, notify parent
      if (onPlayStateChange) {
        onPlayStateChange('playing');
      }
      
      // Start playback
      audioRef.current.play();
    }
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentAudioTime = audioRef.current.currentTime;
      setCurrentTime(currentAudioTime);
      
      // Check if we've reached the end of the current sentence
      if (sentenceEndTimeRef.current !== null && 
          currentAudioTime >= sentenceEndTimeRef.current && 
          !endEventProcessedRef.current) {
        
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

  // Fix the cancel button handler
  const handleCancel = () => {
    console.log("Cancel button clicked in MobileAudioPlayer");
    
    // Try to handle directly
    if (typeof props.onCancel === 'function') {
      console.log("Calling onCancel from props");
      props.onCancel();
    } else {
      console.error("No onCancel handler provided");
      // Try an alternate approach - dispatch a custom event
      const cancelEvent = new CustomEvent('dictationCancel');
      document.dispatchEvent(cancelEvent);
    }
  };
  
  return (
    <div className="mobile-audio-player">
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
      
      <div className="mobile-player-container">
        {/* Play/pause button */}
        <button 
          className="mobile-play-button" 
          onClick={handlePlayPause}
          disabled={!isLoaded}
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        
        {/* Speed control button */}
        <button
          className="mobile-playback-speed-button"
          onClick={() => {
            // Cycle through common playback speeds
            const speeds = [0.75, 1.0, 1.25, 1.5];
            const currentIndex = speeds.indexOf(playbackSpeed);
            const nextIndex = (currentIndex + 1) % speeds.length;
            setPlaybackSpeed(speeds[nextIndex]);
            
            if (audioRef.current) {
              audioRef.current.playbackRate = speeds[nextIndex];
            }
          }}
        >
          {playbackSpeed}x
        </button>
        
        {/* Cancel button */}
        <button 
          className="cancel-button" 
          onClick={handleCancel}
          title="Cancel exercise"
        >
          <span>✕</span>
        </button>
      </div>
      
      {/* Audio progress indicator (minimal) */}
      <div className="mobile-progress-bar">
        <div 
          className="mobile-progress-fill" 
          style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
        ></div>
      </div>
    </div>
  );
});

export default MobileAudioPlayer;
