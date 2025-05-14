import React, { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import ConfirmDialog from './ConfirmDialog';
import DictationFeedback from './DictationFeedback';
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
  
  // Custom function to identify punctuation characters
  const isPunctuation = (char) => {
    return /[^\p{L}\p{N}\s]/gu.test(char);
  };
  
  // Calculate Levenshtein distance between two strings
  const levenshteinDistance = (str1, str2) => {
    const m = str1.length;
    const n = str2.length;
    
    // Create a matrix of size (m+1) x (n+1)
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    // Initialize the first row and column
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + cost  // substitution
        );
      }
    }
    
    return dp[m][n];
  };
  
  // Function to check if two words are similar enough based on Levenshtein distance
  const areSimilarWords = (word1, word2) => {
    if (!word1 || !word2) return false;
    
    // Exact match
    if (word1 === word2) return true;
    
    const distance = levenshteinDistance(word1, word2);
    const longerLength = Math.max(word1.length, word2.length);
    
    // Calculate similarity as a percentage
    const similarity = 1 - distance / longerLength;
    
    // Determine threshold based on word length
    // Shorter words need higher similarity to be considered a match
    let threshold;
    if (longerLength <= 3) {
      threshold = 0.7; // Very short words
    } else if (longerLength <= 5) {
      threshold = 0.65; // Short words
    } else if (longerLength <= 8) {
      threshold = 0.6; // Medium words
    } else {
      threshold = 0.55; // Long words
    }
    
    return similarity >= threshold;
  };
  
  // New function to check if a word is part of another word (compound words)
  const isPartOfCompoundWord = (part, compound) => {
    if (!part || !compound) return false;
    
    // First, check if this is an exact match - always prioritize exact matches
    if (part.toLowerCase() === compound.toLowerCase()) {
      return true;
    }
    
    // Case insensitive comparison for part detection
    const lowerPart = part.toLowerCase();
    const lowerCompound = compound.toLowerCase();
    
    // Special case for key words that should be matched exactly
    const exactMatchWords = ['fährt', 'fahrt', 'büro', 'buro', 'in', 'ihr', 'ist', 'der', 'die', 'das'];
    if (exactMatchWords.includes(lowerPart) || exactMatchWords.includes(lowerCompound)) {
      return lowerPart === lowerCompound;
    }
    
    // Check if it's a direct substring (anywhere in the compound word)
    if (lowerCompound.includes(lowerPart)) {
      // Only consider it a match if the part is at least 2 characters (reduced from 3)
      // and makes up a substantial portion of the compound word
      if (part.length >= 2 && part.length / compound.length >= 0.35) {
        return true;
      }
    }
    
    return false;
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
            // When checking capitalization, require exact match
            if (candidateWord === expectedWord) {
              score = 1;
            }
          } else {
            // When not checking capitalization, compare lowercase versions
            if (candidateWord.toLowerCase() === expectedWord.toLowerCase()) {
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
            const maxLen = Math.max(
              (checkCapitalization ? expectedWord : normalizedExpectedWord).length,
              (checkCapitalization ? candidateWord : normalizedCandidateWord).length
            );
            score = 0.5 + 0.4 * (1 - dist / maxLen); // Score between 0.5 and 0.9 for similar words
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
            // Small penalty for distance from expected position
            const positionPenalty = j * 0.03; // 3% penalty per position away
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
            // Don't show extra words at the end of the expected text
            // Check if this is at the end of the diff array, excluding spaces
            const isAtEnd = index === diff.length - 1 || 
              (index === diff.length - 3 && diff[diff.length - 1].type === 'space' && diff[diff.length - 2].type === 'extra');
            
            // Add a non-breaking space character before the extra word if it's not at the beginning
            const needsSpace = index > 0 && diff[index-1]?.type !== 'space';
            
            return (
              <span key={index} className={`word-extra ${isAtEnd ? 'word-extra-hidden' : ''}`}>
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

  const submitInput = () => {
    // Call the handler directly instead of clicking a button
    console.log('[DIRECT SUBMIT]', 'Directly calling handleNextSentence');
    handleNextSentence();
  };

  const handleKeyDown = (e) => {
    // Use the appropriate modifier key based on platform
    const isModifierKeyPressed = isMac ? e.metaKey : e.ctrlKey;
    
    if (e.key === 'Enter' && !isModifierKeyPressed && !navigationInProgress && !isPlaying) {
      e.preventDefault(); // Prevent default Enter behavior that might trigger audio skip
      console.log('[ENTER KEY PRESSED]', {
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
    
    const currentSentence = sentences[indexToPlay];
    
    if (audioRef.current) {
      console.log("Playing sentence at index:", indexToPlay, "starting at time:", currentSentence.startTime);
      
      // Make sure audio is in stopped state first
      audioRef.current.pause();
      
      // Set the current time to the start of the sentence
      audioRef.current.seekTo(currentSentence.startTime);
      
      // Play the audio
      audioRef.current.play();
      setIsPlaying(true);
      
      // Set a timeout to pause at the end of the sentence
      const duration = (currentSentence.endTime - currentSentence.startTime) * 1000;
      console.log("Sentence duration (ms):", duration);
      
      // Clear any existing timeout first (redundant check but important)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        console.log("Sentence playback finished, pausing audio");
        if (audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          
          // Focus the input field
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
              // Always set waiting for input when audio finishes
              setWaitingForInput(true);
              console.log('[FOCUS]', 'Input field focused after audio stopped');
            }
          }, 100);
        }
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
    
    // For button clicks and Enter key, don't require waitingForInput state
    // Only check for navigation in progress and empty input
    // Enable force processing for first sentence
    const forceProcess = currentSentenceIndex === 0;
    
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
    
    // Set the start time when exercise begins
    setDictationStartTime(Date.now());
    
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
    
    // Prepare results data and show feedback screen
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
    // Calculate various statistics for the feedback
    const totalSentences = sentences.length;
    
    // Get all sentences with their results, including empty results for skipped sentences
    const allSentenceResults = [...sentenceResults];
    
    // Ensure we have entries for all sentences (even if user skipped some)
    while (allSentenceResults.length < sentences.length) {
      allSentenceResults.push(null);
    }
    
    // Record how many sentences the user actually completed
    const completedSentences = allSentenceResults.filter(Boolean).length;
    
    // Count total words in ALL sentences from the VTT file
    const totalWordsInAllText = sentences.reduce((total, sentence) => {
      return total + sentence.text.split(/\s+/).filter(Boolean).length;
    }, 0);
    
    // Extract words for comparison
    const allWords = sentences.flatMap(sentence => 
      sentence.text.split(/\s+/).filter(Boolean).map(word => word.toLowerCase())
    );
    
    const userWords = sentenceResults
      .filter(Boolean)
      .flatMap(result => 
        result.actual.split(/\s+/).filter(Boolean).map(word => word.toLowerCase())
      );
    
    const correctWords = userWords.filter(word => allWords.includes(word));
    
    setDictationResults({
      totalSentences,
      completedSentences,
      allWords,
      userWords,
      correctWords,
      totalWordsInAllText
    });
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
  
  if (isLoading) {
    return <div className="loading">Loading exercise...</div>;
  }

  // Show feedback screen if completed or canceled
  if (showFeedbackScreen) {
    return (
      <DictationFeedback 
        dictationResults={dictationResults}
        sentenceResults={sentenceResults}
        totalTime={dictationTime}
        onRestart={handleRestartFromFeedback}
      />
    );
  }

  return (
    <div className="dictation-tool">
      <div className="audio-section">
        <AudioPlayer 
          audioSrc={selectedExercise.audio} 
          ref={audioRef}
          onPlayStateChange={handleAudioPlayStateChange}
          checkCapitalization={checkCapitalization}
          onToggleCapitalization={() => setCheckCapitalization(prev => !prev)}
          onEnded={() => playCurrentSentence(currentSentenceIndex)}
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