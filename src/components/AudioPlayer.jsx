import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import './AudioPlayer.css';

const AudioPlayer = forwardRef(({ audioSrc, onEnded, onPlayStateChange }, ref) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  
  // Expose audio methods to parent component
  useImperativeHandle(ref, () => ({
    play: () => {
      audioRef.current.play();
    },
    pause: () => {
      audioRef.current.pause();
    },
    stop: () => {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
      return audioRef.current.currentTime;
    },
    getDuration: () => {
      return audioRef.current.duration;
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
  
  const handleProgressClick = (e) => {
    if (!isLoaded || !progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * audioRef.current.duration;
  };
  
  const handleTimeUpdate = () => {
    setCurrentTime(audioRef.current.currentTime);
  };
  
  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
    setIsLoaded(true);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  };
  
  const handlePlayingState = () => {
    const playing = !audioRef.current.paused;
    setIsPlaying(playing);
    if (onPlayStateChange) onPlayStateChange(playing);
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
      />
      
      <div className="player-controls">
        <button 
          className="control-button rewind-button" 
          onClick={handleRewind}
          disabled={!isLoaded}
          title="Rewind 5 seconds"
        >
          <i className="fas fa-backward"></i>
        </button>
        
        <button 
          className="play-button" 
          onClick={handlePlayPause}
          disabled={!isLoaded}
        >
          <i className={isPlaying ? "fas fa-pause" : "fas fa-play"}></i>
        </button>
        
        <button 
          className="control-button forward-button" 
          onClick={handleForward}
          disabled={!isLoaded}
          title="Forward 5 seconds"
        >
          <i className="fas fa-forward"></i>
        </button>
      </div>
      
      <div className="progress-container">
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
          <span className="current-time">{formatTime(currentTime)}</span>
          <span className="duration">{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
});

export default AudioPlayer; 