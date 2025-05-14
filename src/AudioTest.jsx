import React, { useRef, useState } from 'react';

// A minimal component to test audio playback directly
const AudioTest = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);
  
  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    setError(null);
    
    audio.play()
      .then(() => {
        console.log("Audio playback started successfully");
        setIsPlaying(true);
      })
      .catch(err => {
        console.error("Audio playback failed:", err);
        setError(err.message);
      });
  };
  
  const handlePause = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.pause();
    setIsPlaying(false);
  };
  
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '500px', margin: '20px auto' }}>
      <h2>Audio Playback Test</h2>
      
      {/* Direct audio element */}
      <audio 
        ref={audioRef} 
        src="/audio/chap01.mp3"
        onEnded={() => setIsPlaying(false)}
        onError={(e) => {
          console.error("Audio error:", e);
          setError("Failed to load audio: " + e.target.error?.message || "Unknown error");
        }}
      />
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={isPlaying ? handlePause : handlePlay}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: isPlaying ? '#dc3545' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
      
      {error && (
        <div style={{ marginTop: '20px', color: 'red', padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '4px' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        <p>This is a minimal test to isolate audio playback functionality.</p>
        <p>Check the browser console for detailed logs.</p>
      </div>
    </div>
  );
};

export default AudioTest; 