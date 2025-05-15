import { useState, useRef, useEffect } from 'react';
import { debug } from '../utils/debug';

/**
 * Custom hook to manage dictation exercise state
 * @param {Object} options - Configuration options
 * @returns {Object} - Exercise state and methods
 */
export function useExerciseState({ exerciseId = 1, exercises = [] }) {
  // Find the selected exercise by ID or use the first one as default
  const defaultExercise = exercises.find(ex => ex.id === exerciseId) || exercises[0] || {};
  
  // Exercise state
  const [selectedExercise, setSelectedExercise] = useState(defaultExercise);
  const [sentences, setSentences] = useState([]);
  const [sentenceResults, setSentenceResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  
  // User interaction state
  const [userInput, setUserInput] = useState('');
  const [enterKeyPressCount, setEnterKeyPressCount] = useState(0);
  const [showFeedback, setShowFeedback] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [checkCapitalization, setCheckCapitalization] = useState(false);
  
  // Feedback screen state
  const [showFeedbackScreen, setShowFeedbackScreen] = useState(false);
  const [dictationTime, setDictationTime] = useState(0);
  const [dictationStartTime, setDictationStartTime] = useState(null);
  const [dictationResults, setDictationResults] = useState(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  
  const timerIntervalRef = useRef(null);
  
  // Update exercise if exerciseId prop changes
  useEffect(() => {
    const exercise = exercises.find(ex => ex.id === exerciseId) || exercises[0] || {};
    setSelectedExercise(exercise);
  }, [exerciseId, exercises]);
  
  // Timer effect to track dictation time
  useEffect(() => {
    if (exerciseStarted && dictationStartTime && !showFeedbackScreen) {
      // Clear any existing timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Start the timer interval
      timerIntervalRef.current = setInterval(() => {
        const elapsedSeconds = Math.floor((Date.now() - dictationStartTime) / 1000);
        setDictationTime(elapsedSeconds);
      }, 1000);
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [exerciseStarted, dictationStartTime, showFeedbackScreen]);
  
  /**
   * Starts the exercise
   */
  const startExercise = () => {
    debug('START_EXERCISE', 'Starting exercise');
    
    if (sentences.length > 0) {
      setSentenceResults([]);
      setUserInput('');
      setExerciseStarted(true);
      setEnterKeyPressCount(0);
      setDictationStartTime(Date.now());
    }
  };
  
  /**
   * Restarts the exercise
   */
  const handleRestart = () => {
    debug('RESTART', 'Restarting exercise');
    
    setSentenceResults([]);
    setUserInput('');
    setExerciseStarted(false);
    setEnterKeyPressCount(0);
    setShowFeedback(false);
    setShowFeedbackScreen(false);
    setDictationTime(0);
    setDictationStartTime(null);
  };
  
  /**
   * Handles exercise cancellation
   */
  const handleCancelExercise = () => {
    // Only show dialog if exercise has started
    if (exerciseStarted) {
      setIsConfirmDialogOpen(true);
    }
  };
  
  /**
   * Confirms exercise cancellation and shows results
   * @param {Function} processUserInput - Function to process current user input
   * @param {Function} prepareResultsData - Function to prepare results data
   * @param {Object} audioRef - React ref for the audio player
   */
  const confirmCancelExercise = (processUserInput, prepareResultsData, audioRef) => {
    debug('CANCEL_EXERCISE', 'confirmCancelExercise called');
    setIsConfirmDialogOpen(false);
    
    // Process current input if there is any
    if (userInput.trim() !== '' && processUserInput) {
      processUserInput();
    }
    
    // Stop any playback and clear timers
    if (audioRef && audioRef.current) {
      audioRef.current.pause();
    }
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Always prepare results and show feedback screen
    if (prepareResultsData) {
      prepareResultsData();
    }
    
    setShowFeedbackScreen(true);
  };
  
  /**
   * Closes the confirm dialog without canceling exercise
   */
  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
  };
  
  /**
   * Handles user input changes
   * @param {Object} e - Input change event
   */
  const handleInputChange = (e) => {
    // Get the raw input value
    let inputValue = e.target.value;
    
    // Apply real-time umlaut transformations
    inputValue = inputValue
      // Handle o-umlaut variations
      .replace(/oe/g, 'ö')
      .replace(/o\//g, 'ö')
      .replace(/o:/g, 'ö')
      // Handle a-umlaut variations
      .replace(/ae/g, 'ä')
      .replace(/a\//g, 'ä')
      .replace(/a:/g, 'ä')
      // Handle u-umlaut variations
      .replace(/ue/g, 'ü')
      .replace(/u\//g, 'ü')
      .replace(/u:/g, 'ü')
      // Handle eszett/sharp s
      .replace(/s\//g, 'ß');
    
    // Set the transformed input
    setUserInput(inputValue);
  };
  
  return {
    // Exercise state
    selectedExercise,
    sentences,
    sentenceResults,
    isLoading,
    exerciseStarted,
    
    // User interaction state
    userInput,
    enterKeyPressCount,
    showFeedback,
    showShortcuts,
    checkCapitalization,
    
    // Feedback screen state
    showFeedbackScreen,
    dictationTime,
    dictationStartTime,
    dictationResults,
    isConfirmDialogOpen,
    
    // Setters
    setSelectedExercise,
    setSentences,
    setSentenceResults,
    setIsLoading,
    setExerciseStarted,
    setUserInput,
    setEnterKeyPressCount,
    setShowFeedback,
    setShowShortcuts,
    setCheckCapitalization,
    setShowFeedbackScreen,
    setDictationTime,
    setDictationStartTime,
    setDictationResults,
    
    // Methods
    startExercise,
    handleRestart,
    handleCancelExercise,
    confirmCancelExercise,
    closeConfirmDialog,
    handleInputChange
  };
} 