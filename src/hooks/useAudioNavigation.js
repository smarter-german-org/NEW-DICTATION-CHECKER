import { useState, useRef, useEffect } from 'react';
import { debug } from '../utils/debug';

/**
 * Custom hook to manage audio navigation in the dictation tool
 * @param {Object} audioRef - React ref for the audio player
 * @param {Array} sentences - Array of sentences with timing info
 * @param {Function} processUserInput - Function to process user input
 * @returns {Object} - Audio navigation state and methods
 */
export function useAudioNavigation(audioRef, sentences = [], processUserInput) {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [navigationInProgress, setNavigationInProgress] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  
  const currentIndexRef = useRef(0);
  const timeoutRef = useRef(null);
  
  // Update the ref whenever state changes to avoid stale closures
  useEffect(() => {
    currentIndexRef.current = currentSentenceIndex;
  }, [currentSentenceIndex]);
  
  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);
  
  /**
   * Plays the sentence at the specified index
   * @param {number|null} indexOverride - Optional index override (uses current if null)
   */
  const playCurrentSentence = (indexOverride = null) => {
    // Use the override if provided, otherwise use the ref for most up-to-date value
    const indexToPlay = indexOverride !== null ? indexOverride : currentIndexRef.current;
    
    if (sentences.length === 0 || indexToPlay >= sentences.length || navigationInProgress) {
      return;
    }
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setWaitingForInput(false);
    setIsPlaying(true);
    
    const currentSentence = sentences[indexToPlay];
    
    if (audioRef.current) {
      debug('PLAY_SENTENCE', "Playing sentence at index:", indexToPlay, 
            "starting at time:", currentSentence.startTime, 
            "ending at:", currentSentence.endTime);
      
      try {
        // Make sure audio is in stopped state first
        audioRef.current.pause();
        
        // Set the current time to the start of the sentence
        audioRef.current.seekTo(currentSentence.startTime);
        
        // Set the end time for the current sentence
        audioRef.current.setCurrentSentenceEndTime(currentSentence.endTime);
        
        // Start playback
        audioRef.current.play();
        
      } catch (error) {
        debug('AUDIO_ERROR', "Error in audio playback:", error);
        setIsPlaying(false);
      }
    }
  };
  
  /**
   * Repeats the current sentence
   */
  const repeatCurrentSentence = () => {
    if (audioRef.current && sentences.length > 0) {
      const currentSentence = sentences[currentIndexRef.current];
      if (currentSentence) {
        playCurrentSentence(currentIndexRef.current);
      }
    }
  };
  
  /**
   * Navigates to the previous sentence
   * @param {string} userInput - Current user input
   */
  const handlePreviousSentence = (userInput = '') => {
    if (currentSentenceIndex > 0 && !navigationInProgress) {
      debug('PREVIOUS_SENTENCE', 'Navigating to previous sentence');
      setNavigationInProgress(true);
      setWaitingForInput(false);
      
      // Process current input if there is any
      if (userInput.trim() !== '' && processUserInput) {
        processUserInput();
      }
      
      // Stop any current playback
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
      }
      
      // Clear any pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Store the new index so we can use it immediately
      const newIndex = currentSentenceIndex - 1;
      setCurrentSentenceIndex(newIndex);
      currentIndexRef.current = newIndex;
      
      // Give a small delay before playing previous sentence
      timeoutRef.current = setTimeout(() => {
        playCurrentSentence(newIndex); // Pass the index explicitly
        setNavigationInProgress(false);
        debug('PREVIOUS_SENTENCE', 'Navigation completed');
      }, 100);
      
      return true;
    }
    return false;
  };
  
  /**
   * Navigates to the next sentence
   * @param {string} userInput - Current user input
   * @param {boolean} fromShortcut - Whether triggered from a keyboard shortcut
   * @param {Function} onComplete - Callback when all sentences are completed
   * @returns {boolean} - Whether navigation was successful
   */
  const goToNextSentence = (userInput = '', fromShortcut = false, onComplete = null) => {
    debug('NEXT_SENTENCE_SHORTCUT', 'Attempting to go to next sentence');
    
    // If at the last sentence, process input and signal completion
    if (currentSentenceIndex >= sentences.length - 1 || navigationInProgress) {
      // If at the last sentence, process input and show feedback
      if (userInput.trim() !== '' && processUserInput) {
        processUserInput();
      }
      
      if (onComplete) {
        onComplete();
      }
      
      setIsPlaying(false);
      setCurrentSentenceIndex(sentences.length);
      return false;
    }
    
    setNavigationInProgress(true);
    setWaitingForInput(false);
    
    // If there's input, process it
    if (userInput.trim() !== '' && processUserInput) {
      processUserInput();
    }
    
    // Stop any current playback
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
    }
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Store the new index so we can use it immediately
    const newIndex = currentSentenceIndex + 1;
    setCurrentSentenceIndex(newIndex);
    currentIndexRef.current = newIndex;
    
    // Give a small delay before playing next sentence
    timeoutRef.current = setTimeout(() => {
      playCurrentSentence(newIndex); // Pass the index explicitly
      setNavigationInProgress(false);
      debug('NEXT_SENTENCE_SHORTCUT', 'Navigation completed');
    }, 100);
    
    return true;
  };
  
  /**
   * Handles audio play state changes
   * @param {boolean} isAudioPlaying - Whether the audio is playing
   * @param {boolean} exerciseStarted - Whether the exercise has started
   * @param {Function} startExercise - Function to start the exercise
   * @param {Object} inputRef - React ref for the input element
   */
  const handleAudioPlayStateChange = (
    isAudioPlaying, 
    exerciseStarted, 
    startExercise = null, 
    inputRef = null
  ) => {
    setIsPlaying(isAudioPlaying);
    
    // If audio starts playing and exercise hasn't started yet, start the exercise
    if (isAudioPlaying && exerciseStarted === false && startExercise) {
      debug('AUTO_START', 'Starting exercise from audio play');
      startExercise();
    }
    
    // When audio stops, focus the input field
    if (!isAudioPlaying && exerciseStarted) {
      debug('AUDIO_STOPPED', 'Audio playback stopped, focusing input field');
      setTimeout(() => {
        if (inputRef && inputRef.current) {
          inputRef.current.focus();
          setWaitingForInput(true);
        }
      }, 100);
    }
  };
  
  return {
    // State
    currentSentenceIndex,
    navigationInProgress,
    isPlaying,
    waitingForInput,
    
    // Refs
    currentIndexRef,
    
    // Actions
    setCurrentSentenceIndex,
    setNavigationInProgress,
    setIsPlaying,
    setWaitingForInput,
    
    // Methods
    playCurrentSentence,
    repeatCurrentSentence,
    handlePreviousSentence,
    goToNextSentence,
    handleAudioPlayStateChange
  };
} 