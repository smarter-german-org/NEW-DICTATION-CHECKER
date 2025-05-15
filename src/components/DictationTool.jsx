import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import ConfirmDialog from './ConfirmDialog';
import DictationFeedback from './DictationFeedback';
import { 
  alignWords,
  normalizeText,
  removePunctuation,
  isPunctuation,
  levenshteinDistance,
  areSimilarWords,
  isPartOfCompoundWord
} from '../utils/textUtils';
import { debug } from '../utils/debug';
import './DictationTool.css';

// Character-level feedback component with improved word skipping
const CharacterFeedback = ({ expected, actual, checkCapitalization = false }) => {
  // Skip if expected is empty
  if (!expected) return null;
  
  // Initialize with empty string for new behavior
  if (!actual) actual = '';
  
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
        // Increase search ahead to better handle skipped words - look at more candidates
        let searchAhead = Math.min(5, actualWords.length - actualWordIndex); // Look ahead up to 5 words (increased from 3)
        
        // Look ahead a few words to find the best match
        for (let j = 0; j < searchAhead; j++) {
          const candidateWord = actualWords[actualWordIndex + j];
          const normalizedCandidateWord = normalizeText(candidateWord, checkCapitalization);
          
          // Calculate match score (0-1)
          let score = 0;
          
          // First check for exact match with proper capitalization handling
          if (checkCapitalization) {
            // Normalize both words for umlauts before checking capitalization
            const normalizedCandidate = normalizeText(candidateWord, true);
            const normalizedExpected = normalizeText(expectedWord, true);
            
            // When checking capitalization, require exact match but with umlaut normalization
            if (normalizedCandidate === normalizedExpected) {
              score = 1;
            }
            // Special case when case is different but spelling is similar (e.g., "balin" vs "Berlin")
            else if (normalizedCandidate.toLowerCase() === normalizedExpected.toLowerCase()) {
              score = 0.95; // High score for same word with different case
            }
            // If no exact match but similar spelling, give higher score than usual
            else if (areSimilarWords(normalizedCandidate.toLowerCase(), normalizedExpected.toLowerCase())) {
              const dist = levenshteinDistance(normalizedCandidate.toLowerCase(), normalizedExpected.toLowerCase());
              const longerLength = Math.max(normalizedCandidate.length, normalizedExpected.length);
              score = 0.6 + 0.3 * (1 - dist / longerLength); // Higher base score in capitalization mode
            }
          } else {
            // When not checking capitalization, compare lowercase versions
            // Both should already be normalized at this point
            if (normalizedCandidateWord === normalizedExpectedWord) {
              score = 1;
            }
          }
          
          // Check for compound word match (e.g., "morgen" in "Montagmorgen")
          if (score < 0.9 && isPartOfCompoundWord(
            candidateWord,
            expectedWord
          )) {
            // If it's a substring, give it a good but not perfect score
            score = 0.85;
          }
          
          // Use Levenshtein for similar words
          if (score < 0.8 && areSimilarWords(
            checkCapitalization ? expectedWord : normalizedExpectedWord,
            checkCapitalization ? candidateWord : normalizedCandidateWord
          )) {
            // Calculate a score based on normalized Levenshtein distance
            const dist = levenshteinDistance(
              checkCapitalization ? expectedWord : normalizedExpectedWord,
              checkCapitalization ? candidateWord : normalizedCandidateWord
            );
            const longerLength = Math.max(
              (checkCapitalization ? expectedWord : normalizedExpectedWord).length,
              (checkCapitalization ? candidateWord : normalizedCandidateWord).length
            );
            score = 0.5 + 0.4 * (1 - dist / longerLength); // Score between 0.5 and 0.9 for similar words
          } 
          else if (score < 0.5) {
            // Less similar words - use character matching as fallback
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
          
          // Special case for common small words like "in", "ihr", etc.
          if (score < 0.8 && 
             (expectedWord.toLowerCase() === 'in' || 
              expectedWord.toLowerCase() === 'ihr' || 
              expectedWord.toLowerCase() === 'ist' || 
              expectedWord.toLowerCase() === 'es' ||
              expectedWord.toLowerCase() === 'der' ||
              expectedWord.toLowerCase() === 'die' ||
              expectedWord.toLowerCase() === 'das')) {
            // For these common short words, be more lenient with the exact match 
            if (candidateWord.toLowerCase() === expectedWord.toLowerCase()) {
              score = 0.95; // Nearly perfect match for common small words
            }
          }
          
          // Apply a position penalty for words that are far away from their expected position
          // This helps maintain proper word order when words are skipped
          if (score > 0.4) {
            // Reduced penalty when checking capitalization is enabled
            // This helps words like "balin" match with "Berlin" even with capitalization check
            const positionPenalty = checkCapitalization ? 
              j * 0.01 : // Only 1% penalty per position when checkCapitalization is true
              j * 0.03;  // Regular 3% penalty otherwise
            score = Math.max(0.4, score - positionPenalty);
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
          if (score > 0.95) break;
        }
        
        // Lower the threshold for words that are likely misspellings
        const similarityThreshold = 0.38; // Lowered from 0.4 to be more lenient
        
        // If we found a good enough match
        if (bestMatch && bestMatch.score > similarityThreshold) {
          // Add any skipped words as extras - but ONLY in expected words positions
          for (let j = actualWordIndex; j < bestMatch.index; j++) {
            // Only add if we're still within expected words range
            if (result.length < expectedWords.length * 2 - 1) { // Account for spaces
              result.push({
                type: 'extra',
                text: actualWords[j]
              });
              
              // Add a space after each extra word (except the last one before the match)
              if (j < bestMatch.index - 1) {
                result.push({
                  type: 'space',
                  text: ' '
                });
              }
            }
          }
          
          // Add the matching word
          if (bestMatch.score >= 0.9) {
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
          // No good match found for the expected word - mark as missing
          result.push({
            type: 'missing',
            text: expectedWord
          });
          
          // Don't increment actualWordIndex here, so we can try to match
          // the same actual word with the next expected word
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
    
    // Add any remaining actual words that weren't matched
    // This ensures words like "bureau" are shown even when they don't match any expected word
    while (actualWordIndex < actualWords.length) {
      // Add a space before adding the extra word (if not at the beginning)
      if (result.length > 0 && result[result.length - 1].type !== 'space') {
        result.push({
          type: 'space',
          text: ' '
        });
      }
      
      // Add the unmatched actual word
      result.push({
        type: 'extra',
        text: actualWords[actualWordIndex]
      });
      actualWordIndex++;
    }
    
    return result;
  };
  
  // Helper function to compare characters in partially matching words
  const compareChars = (expected, actual, checkCase) => {
    const chars = [];
    
    if (!expected || !actual) {
      debug('COMPARE_CHARS', 'Missing expected or actual text');
      return chars;
    }
    
    // Special case for when capitalization is enabled but the words match case-insensitively
    // (e.g., "büro" vs "Büro") - we want to mark just the incorrectly cased characters
    if (checkCase && expected && actual && expected.toLowerCase() === actual.toLowerCase()) {
      // Characters match but possibly with different case
      for (let i = 0; i < actual.length; i++) {
        const expectedChar = expected[i];
        const actualChar = actual[i];
        
        // Only the case difference should be marked incorrect
        const isMatch = expectedChar === actualChar;
        
        chars.push({
          type: isMatch ? 'char-correct' : 'char-incorrect',
          text: actualChar
        });
      }
      debug('COMPARE_CHARS', 'Case mismatch only');
      return chars;
    }
    
    // Check for compound word match first (like "morgen" in "Montagmorgen")
    if (expected && actual && expected.toLowerCase().includes(actual.toLowerCase())) {
      // Find the position where the actual word appears in the expected word
      const actualLower = actual.toLowerCase();
      const expectedLower = expected.toLowerCase();
      const startPos = expectedLower.indexOf(actualLower);
      
      // Add placeholders for prefix characters
      for (let i = 0; i < startPos; i++) {
        const expectedChar = expected[i];
        chars.push({
          type: 'char-placeholder',
          // Always preserve punctuation characters rather than using underscore
          text: isPunctuation(expectedChar) ? expectedChar : '_'
        });
      }
      
      // Add the matched part (with case-sensitivity check if needed)
      for (let i = 0; i < actual.length; i++) {
        const expectedChar = expected[startPos + i];
        const actualChar = actual[i];
        
        // When checking capitalization, characters must match exactly
        // Otherwise, case is ignored
        const isMatch = checkCase 
          ? expectedChar === actualChar
          : expectedChar.toLowerCase() === actualChar.toLowerCase();
        
        chars.push({
          type: isMatch ? 'char-correct' : 'char-incorrect',
          text: actualChar
        });
      }
      
      // Add placeholders for suffix characters
      for (let i = startPos + actual.length; i < expected.length; i++) {
        const expectedChar = expected[i];
        chars.push({
          type: 'char-placeholder',
          // Always preserve punctuation characters rather than using underscore
          text: isPunctuation(expectedChar) ? expectedChar : '_'
        });
      }
      
      return chars;
    }
    
    // If actual is in expected (like "morgen" in "Montagmorgen") in reverse
    if (expected && actual && actual.toLowerCase().includes(expected.toLowerCase())) {
      // Find the position where the expected word appears in the actual word
      const actualLower = actual.toLowerCase();
      const expectedLower = expected.toLowerCase();
      const startPos = actualLower.indexOf(expectedLower);
      
      // First add any extra characters at the beginning
      for (let i = 0; i < startPos; i++) {
        chars.push({
          type: 'char-extra',
          text: actual[i]
        });
      }
      
      // Add the matched part
      for (let i = 0; i < expected.length; i++) {
        const expectedChar = expected[i];
        const actualChar = actual[startPos + i];
        
        // Check if characters match (with case sensitivity if needed)
        const isMatch = checkCase 
          ? expectedChar === actualChar
          : expectedChar.toLowerCase() === actualChar.toLowerCase();
        
        chars.push({
          type: isMatch ? 'char-correct' : 'char-incorrect',
          text: actualChar
        });
      }
      
      // Add any extra characters at the end
      for (let i = startPos + expected.length; i < actual.length; i++) {
        chars.push({
          type: 'char-extra',
          text: actual[i]
        });
      }
      
      return chars;
    }
    
    // To avoid issues with capitalization mode, first normalize both strings
    // but preserve case if needed for capitalization checking
    const normalizedExpected = normalizeText(expected, checkCase);
    const normalizedActual = normalizeText(actual, checkCase);
    
    // For improved character matching in misspelled words, use a variation
    // of the Levenshtein algorithm to highlight in-place differences
    
    // Work with the original strings but use normalized for comparison
    const expectedChars = expected.split('');
    const actualChars = actual.split('');
    
    // If one of the strings is much longer than the other, try to align them better
    // This helps with cases where letters were added/omitted in the middle
    let offsetExpected = 0;
    let offsetActual = 0;
    
    // Compare character by character with dynamic adjustment
    while (offsetExpected < expectedChars.length) {
      const charExpected = expectedChars[offsetExpected];
      
      // Handle punctuation in the expected text
      if (isPunctuation(charExpected)) {
        // If we have an exact match for punctuation, mark it correct
        if (offsetActual < actualChars.length && charExpected === actualChars[offsetActual]) {
          chars.push({
            type: 'char-correct',
            text: charExpected
          });
          offsetActual++; // Move both pointers
        } else {
          // Missing punctuation - always show the actual punctuation character
          chars.push({
            type: 'char-placeholder',
            text: charExpected // Always display the punctuation character, never underscore
          });
        }
        offsetExpected++;
        continue;
      }
      
      // If we've reached the end of the actual text
      if (offsetActual >= actualChars.length) {
        // User hasn't typed this character yet
        const expectedChar = expectedChars[offsetExpected];
        chars.push({
          type: 'char-placeholder',
          // Always preserve punctuation characters rather than using underscore
          text: isPunctuation(expectedChar) ? expectedChar : '_'
        });
        offsetExpected++;
        continue;
      }
      
      const charActual = actualChars[offsetActual];
      
      // If actual char is punctuation but expected is not
      if (isPunctuation(charActual)) {
        chars.push({
          type: 'char-incorrect',
          text: charActual
        });
        offsetActual++;
        continue;
      }
      
      // When checkCase is true, require EXACT case match of every character
      const isCharCorrect = checkCase
        ? charExpected === charActual  // Exact match including case
        : charExpected.toLowerCase() === charActual.toLowerCase();  // Case-insensitive match
        
      if (isCharCorrect) {
        // Correct character
        chars.push({
          type: 'char-correct',
          text: charActual 
        });
        offsetExpected++;
        offsetActual++;
      } else {
        // Look ahead for potential alignment
        const lookAheadLimit = 3;
        let foundMatch = false;
        
        // Check if we can find this expected character later in the actual text
        for (let i = 1; i <= lookAheadLimit && offsetActual + i < actualChars.length; i++) {
          if ((checkCase && expectedChars[offsetExpected] === actualChars[offsetActual + i]) ||
              (!checkCase && expectedChars[offsetExpected].toLowerCase() === actualChars[offsetActual + i].toLowerCase())) {
            // Found a match ahead, mark characters in between as incorrect
            for (let j = 0; j < i; j++) {
              chars.push({
                type: 'char-incorrect',
                text: actualChars[offsetActual + j]
              });
            }
            offsetActual += i;
            foundMatch = true;
            break;
          }
        }
        
        // If no match found ahead in actual text, check if character was omitted 
        if (!foundMatch) {
          // See if next actual character matches with a later expected character
          for (let i = 1; i <= lookAheadLimit && offsetExpected + i < expectedChars.length; i++) {
            if ((checkCase && expectedChars[offsetExpected + i] === actualChars[offsetActual]) || 
                (!checkCase && expectedChars[offsetExpected + i].toLowerCase() === actualChars[offsetActual].toLowerCase())) {
              // Found a match later in expected - user omitted characters
              for (let j = 0; j < i; j++) {
                chars.push({
                  type: 'char-placeholder',
                  text: '_'
                });
                offsetExpected++;
              }
              foundMatch = true;
              break;
            }
          }
        }
        
        // If still no alignment found, just mark as incorrect and move both pointers
        if (!foundMatch) {
          chars.push({
            type: 'char-incorrect',
            text: charActual
          });
          offsetActual++;
          offsetExpected++;
        }
      }
    }
    
    // Add any remaining actual characters as extra
    while (offsetActual < actualChars.length) {
      chars.push({
        type: 'char-extra',
        text: actualChars[offsetActual]
      });
      offsetActual++;
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
            // Always show extra words
            const needsSpace = index > 0 && diff[index-1]?.type !== 'space';
            return (
              <span key={index} className="word-extra">
                {needsSpace && ' '}{item.text}
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
  
  // New states for feedback and confirmation
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [showFeedbackScreen, setShowFeedbackScreen] = useState(false);
  const [dictationTime, setDictationTime] = useState(0);
  const [dictationStartTime, setDictationStartTime] = useState(null);
  const [dictationResults, setDictationResults] = useState(null);
  
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const currentIndexRef = useRef(0); // Keep track of current index for closures

  // Update the ref whenever state changes
  useEffect(() => {
    currentIndexRef.current = currentSentenceIndex;
  }, [currentSentenceIndex]);

  // Debug console logs for event tracking
  useEffect(() => {
    debug('ENTER_KEY', enterKeyPressCount);
  }, [enterKeyPressCount]);

  // Debug navigation state
  useEffect(() => {
    debug('NAVIGATION_STATE', {
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
    setShowFeedbackScreen(false);
    setDictationTime(0);
    setDictationStartTime(null);
    
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

  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Improved focus management for the textarea
  useEffect(() => {
    // Focus input when audio stops playing or when exercise starts
    if (exerciseStarted && inputRef.current) {
      if (!isPlaying) {
        // Only focus if the audio has stopped naturally (not from keyboard events)
        // Use a short timeout to ensure DOM is ready
        setTimeout(() => {
          if (inputRef.current && !isPlaying) {
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

  const submitInput = () => {
    // Call the handler directly instead of clicking a button
    debug('DIRECT_SUBMIT', 'Directly calling handleNextSentence');
    handleNextSentence();
  };

  const handleKeyDown = (e) => {
    // Use the appropriate modifier key based on platform
    const isModifierKeyPressed = isMac ? e.metaKey : e.ctrlKey;
    
    // Only handle key events when we're not playing audio
    if (isPlaying) {
      return; // Don't process keypresses while audio is playing
    }
    
    if (e.key === 'Enter' && !isModifierKeyPressed && !navigationInProgress && !isPlaying) {
      e.preventDefault(); // Prevent default Enter behavior that might trigger audio skip
      debug('ENTER_KEY_PRESSED', {
        currentSentenceIndex,
        userInput,
        navigationInProgress,
        isPlaying,
        waitingForInput
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
    setIsPlaying(true);
    
    const currentSentence = sentences[indexToPlay];
    
    if (audioRef.current) {
      debug('PLAY_SENTENCE', "Playing sentence at index:", indexToPlay, "starting at time:", currentSentence.startTime, "ending at:", currentSentence.endTime);
      
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
        console.error("Error in audio playback:", error);
        setIsPlaying(false);
      }
    }
  };

  // Add a new function to handle repeating the current sentence
  const repeatCurrentSentence = () => {
    if (audioRef.current && sentences.length > 0) {
      const currentSentence = sentences[currentIndexRef.current];
      if (currentSentence) {
        playCurrentSentence(currentIndexRef.current);
      }
    }
  };

  const handlePreviousSentence = () => {
    if (currentSentenceIndex > 0 && !navigationInProgress) {
      debug('PREVIOUS_SENTENCE', 'Navigating to previous sentence');
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
        debug('PREVIOUS_SENTENCE', 'Navigation completed');
      }, 100);
    }
  };

  const processUserInput = () => {
    debug('PROCESS_INPUT', 'Processing input for sentence', currentSentenceIndex);
    
    if (currentSentenceIndex >= sentences.length) return false;
    
    // Check current sentence
    const currentSentence = sentences[currentSentenceIndex];
    
    // Clean up expected text (remove punctuation, normalize spaces)
    const normalizeForComparison = (text, preserveCase = false) => {
      // First normalize German umlaut alternatives
      let normalized = text;
      
      // Handle common umlaut alternative notations (before punctuation removal)
      normalized = normalized
        // Handle o-umlaut variations (prioritize this for "schoener" case)
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
      
      // Special case for common problematic words
      if (normalized.toLowerCase() === 'schoener') normalized = 'schöner';
      if (normalized.toLowerCase() === 'schoen') normalized = 'schön';
      if (normalized.toLowerCase() === 'felle') normalized = 'fälle';
      
      // Then remove punctuation and normalize spaces
      normalized = normalized
        .replace(/[^\p{L}\p{N}\s]/gu, '')
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
    
    debug('PROCESS_INPUT', {
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
    debug('NEXT_SENTENCE_SHORTCUT', 'Attempting to go to next sentence');
    
    if (currentSentenceIndex >= sentences.length - 1 || navigationInProgress) {
      // If at the last sentence, process input and show feedback
      if (userInput.trim() !== '') {
        processUserInput();
      }
      prepareResultsData();
      setShowFeedbackScreen(true);
      setIsPlaying(false);
      setCurrentSentenceIndex(sentences.length);
      return;
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
    debug('NEXT_SENTENCE', 'Button clicked/Enter pressed, attempting to go to next sentence', {
      userInput: userInput.trim(),
      navigationInProgress,
      currentSentenceIndex,
      waitingForInput
    });
    
    // For button clicks and Enter key, don't require waitingForInput state
    // Only check for navigation in progress and empty input
    // Enable force processing for first sentence
    const forceProcess = currentSentenceIndex === 0;
    
    // Check if we can proceed
    if ((userInput.trim() === '' && !forceProcess) || navigationInProgress) {
      debug('NEXT_SENTENCE', 'Blocked - empty input or navigation in progress', {
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
        console.log('[NEXT SENTENCE]', 'Exercise completed! (userInput branch)');
        setWaitingForInput(false);
        prepareResultsData();
        setShowFeedbackScreen(true);
        setCurrentSentenceIndex(sentences.length);
      }
      return;
    }
    
    // Move to next sentence if not at the end
    if (currentSentenceIndex < sentences.length - 1) {
      console.log('[NEXT SENTENCE]', 'Moving to next sentence (no userInput)');
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
        console.log('[NEXT SENTENCE]', 'Navigation completed (no userInput)');
      }, 100);
    } else {
      // End of exercise
      console.log('[NEXT SENTENCE]', 'Exercise completed! (no userInput branch)');
      setWaitingForInput(false);
      prepareResultsData();
      setShowFeedbackScreen(true);
      setCurrentSentenceIndex(sentences.length);
    }
  };

  // Modified to handle audio playback with automatic exercise start
  const handleAudioPlayStateChange = (isAudioPlaying) => {
    setIsPlaying(isAudioPlaying);
    
    // If audio starts playing and exercise hasn't started yet, start the exercise
    if (isAudioPlaying && !exerciseStarted) {
      debug('AUTO_START', 'Starting exercise from audio play');
      startExercise();
    }
    
    // When audio stops, focus the input field
    if (!isAudioPlaying && exerciseStarted) {
      debug('AUDIO_STOPPED', 'Audio playback stopped, focusing input field');
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          setWaitingForInput(true);
        }
      }, 100);
    }
  };
  
  // Extract the startExercise logic into a separate function for reuse
  const startExercise = () => {
    debug('START_EXERCISE', 'Starting exercise');
    
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
          debug('START_EXERCISE', 'Initial focus set on input field');
        }
      }, 100);
    }
  };

  // Update the handleStartExercise to use the extracted function
  const handleStartExercise = () => {
    startExercise();
    
    // Set the start time when exercise begins
    setDictationStartTime(Date.now());
    
    // Small delay to ensure state updates before playing
    setTimeout(() => {
      playCurrentSentence(0); // Explicitly play the first sentence
    }, 100);
  };

  const handleRestart = () => {
    debug('RESTART', 'Restarting exercise');
    
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

  // Extra cleanup to ensure audio stops on unmount 
  useEffect(() => {
    return () => {
      // Stop any playback and clear timeouts on unmount or prop change
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [selectedExercise]);

  // Handler for cancel button click
  const handleCancelExercise = () => {
    // Only show dialog if exercise has started
    if (exerciseStarted) {
      setIsConfirmDialogOpen(true);
    }
  };
  
  // Confirm cancel and show results
  const confirmCancelExercise = () => {
    debug('CANCEL_EXERCISE', 'confirmCancelExercise called');
    setIsConfirmDialogOpen(false);
    // Process current input if there is any
    if (userInput.trim() !== '') {
      processUserInput();
    }
    // Stop any playback and clear timers
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    // Always prepare results and show feedback screen
    prepareResultsData();
    setShowFeedbackScreen(true);
    setIsPlaying(false);
  };
  
  // Cancel the dialog without canceling exercise
  const closeConfirmDialog = () => {
    setIsConfirmDialogOpen(false);
  };
  
  // Prepare data for feedback screen
  const prepareResultsData = () => {
    debug('PREPARE_RESULTS_DATA', 'called');
    // Calculate various statistics for the feedback
    const totalSentences = sentences.length;
    // Get all sentences with their results, including empty results for skipped sentences
    const allSentenceResults = [...sentenceResults];
    // Ensure we have entries for all sentences (even if user skipped some)
    while (allSentenceResults.length < sentences.length) {
      allSentenceResults.push(null);
    }
    // Count total words in ALL sentences from the VTT file
    const referenceWords = sentences
      .flatMap(sentence => sentence.text.split(/\s+/).filter(Boolean));
    const userWords = allSentenceResults
      .filter(Boolean)
      .flatMap(result => result.actual.split(/\s+/).filter(Boolean));
    // Smart alignment (pass checkCapitalization)
    const alignment = alignWords(referenceWords, userWords, checkCapitalization);
    let correct = 0, mistakes = 0, insertions = 0, deletions = 0, substitutions = 0;
    alignment.forEach(pair => {
      if (pair.op === 'match') correct++;
      else if (pair.op === 'sub') { mistakes++; substitutions++; }
      else if (pair.op === 'ins') { mistakes++; insertions++; }
      else if (pair.op === 'del') { mistakes++; deletions++; }
    });
    const resultsObj = {
      totalSentences,
      completedSentences: allSentenceResults.filter(Boolean).length,
      referenceWords,
      userWords,
      correct,
      mistakes,
      insertions,
      deletions,
      substitutions,
      totalWordsInAllText: referenceWords.length
    };
    debug('SET_DICTATION_RESULTS', resultsObj);
    setDictationResults(resultsObj);
  };
  
  // Handle restart from feedback screen
  const handleRestartFromFeedback = () => {
    setShowFeedbackScreen(false);
    handleRestart();
  };

  const isExerciseCompleted = currentSentenceIndex >= sentences.length && exerciseStarted && sentenceResults.length > 0;
  
  // If exercise is completed, show the feedback screen
  useEffect(() => {
    if (isExerciseCompleted && !showFeedbackScreen) {
      // Stop timers
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      
      // Prepare results and show feedback
      prepareResultsData();
      setShowFeedbackScreen(true);
    }
  }, [isExerciseCompleted, showFeedbackScreen]);
  
  // Determine keyboard shortcut symbol based on platform
  const modifierKeySymbol = isMac ? '⌘' : 'Ctrl';
  
  const currentSentence = sentences[currentSentenceIndex];
  const currentResult = sentenceResults[currentSentenceIndex];
  
  // Ensure dictationResults is set when feedback screen is shown
  useEffect(() => {
    if (showFeedbackScreen && !dictationResults) {
      debug('FORCE_PREPARE_RESULTS_DATA', 'useEffect triggered');
      prepareResultsData();
    }
  }, [showFeedbackScreen, dictationResults]);
  
  if (isLoading) {
    return <div className="loading">Loading exercise...</div>;
  }

  // Show feedback screen if completed or canceled
  if (showFeedbackScreen) {
    if (!dictationResults) {
      return <div className="loading">Loading results...</div>;
    }
    return (
      <DictationFeedback 
        dictationResults={dictationResults}
        sentenceResults={sentenceResults}
        totalTime={dictationTime}
        onRestart={handleRestartFromFeedback}
      />
    );
  }

  // TEMP: Manual Show Results button for debugging
  // Place this just before the return statement
  return (
    <div className="dictation-tool">
      <div className="audio-section">
        <AudioPlayer 
          audioSrc={selectedExercise.audio} 
          ref={audioRef}
          onPlayStateChange={handleAudioPlayStateChange}
          checkCapitalization={checkCapitalization}
          onToggleCapitalization={() => setCheckCapitalization(prev => !prev)}
          onEnded={() => {
            debug("AUDIO_ENDED", "Audio has reached the end of a sentence");
            setIsPlaying(false);
            if (inputRef.current) {
              setTimeout(() => {
                inputRef.current.focus();
                setWaitingForInput(true);
              }, 100);
            }
          }}
          onPrevious={handlePreviousSentence}
          onNext={() => goToNextSentence(true)}
          onCancel={handleCancelExercise}
        />
      </div>
      
      {/* Confirmation Dialog */}
      <ConfirmDialog 
        isOpen={isConfirmDialogOpen}
        title="End Dictation Exercise"
        message="Are you sure you want to end this dictation exercise? Your progress will be saved and results will be shown."
        confirmText="End Exercise"
        cancelText="Continue Exercise"
        onConfirm={confirmCancelExercise}
        onCancel={closeConfirmDialog}
      />
      
      <div className="keyboard-shortcuts-info">
        <button 
          className="shortcuts-toggle"
          onClick={toggleShortcutsPanel}
        >
          Keyboard Shortcuts
        </button>
        <div className={`shortcuts-panel ${showShortcuts ? 'show' : ''}`}>
          <div className="shortcut-row">
            <div className="shortcut-keys">
              <kbd>{modifierKeySymbol}</kbd> + <kbd>Enter</kbd>
            </div>
            <div className="shortcut-description">: Play/Pause</div>
          </div>
          <div className="shortcut-row">
            <div className="shortcut-keys">
              <kbd>{modifierKeySymbol}</kbd> + <kbd>←</kbd>
            </div>
            <div className="shortcut-description">: Previous sentence</div>
          </div>
          <div className="shortcut-row">
            <div className="shortcut-keys">
              <kbd>{modifierKeySymbol}</kbd> + <kbd>→</kbd>
            </div>
            <div className="shortcut-description">: Next sentence</div>
          </div>
          <div className="shortcut-row">
            <div className="shortcut-keys">
              <kbd>{modifierKeySymbol}</kbd> + <kbd>↑</kbd>
            </div>
            <div className="shortcut-description">: Repeat current sentence</div>
          </div>
        </div>
      </div>
      
      {!isExerciseCompleted ? (
        <div className="input-section">
          {exerciseStarted ? (
            <>
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
              
              <div className="dictation-input-area">
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
              </div>
            </>
          ) : (
            <div className="start-section">
              <button 
                className="start-button"
                onClick={handleStartExercise}
                disabled={isLoading}
              >
                Start Dictation
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default DictationTool; 