import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import './DictationTool.css';

// Character-level feedback component with improved word skipping
const CharacterFeedback = ({ expected, actual, checkCapitalization = false }) => {
  // Skip if expected is empty
  if (!expected) return null;
  
  // Initialize with empty string for new behavior
  if (!actual) actual = '';
  
  // Normalize the strings by removing punctuation, multiple spaces, etc.
  const normalizeText = (text, preserveCase = false) => {
    // First handle the case
    let normalized = preserveCase ? text : text.toLowerCase();
    
    // Remove punctuation but preserve umlauts and special characters
    // This only removes actual punctuation, not letters like ä, ö, ü, ß
    normalized = normalized.replace(/[^\p{L}\p{N}\s]/gu, '');
    
    // Replace multiple spaces with single space and trim
    normalized = normalized.replace(/\s+/g, ' ').trim();
    
    return normalized;
  };
  
  // Function to remove punctuation from text while preserving umlauts
  const removePunctuation = (text) => {
    return text.replace(/[^\p{L}\p{N}\s]/gu, '');
  };
  
  // Get normalized versions for processing
  const normalizedExpected = normalizeText(expected, checkCapitalization);
  
  // Split expected and actual text into words, removing punctuation
  const expectedWords = expected.split(/\s+/);
  const actualWords = actual.split(/\s+/);
  
  // Find best matching positions for words (allows skipping words)
  const findBestWordMatches = () => {
    const result = [];
    let actualWordIndex = 0;
    
    // Process each expected word
    for (let i = 0; i < expectedWords.length; i++) {
      const expectedWord = expectedWords[i];
      const normalizedExpectedWord = normalizeText(expectedWord, checkCapitalization);
      
      // If we've run out of actual words, all remaining expected words are missing
      if (actualWordIndex >= actualWords.length) {
        result.push({
          type: 'missing',
          text: expectedWord
        });
      } else {
        let bestMatch = null;
        let bestScore = -1;
        let searchAhead = Math.min(3, actualWords.length - actualWordIndex); // Look ahead up to 3 words
        
        // Look ahead a few words to find the best match
        for (let j = 0; j < searchAhead; j++) {
          const candidateWord = actualWords[actualWordIndex + j];
          const normalizedCandidateWord = normalizeText(candidateWord, checkCapitalization);
          
          // Calculate match score (0-1)
          let score = 0;
          
          // When capitalization checking is enabled, compare with exact case match
          if ((checkCapitalization && candidateWord === expectedWord) || 
              (!checkCapitalization && normalizedCandidateWord === normalizedExpectedWord)) {
            score = 1; // Perfect match
          } else {
            // Partial match calculation - character by character
            const expectedForCompare = checkCapitalization ? expectedWord : normalizedExpectedWord;
            const candidateForCompare = checkCapitalization ? candidateWord : normalizedCandidateWord;
            const minLength = Math.min(expectedForCompare.length, candidateForCompare.length);
            let matchingChars = 0;
            
            for (let k = 0; k < minLength; k++) {
              if (expectedForCompare[k] === candidateForCompare[k]) {
                matchingChars++;
              }
            }
            
            score = matchingChars / Math.max(expectedForCompare.length, candidateForCompare.length);
          }
          
          // Track best match found
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { 
              index: actualWordIndex + j, 
              word: candidateWord,
              score: score
            };
          }
          
          // If we found a perfect match, stop looking
          if (score === 1) break;
        }
        
        // If we found a good enough match
        if (bestMatch && bestMatch.score > 0.5) {
          // Add any skipped words as extras - but ONLY in expected words positions
          for (let j = actualWordIndex; j < bestMatch.index; j++) {
            // Only add if we're still within expected words range
            if (result.length < expectedWords.length * 2 - 1) { // Account for spaces
              result.push({
                type: 'extra',
                text: actualWords[j]
              });
            }
          }
          
          // Add the matching word
          if (bestMatch.score === 1) {
            result.push({
              type: 'correct',
              text: expectedWord
            });
          } else {
            // Partial match - compare character by character
            result.push({
              type: 'partial',
              chars: compareChars(expectedWord, bestMatch.word, checkCapitalization)
            });
          }
          
          actualWordIndex = bestMatch.index + 1; // Move past this word
        } else {
          // No good match found, treat as missing
          result.push({
            type: 'missing',
            text: expectedWord
          });
        }
      }
      
      // Add space between words except for the last one
      if (i < expectedWords.length - 1) {
        result.push({
          type: 'space',
          text: ' '
        });
      }
    }
    
    // We no longer add remaining actual words as extras at the end
    
    return result;
  };
  
  // Helper function to compare characters in partially matching words
  const compareChars = (expected, actual, checkCase) => {
    const chars = [];
    
    // To avoid issues with capitalization mode, first normalize both strings
    // but preserve case if needed for capitalization checking
    const normalizedExpected = normalizeText(expected, checkCase);
    const normalizedActual = normalizeText(actual, checkCase);
    
    const expectedChars = normalizedExpected.split('');
    const actualChars = normalizedActual.split('');
    
    for (let j = 0; j < expectedChars.length; j++) {
      if (j < actualChars.length) {
        // User typed this character - check if correct
        // When checkCase is true, require EXACT case match of every character
        const isCharCorrect = checkCase
          ? actualChars[j] === expectedChars[j]
          : actualChars[j].toLowerCase() === expectedChars[j].toLowerCase();
          
        if (isCharCorrect) {
          // Correct character
          chars.push({
            type: 'char-correct',
            text: actualChars[j]
          });
        } else {
          // Incorrect character
          chars.push({
            type: 'char-incorrect',
            text: actualChars[j]
          });
        }
      } else {
        // User hasn't typed this character yet - use underscore placeholder
        chars.push({
          type: 'char-placeholder',
          text: '_'
        });
      }
    }
    
    // Limit extra characters to prevent them from appearing oddly
    const maxExtraChars = 2; // Only show up to 2 extra characters
    if (actualChars.length > expectedChars.length) {
      for (let j = expectedChars.length; j < Math.min(actualChars.length, expectedChars.length + maxExtraChars); j++) {
        chars.push({
          type: 'char-extra',
          text: actualChars[j]
        });
      }
    }
    
    return chars;
  };
  
  const diff = findBestWordMatches();
  
  return (
    <div className="character-feedback">
      {diff.map((item, index) => {
        switch (item.type) {
          case 'correct':
            return (
              <span key={index} className="word-correct">
                {item.text}
              </span>
            );
          case 'partial':
            return (
              <span key={index} className="word-partial">
                {item.chars.map((char, charIndex) => {
                  switch (char.type) {
                    case 'char-correct':
                      return <span key={charIndex} className="char-correct">{char.text}</span>;
                    case 'char-incorrect':
                      return <span key={charIndex} className="char-incorrect">{char.text}</span>;
                    case 'char-placeholder':
                      return <span key={charIndex} className="char-placeholder">{char.text}</span>;
                    case 'char-extra':
                      return <span key={charIndex} className="char-extra">{char.text}</span>;
                    default:
                      return null;
                  }
                })}
              </span>
            );
          case 'missing':
            return (
              <span key={index} className="word-missing">
                {/* Show underscores for missing words but without counting punctuation */}
                {'_'.repeat(Math.max(3, removePunctuation(item.text).length))}
              </span>
            );
          case 'extra':
            return (
              <span key={index} className="word-extra">
                {item.text}
              </span>
            );
          case 'space':
            return (
              <span key={index} className="word-space">
                {item.text}
              </span>
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

// Progress indicator component with adaptive display
const ProgressIndicator = ({ total, completed, current }) => {
  // Maximum number of dots to display
  const MAX_DOTS = 15;
  
  // Determine if we need to group sentences
  const needsGrouping = total > MAX_DOTS;
  
  // Calculate how many sentences each dot represents when grouping
  const groupRatio = needsGrouping ? Math.ceil(total / MAX_DOTS) : 1;
  
  // Create the array of dots
  const dots = [];
  
  // If grouping, we'll show fewer dots
  const dotsToShow = needsGrouping ? Math.min(MAX_DOTS, Math.ceil(total / groupRatio)) : total;
  
  for (let i = 0; i < dotsToShow; i++) {
    // Calculate the sentence range this dot represents
    const startSentence = i * groupRatio;
    const endSentence = Math.min(startSentence + groupRatio - 1, total - 1);
    
    // Determine if this dot includes the current sentence
    const includesCurrent = startSentence <= current && current <= endSentence;
    
    // Determine status class based on completed sentences in this group
    let statusClass = '';
    let allCorrect = true;
    let anyCompleted = false;
    
    // Check status of all sentences in this group
    for (let j = startSentence; j <= endSentence; j++) {
      if (j < completed.length && completed[j]) {
        anyCompleted = true;
        if (!completed[j].isCorrect) {
          allCorrect = false;
        }
      }
    }
    
    // Set status class for this dot
    if (anyCompleted) {
      statusClass = allCorrect ? 'correct' : 'incorrect';
    }
    
    // Add current class if this dot includes current sentence
    if (includesCurrent) {
      statusClass += ' current';
    }
    
    // Determine the title/tooltip
    let title;
    if (startSentence === endSentence) {
      title = `Sentence ${startSentence + 1}`;
    } else {
      title = `Sentences ${startSentence + 1} - ${endSentence + 1}`;
    }
    
    dots.push({
      index: i,
      statusClass,
      title
    });
  }
  
  return (
    <div className="progress-container">
      {dots.map((dot) => (
        <div 
          key={dot.index} 
          className={`progress-dot ${dot.statusClass}`}
          title={dot.title}
        />
      ))}
    </div>
  );
};

// Updated sample exercise with reference to actual files
const SAMPLE_EXERCISES = [
  {
    id: 1,
    title: "Chapter 1",
    audio: "/audio/chap01.mp3",
    vttFile: "/audio/chap01.vtt",
    level: "Intermediate"
  }
];

const DictationTool = ({ exerciseId = 1 }) => {
  // Find the selected exercise by ID or use the first one as default
  const defaultExercise = SAMPLE_EXERCISES.find(ex => ex.id === exerciseId) || SAMPLE_EXERCISES[0];
  const [selectedExercise, setSelectedExercise] = useState(defaultExercise);
  const [userInput, setUserInput] = useState('');
  const [sentences, setSentences] = useState([]);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sentenceResults, setSentenceResults] = useState([]);
  const [exerciseStarted, setExerciseStarted] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [navigationInProgress, setNavigationInProgress] = useState(false);
  const [enterKeyPressCount, setEnterKeyPressCount] = useState(0);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [checkCapitalization, setCheckCapitalization] = useState(false);
  
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const nextButtonRef = useRef(null);
  const currentIndexRef = useRef(0); // Keep track of current index for closures

  // Update the ref whenever state changes
  useEffect(() => {
    currentIndexRef.current = currentSentenceIndex;
  }, [currentSentenceIndex]);

  // Debug console logs for event tracking
  useEffect(() => {
    console.log('[ENTER KEY PRESS COUNT]:', enterKeyPressCount);
  }, [enterKeyPressCount]);

  // Debug navigation state
  useEffect(() => {
    console.log('[NAVIGATION STATE]:', {
      currentSentenceIndex,
      navigationInProgress,
      exerciseStarted,
      isPlaying,
      waitingForInput
    });
  }, [currentSentenceIndex, navigationInProgress, exerciseStarted, isPlaying, waitingForInput]);

  // Detect platform on component mount
  useEffect(() => {
    const isMacPlatform = navigator.platform.includes('Mac');
    setIsMac(isMacPlatform);
  }, []);

  // Update exercise if exerciseId prop changes
  useEffect(() => {
    const exercise = SAMPLE_EXERCISES.find(ex => ex.id === exerciseId) || SAMPLE_EXERCISES[0];
    setSelectedExercise(exercise);
  }, [exerciseId]);

  // Load VTT file and extract sentences with timing when exercise changes
  useEffect(() => {
    setIsLoading(true);
    setSentences([]);
    setCurrentSentenceIndex(0);
    currentIndexRef.current = 0;
    setUserInput('');
    setSentenceResults([]);
    setExerciseStarted(false);
    setEnterKeyPressCount(0);
    setWaitingForInput(false);
    setShowFeedback(false);
    
    fetch(selectedExercise.vttFile)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.text();
      })
      .then(vttContent => {
        const parsedSentences = parseVTTWithTiming(vttContent);
        setSentences(parsedSentences);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading VTT file:', error);
        setIsLoading(false);
      });
  }, [selectedExercise]);

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Improved focus management for the textarea
  useEffect(() => {
    // Focus input when audio stops playing or when exercise starts
    if (exerciseStarted && inputRef.current) {
      if (!isPlaying) {
        // Use a short timeout to ensure DOM is ready
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            console.log('[FOCUS]', 'Input field focused after audio stopped');
            setWaitingForInput(true);
          }
        }, 100);
      }
    }
  }, [isPlaying, exerciseStarted]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyboardShortcuts = (e) => {
      // Only apply shortcuts when exercise has started or to start the exercise
      if (isLoading) return;
      
      // Check for appropriate modifier key based on platform
      // Mac: Command key (metaKey), Windows/Linux: Ctrl key (ctrlKey)
      const isModifierKeyPressed = isMac ? e.metaKey : e.ctrlKey;
      
      if (isModifierKeyPressed) {
        switch (e.key) {
          case 'Enter':
            // Command/Ctrl+Enter: play/pause
            e.preventDefault();
            if (isPlaying) {
              audioRef.current?.pause();
            } else {
              if (!exerciseStarted) {
                // Start exercise if not already started
                handleStartExercise();
              } else {
                playCurrentSentence();
              }
            }
            break;
          
          case 'ArrowLeft':
            // Command/Ctrl+Left: previous sentence
            e.preventDefault();
            if (exerciseStarted) {
              handlePreviousSentence();
            }
            break;
          
          case 'ArrowRight':
            // Command/Ctrl+Right: next sentence
            e.preventDefault();
            if (exerciseStarted) {
              // Use a special version that doesn't require input
              goToNextSentence(true);
            }
            break;
          
          case 'ArrowUp':
            // Command/Ctrl+Up: repeat current sentence
            e.preventDefault();
            if (exerciseStarted) {
              playCurrentSentence();
            } else {
              // Start exercise if not already started
              handleStartExercise();
            }
            break;
          
          default:
            break;
        }
      }
    };

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [exerciseStarted, isLoading, isPlaying, currentSentenceIndex, isMac, navigationInProgress]);

  // Parse VTT file and extract sentences with timing info
  const parseVTTWithTiming = (vttContent) => {
    const lines = vttContent.split('\n');
    const parsedSentences = [];
    let currentSentence = {
      text: '',
      startTime: 0,
      endTime: 0
    };
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.includes('-->')) {
        // Extract timing information
        const times = line.split('-->').map(t => t.trim());
        const startTime = parseTimeToSeconds(times[0]);
        const endTime = parseTimeToSeconds(times[1]);
        
        currentSentence = {
          startTime,
          endTime,
          text: ''
        };
      } 
      else if (line !== '' && line !== 'WEBVTT' && !line.includes('-->')) {
        // This is the sentence text
        currentSentence.text = line;
        
        parsedSentences.push({ 
          ...currentSentence
        });
      }
    }
    
    return parsedSentences;
  };
  
  // Convert VTT time format (00:00:00.000) to seconds
  const parseTimeToSeconds = (timeStr) => {
    const parts = timeStr.split(':');
    let seconds = 0;
    
    if (parts.length === 3) {
      // Format: HH:MM:SS.mmm
      seconds = parseFloat(parts[0]) * 3600 + 
                parseFloat(parts[1]) * 60 + 
                parseFloat(parts[2]);
    } else if (parts.length === 2) {
      // Format: MM:SS.mmm
      seconds = parseFloat(parts[0]) * 60 + 
                parseFloat(parts[1]);
    }
    
    return seconds;
  };

  const handleInputChange = (e) => {
    setUserInput(e.target.value);
    // Always show feedback while typing (don't hide it)
  };

  // Try direct submission with lower-level DOM approach
  const submitInput = () => {
    if (nextButtonRef.current) {
      console.log('[DIRECT SUBMIT]', 'Directly clicking the next button');
      nextButtonRef.current.click();
    }
  };

  const handleKeyDown = (e) => {
    // Use the appropriate modifier key based on platform
    const isModifierKeyPressed = isMac ? e.metaKey : e.ctrlKey;
    
    if (e.key === 'Enter' && !isModifierKeyPressed && !navigationInProgress) {
      e.preventDefault();
      console.log('[ENTER KEY PRESSED]', {
        currentSentenceIndex,
        userInput,
        navigationInProgress,
        isPlaying
      });
      setEnterKeyPressCount(prev => prev + 1);
      
      // Try direct submission instead of calling handler
      submitInput();
    }
  };

  // This function plays the sentence at the specified index (or current index if not provided)
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
    
    const currentSentence = sentences[indexToPlay];
    
    if (audioRef.current) {
      // Set the current time to the start of the sentence
      audioRef.current.seekTo(currentSentence.startTime);
      // Play the audio
      audioRef.current.play();
      setIsPlaying(true);
      // Set a timeout to pause at the end of the sentence
      const duration = (currentSentence.endTime - currentSentence.startTime) * 1000;
      timeoutRef.current = setTimeout(() => {
        audioRef.current.pause();
        setIsPlaying(false);
        // Focus the input field
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            setWaitingForInput(true);
          }
        }, 100);
        timeoutRef.current = null;
      }, duration);
    }
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0 && !navigationInProgress) {
      console.log('[PREVIOUS SENTENCE]', 'Navigating to previous sentence');
      setNavigationInProgress(true);
      setWaitingForInput(false);
      // Don't hide feedback in real-time mode
      
      // Process current input if there is any
      if (userInput.trim() !== '') {
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
      setTimeout(() => {
        setUserInput('');
        playCurrentSentence(newIndex); // Pass the index explicitly
        setNavigationInProgress(false);
        console.log('[PREVIOUS SENTENCE]', 'Navigation completed');
      }, 100);
    }
  };

  const processUserInput = () => {
    console.log('[PROCESS INPUT]', 'Processing input for sentence', currentSentenceIndex);
    
    if (currentSentenceIndex >= sentences.length) return false;
    
    // Check current sentence
    const currentSentence = sentences[currentSentenceIndex];
    
    // Clean up expected text (remove punctuation, normalize spaces)
    const normalizeForComparison = (text, preserveCase = false) => {
      let normalized = text
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Only convert to lowercase if we're not checking capitalization
      if (!preserveCase) {
        normalized = normalized.toLowerCase();
      }
      
      return normalized;
    };
    
    // If capitalization is enabled, preserve case for comparison
    const expected = normalizeForComparison(currentSentence.text, checkCapitalization);
    const actual = normalizeForComparison(userInput, checkCapitalization);
    
    // Simple comparison for now - with capitalization settings applied
    const isCorrect = expected === actual;
    
    // Save result
    const newResults = [...sentenceResults];
    newResults[currentSentenceIndex] = {
      expected: currentSentence.text,
      actual: userInput,
      isCorrect
    };
    setSentenceResults(newResults);
    
    console.log('[PROCESS INPUT]', {
      expected,
      actual,
      isCorrect,
      resultsLength: newResults.filter(Boolean).length,
      checkingCapitalization: checkCapitalization
    });
    
    return isCorrect;
  };

  // Function to go to next sentence without requiring user input (for shortcuts)
  const goToNextSentence = (fromShortcut = false) => {
    console.log('[NEXT SENTENCE SHORTCUT]', 'Attempting to go to next sentence');
    
    if (currentSentenceIndex >= sentences.length - 1 || navigationInProgress) {
      console.log('[NEXT SENTENCE SHORTCUT]', 'Cannot navigate - invalid state');
      return; // Already at the last sentence or navigation in progress
    }
    
    setNavigationInProgress(true);
    setWaitingForInput(false);
    setShowFeedback(false);
    
    // If there's input, process it
    if (userInput.trim() !== '') {
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
    setTimeout(() => {
      setUserInput('');
      playCurrentSentence(newIndex); // Pass the index explicitly
      setNavigationInProgress(false);
      console.log('[NEXT SENTENCE SHORTCUT]', 'Navigation completed');
    }, 100);
  };

  const handleNextSentence = () => {
    console.log('[NEXT SENTENCE]', 'Button clicked/Enter pressed, attempting to go to next sentence', {
      userInput: userInput.trim(),
      navigationInProgress,
      currentSentenceIndex,
      waitingForInput
    });
    
    // For button clicks and Enter key, require input and prevent if navigation in progress
    // Enable force processing for first sentence
    const forceProcess = currentSentenceIndex === 0 && waitingForInput;
    
    // Check if we can proceed
    if ((userInput.trim() === '' && !forceProcess) || navigationInProgress) {
      console.log('[NEXT SENTENCE]', 'Blocked - empty input or navigation in progress', {
        inputEmpty: userInput.trim() === '',
        navigationInProgress,
        forceProcess
      });
      return;
    }
    
    // Process user input and save result
    if (userInput.trim() !== '') {
      const isCorrect = processUserInput();
      
      // Move to next sentence if not at the end
      if (currentSentenceIndex < sentences.length - 1) {
        console.log('[NEXT SENTENCE]', 'Moving to next sentence');
        setNavigationInProgress(true);
        setWaitingForInput(false);
        
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
        setTimeout(() => {
          setUserInput('');
          playCurrentSentence(newIndex); // Pass the index explicitly
          setNavigationInProgress(false);
          console.log('[NEXT SENTENCE]', 'Navigation completed');
        }, 100);
      } else {
        // End of exercise
        console.log('[NEXT SENTENCE]', 'Exercise completed!');
        setWaitingForInput(false);
      }
      return;
    }
    
    // Move to next sentence if not at the end
    if (currentSentenceIndex < sentences.length - 1) {
      console.log('[NEXT SENTENCE]', 'Moving to next sentence');
      setNavigationInProgress(true);
      setWaitingForInput(false);
      
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
      setTimeout(() => {
        setUserInput('');
        playCurrentSentence(newIndex); // Pass the index explicitly
        setNavigationInProgress(false);
        console.log('[NEXT SENTENCE]', 'Navigation completed');
      }, 100);
    } else {
      // End of exercise
      console.log('[NEXT SENTENCE]', 'Exercise completed!');
      setWaitingForInput(false);
    }
  };

  // Modified to handle audio playback with automatic exercise start
  const handleAudioPlayStateChange = (isAudioPlaying) => {
    setIsPlaying(isAudioPlaying);
    
    // If audio starts playing and exercise hasn't started yet, start the exercise
    if (isAudioPlaying && !exerciseStarted) {
      console.log('[AUTO START]', 'Starting exercise from audio play');
      startExercise();
    }
  };
  
  // Extract the startExercise logic into a separate function for reuse
  const startExercise = () => {
    console.log('[START EXERCISE]', 'Starting exercise');
    
    if (sentences.length > 0) {
      setCurrentSentenceIndex(0);
      currentIndexRef.current = 0;
      setSentenceResults([]);
      setUserInput('');
      setExerciseStarted(true);
      setEnterKeyPressCount(0);
      setWaitingForInput(false);
      
      // Small delay to ensure state updates before playing
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('[START EXERCISE]', 'Initial focus set on input field');
        }
      }, 100);
    }
  };

  // Update the handleStartExercise to use the extracted function
  const handleStartExercise = () => {
    startExercise();
    
    // Small delay to ensure state updates before playing
    setTimeout(() => {
      playCurrentSentence(0); // Explicitly play the first sentence
    }, 100);
  };

  const handleRestart = () => {
    console.log('[RESTART]', 'Restarting exercise');
    
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setCurrentSentenceIndex(0);
    currentIndexRef.current = 0;
    setSentenceResults([]);
    setUserInput('');
    setIsPlaying(false);
    setExerciseStarted(false);
    setNavigationInProgress(false);
    setEnterKeyPressCount(0);
    setWaitingForInput(false);
    setShowFeedback(false);
  };

  // Toggle shortcuts panel visibility
  const toggleShortcutsPanel = () => {
    setShowShortcuts(prev => !prev);
  };

  if (isLoading) {
    return <div className="loading">Loading exercise...</div>;
  }

  const isExerciseCompleted = currentSentenceIndex >= sentences.length && exerciseStarted && sentenceResults.length > 0;
  
  // Determine keyboard shortcut symbol based on platform
  const modifierKeySymbol = isMac ? '⌘' : 'Ctrl';
  
  const currentSentence = sentences[currentSentenceIndex];
  const currentResult = sentenceResults[currentSentenceIndex];
  
  return (
    <div className="dictation-tool">
      <div className="audio-section">
        <AudioPlayer 
          audioSrc={selectedExercise.audio} 
          ref={audioRef}
          onPlayStateChange={handleAudioPlayStateChange}
        />
      </div>
      
      <div className="keyboard-shortcuts-info">
        <button 
          className="shortcuts-toggle"
          onClick={toggleShortcutsPanel}
        >
          Keyboard Shortcuts
        </button>
        <div className={`shortcuts-panel ${showShortcuts ? 'show' : ''}`}>
          <ul>
            <li><kbd>{modifierKeySymbol}</kbd> + <kbd>Enter</kbd>: Play/Pause</li>
            <li><kbd>{modifierKeySymbol}</kbd> + <kbd>←</kbd>: Previous sentence</li>
            <li><kbd>{modifierKeySymbol}</kbd> + <kbd>→</kbd>: Next sentence</li>
            <li><kbd>{modifierKeySymbol}</kbd> + <kbd>↑</kbd>: Repeat current sentence</li>
          </ul>
        </div>
      </div>
      
      {!isExerciseCompleted ? (
        <div className="input-section">
          {exerciseStarted && (
            <>
              {/* Progress indicator */}
              <ProgressIndicator 
                total={sentences.length}
                completed={sentenceResults}
                current={currentSentenceIndex}
              />
              
              {/* Real-time character feedback displayed above input */}
              {currentSentence && (
                <div className="feedback-container real-time">
                  <CharacterFeedback 
                    expected={currentSentence.text} 
                    actual={userInput} 
                    checkCapitalization={checkCapitalization}
                  />
                </div>
              )}
              
              <textarea
                ref={inputRef}
                className={`dictation-input ${isPlaying ? 'is-playing' : 'is-waiting'}`}
                value={userInput}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type what you hear, then press Enter..."
                disabled={isPlaying}
                autoFocus
              />
              
              <div className="options-container">
                <button 
                  className={`capitalization-toggle ${checkCapitalization ? 'active' : ''}`}
                  onClick={() => setCheckCapitalization(prev => !prev)}
                  title={`Case Sensitivity: ${checkCapitalization ? 'Strict (Hard Mode)' : 'Relaxed (Normal Mode)'}`}
                >
                  Aa
                </button>
              </div>
              
              <div className="action-buttons">
                <button 
                  ref={nextButtonRef}
                  className="next-button"
                  onClick={handleNextSentence}
                  disabled={!userInput.trim() || navigationInProgress}
                >
                  Next Sentence
                </button>
                
                <button 
                  className="play-again-button"
                  onClick={playCurrentSentence}
                  disabled={navigationInProgress}
                >
                  Play Again
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="results-section">
          <h3>Exercise Complete</h3>
          
          {sentenceResults.map((result, index) => (
            result && (
              <div 
                key={index} 
                className={`sentence-result ${result.isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="sentence-number">Sentence {index + 1}:</div>
                <div className="expected">Expected: {result.expected}</div>
                <div className="actual">Your input: {result.actual}</div>
              </div>
            )
          ))}
          
          <button 
            className="restart-button"
            onClick={handleRestart}
          >
            Restart Exercise
          </button>
        </div>
      )}
    </div>
  );
};

export default DictationTool; 