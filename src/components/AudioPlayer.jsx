import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './AudioPlayer.css';

const AudioPlayer = forwardRef(({ 
  audioSrc, 
  onEnded, 
  onPlayStateChange,
  checkCapitalization = false,
  onToggleCapitalization = () => {}
}, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [infiniteLoop, setInfiniteLoop] = useState(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  // Expose audio methods to parent component
  useImperativeHandle(ref, () => ({
    play: () => {
      if (audioRef.current && isLoaded) {
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
        audioRef.current.currentTime = timeInSeconds;
        setCurrentTime(timeInSeconds);
        return true;
      }
      return false;
    },
    getCurrentTime: () => {
      return audioRef.current ? audioRef.current.currentTime : 0;
    },
    getDuration: () => {
      return audioRef.current ? audioRef.current.duration : 0;
    }
  }));
  
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
      audioRef.current.play();
    }
  };
  
  const handleRewind = () => {
    if (!isLoaded) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 5);
  };
  
  const handleForward = () => {
    if (!isLoaded) return;
    audioRef.current.currentTime = Math.min(
      audioRef.current.duration,
      audioRef.current.currentTime + 5
    );
  };

  const handleReset = () => {
    if (!isLoaded) return;
    audioRef.current.currentTime = 0;
  };
  
  const handleProgressClick = (e) => {
    if (!isLoaded || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * audioRef.current.duration;
  };
  
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
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
    
    // Only handle infinite loop internally if onEnded isn't provided
    // This allows the parent component to control looping behavior
    if (infiniteLoop && !onEnded) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            if (onPlayStateChange) onPlayStateChange(true);
          })
          .catch(error => console.error('Playback failed after loop:', error));
      }
    } else if (onEnded) {
      onEnded();
    }
  };
  
  const handlePlayingState = () => {
    const playing = audioRef.current && !audioRef.current.paused;
    setIsPlaying(playing);
    if (onPlayStateChange) onPlayStateChange(playing);
  };

  const toggleInfiniteLoop = () => {
    // Only toggle infinite loop state, don't affect playback
    setInfiniteLoop(prev => !prev);
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
        loop={false} /* Important: disable HTML5 loop attribute */
      />
      
      <div className="player-container">
        <div className="controls-left">
          <button 
            className="control-button" 
            onClick={handleRewind}
            disabled={!isLoaded}
            title="Previous 5 seconds"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          
          <button 
            className="control-button" 
            onClick={handleReset}
            disabled={!isLoaded}
            title="Reset"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 4l-4 4 4 4" />
              <path d="M14 8h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h3" />
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
            title="Next 5 seconds"
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
              className={`option-toggle ${infiniteLoop ? 'active' : ''}`}
              onClick={toggleInfiniteLoop}
              title={infiniteLoop ? "Infinite loop enabled" : "Infinite loop disabled"}
            >
              ∞
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AudioPlayer; 