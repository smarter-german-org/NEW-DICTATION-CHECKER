import React, { useMemo, useState, useRef, useEffect } from 'react';
import './DictationFeedback.css';

const DictationFeedback = ({ 
  dictationResults, 
  sentenceResults, 
  totalTime = 0, 
  onRestart 
}) => {
  // State for showing tooltips on word click
  const [activeTooltip, setActiveTooltip] = useState(null);
  
  // Add German umlaut normalization function
  const normalizeGermanText = (text) => {
    if (!text) return '';
    
    // TEST: Log a specific test case
    if (text === 'schoener') {
      console.log('FOUND schoener, will transform to schöner');
    }
    
    console.log('BEFORE normalization:', text);
    
    // Simple direct replacement of common umlaut alternative notations
    // Order matters - doing all replacements in one pass
    let normalized = text
      // Handle o-umlaut variations first (prioritize this for "schoener" case)
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
    if (text.toLowerCase() === 'schoener') normalized = 'schöner';
    if (text.toLowerCase() === 'schoen') normalized = 'schön';
    if (text.toLowerCase() === 'felle') normalized = 'fälle';
    
    console.log('AFTER normalization:', normalized);
    
    return normalized;
  };
  
  // Check if a word potentially contains an umlaut or alternative notation
  const hasUmlautPattern = (word) => {
    if (!word) return false;
    
    // Check for actual umlauts
    if (/[äöüÄÖÜß]/.test(word)) return true;
    
    // Check for common alternative notations
    if (/a\/|ae|a:|o\/|oe|o:|u\/|ue|u:|s\//.test(word)) return true;
    
    return false;
  };
  
  // Add Levenshtein distance calculation for word similarity
  const levenshteinDistance = (str1, str2) => {
    const m = str1.length;
    const n = str2.length;
    
    const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
    
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        // Use modified cost for umlaut character pairs
        let cost = 1;
        
        // Check if this is an umlaut pair (lower cost for e/ä, o/ö, u/ü)
        if (
          (str1[i - 1] === 'e' && str2[j - 1] === 'ä') || 
          (str1[i - 1] === 'ä' && str2[j - 1] === 'e') || 
          (str1[i - 1] === 'o' && str2[j - 1] === 'ö') || 
          (str1[i - 1] === 'ö' && str2[j - 1] === 'o') || 
          (str1[i - 1] === 'u' && str2[j - 1] === 'ü') || 
          (str1[i - 1] === 'ü' && str2[j - 1] === 'u')
        ) {
          cost = 0.4; // Lower cost for umlaut pairs
        } else if (str1[i - 1] === str2[j - 1]) {
          cost = 0; // No cost for same characters
        }
        
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + cost  // substitution
        );
      }
    }
    
    return dp[m][n];
  };
  
  // Calculate similarity as percentage (0-1)
  const calculateSimilarity = (word1, word2) => {
    if (!word1 || !word2) return 0;
    
    // Normalize both words for German umlauts
    const normalizedWord1 = normalizeGermanText(word1.toLowerCase());
    const normalizedWord2 = normalizeGermanText(word2.toLowerCase());
    
    // If after normalization they match exactly, return perfect score
    if (normalizedWord1 === normalizedWord2) return 1.0;
    
    // Calculate distance with umlaut-aware Levenshtein
    const distance = levenshteinDistance(normalizedWord1, normalizedWord2);
    const maxLength = Math.max(normalizedWord1.length, normalizedWord2.length);
    
    // Calculate base similarity score
    let similarity = 1 - (distance / maxLength);
    
    // Boost scores for words with umlaut patterns
    if (hasUmlautPattern(word1) || hasUmlautPattern(word2)) {
      similarity = Math.min(1.0, similarity * 1.2); // Boost by 20% but cap at 1.0
    }
    
    return similarity;
  };
  
  // Calculate statistics based on results
  const stats = useMemo(() => {
    if (!dictationResults || !sentenceResults || sentenceResults.length === 0) {
      return {
        totalWords: 0,
        completedWords: 0,
        correctWords: 0,
        incorrectWords: 0,
        percentageCompleted: 0,
        accuracyPercentage: 0,
        totalSentences: 0,
        completedSentences: 0
      };
    }

    const totalSentences = sentenceResults.length;
    const completedSentences = sentenceResults.filter(Boolean).length;

    // Count total words in the entire expected text
    let totalWords = dictationResults.totalWordsInAllText || 0;
    let completedWords = 0;
    let correctWords = 0;
    let incorrectWords = 0;

    // Process the sentences that have been attempted
    sentenceResults.forEach((result, index) => {
      if (result) {
        // Count words in the expected text for this sentence
        const expectedWordCount = result.expected.split(/\s+/).filter(Boolean).length;
        
        // Count words in the user's input
        const actualWordCount = result.actual.split(/\s+/).filter(Boolean).length;
        completedWords += actualWordCount;
        
        if (result.isCorrect) {
          correctWords += actualWordCount;
        } else {
          // Simple word-by-word comparison to count incorrect words
          const expectedWords = result.expected.split(/\s+/).filter(Boolean).map(w => w.toLowerCase());
          const actualWords = result.actual.split(/\s+/).filter(Boolean).map(w => w.toLowerCase());
          
          let tempCorrectWords = 0;
          actualWords.forEach(word => {
            if (expectedWords.includes(word)) {
              tempCorrectWords++;
            }
          });
          
          correctWords += tempCorrectWords;
          incorrectWords += (actualWordCount - tempCorrectWords);
          
          // Count missing words (expected words that weren't typed)
          const missingWordsCount = Math.max(0, expectedWordCount - actualWordCount);
          incorrectWords += missingWordsCount; // Count missing words as incorrect
        }
      }
    });

    // Calculate percentages
    const percentageCompleted = totalWords > 0 ? (completedWords / totalWords) * 100 : 0;
    const accuracyPercentage = completedWords > 0 ? (correctWords / completedWords) * 100 : 0;

    return {
      totalWords,
      completedWords,
      correctWords,
      incorrectWords,
      percentageCompleted,
      accuracyPercentage,
      totalSentences,
      completedSentences
    };
  }, [dictationResults, sentenceResults]);

  // Format time from seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Improved sentence-by-sentence comparison
  const SentenceByLineComparison = () => {
    return (
      <div className="side-by-side-comparison">
        <div className="comparison-column">
          <h3>Your Text</h3>
          <div className="text-container">
            {sentenceResults.map((result, sentenceIndex) => (
              <div key={sentenceIndex} className="sentence-row">
                {result ? (
                  <HighlightedUserSentence 
                    userText={result.actual} 
                    expectedText={result.expected}
                    sentenceIndex={sentenceIndex}
                  />
                ) : (
                  <div className="sentence-placeholder">
                    <span className="skipped-indicator">Not attempted</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Component to display user's sentence with proper highlighting and individual placeholders for missing words
  const HighlightedUserSentence = ({ userText, expectedText, sentenceIndex }) => {
    if (!userText) return <div className="empty-text">(No text)</div>;
    
    // Ref to track positions of words for tooltip positioning
    const wordRefs = useRef({});
    // State to track tooltip position
    const [tooltipPositions, setTooltipPositions] = useState({});
    
    // Update tooltip position when activeTooltip changes
    useEffect(() => {
      if (activeTooltip && wordRefs.current[activeTooltip]) {
        const wordElement = wordRefs.current[activeTooltip];
        const rect = wordElement.getBoundingClientRect();
        const containerRect = wordElement.closest('.text-container').getBoundingClientRect();
        
        // Check if word is close to left edge (less than 60px from left)
        const isNearLeftEdge = rect.left - containerRect.left < 60;
        
        setTooltipPositions({
          ...tooltipPositions,
          [activeTooltip]: isNearLeftEdge ? 'left' : 'center'
        });
      }
    }, [activeTooltip]);
    
    console.log('PROCESSING userText:', userText);
    
    // CRITICAL: First normalize the complete userText for German umlauts, then split
    const normalizedUserText = normalizeGermanText(userText);
    
    console.log('NORMALIZED complete text:', normalizedUserText);
    
    // Split both texts into words, preserving punctuation
    const userWords = normalizedUserText.split(/\s+/).filter(Boolean);
    const expectedWords = expectedText.split(/\s+/).filter(Boolean);
    
    console.log('SPLIT user words:', userWords);
    console.log('EXPECTED words:', expectedWords);
    
    // Helper function to render tooltip with appropriate positioning
    const renderTooltip = (tooltipId, content) => {
      const position = tooltipPositions[tooltipId] || 'center';
      return (
        <span className={`word-tooltip ${position === 'left' ? 'word-tooltip-left' : ''}`}>
          {content}
        </span>
      );
    };
    
    // This will hold the sequence of elements to render (correct words, incorrect words, placeholders)
    const renderElements = [];
    
    // Create a mapping of user words to their positions in the expected text
    const userWordPositions = [];
    
    // Track processed user words to avoid duplicates
    const processedUserWordIndices = new Set();
    
    // First phase: match user words to expected words
    for (let i = 0; i < userWords.length; i++) {
      // Get the already normalized word and just clean punctuation
      const cleanUserWord = userWords[i].toLowerCase().replace(/[^\w\säöüß]/g, '');
      
      console.log(`PROCESSING word[${i}]:`, userWords[i], '→ cleaned:', cleanUserWord);
      
      // Check each expected word for a match
      let bestMatchIndex = -1;
      let bestMatchScore = 0;
      let isCompoundPart = false;
      
      for (let j = 0; j < expectedWords.length; j++) {
        // Just clean the expected word, no normalization needed
        const expectedWord = expectedWords[j].toLowerCase().replace(/[^\w\säöüß]/g, '');
        
        // Check for exact match
        if (cleanUserWord === expectedWord) {
          bestMatchIndex = j;
          bestMatchScore = 1.0;
          isCompoundPart = false;
          break;
        }
        
        // Check if user word is part of expected word (compound word)
        if (cleanUserWord.length >= 2 && expectedWord.includes(cleanUserWord)) {
          // The longer the match relative to the expected word, the better the score
          const matchScore = cleanUserWord.length / expectedWord.length * 0.9; // Max 0.9 for compound parts
          
          if (matchScore > bestMatchScore) {
            bestMatchIndex = j;
            bestMatchScore = matchScore;
            isCompoundPart = true;
          }
        }
        
        // Check if expected word is part of user word
        if (expectedWord.length >= 2 && cleanUserWord.includes(expectedWord)) {
          // The longer the match relative to the user word, the better the score
          const matchScore = expectedWord.length / cleanUserWord.length * 0.8; // Max 0.8 for this case
          
          if (matchScore > bestMatchScore) {
            bestMatchIndex = j;
            bestMatchScore = matchScore;
            isCompoundPart = false;
          }
        }
      }
      
      // If no good match found, try using Levenshtein distance as fallback
      if (bestMatchScore < 0.3) {
        for (let j = 0; j < expectedWords.length; j++) {
          const expectedWord = expectedWords[j].toLowerCase().replace(/[^\w\säöüß]/g, '');
          
          // Skip very short words for Levenshtein to avoid false positives, unless they have umlaut patterns
          if (cleanUserWord.length <= 2 && !hasUmlautPattern(cleanUserWord)) continue;
          if (expectedWord.length <= 2 && !hasUmlautPattern(expectedWord)) continue;
          
          const similarity = calculateSimilarity(cleanUserWord, expectedWord);
          
          // Use a sliding threshold based on word length and umlaut presence
          let threshold = 0.7; // Default threshold
          
          // Lower threshold for words with potential umlauts
          if (hasUmlautPattern(cleanUserWord) || hasUmlautPattern(expectedWord)) {
            threshold = 0.5; // Much lower threshold for words with umlaut patterns
          } else if (Math.max(cleanUserWord.length, expectedWord.length) <= 4) {
            threshold = 0.75; // Higher threshold for short words without umlauts
          } else if (Math.max(cleanUserWord.length, expectedWord.length) >= 8) {
            threshold = 0.6; // Lower threshold for long words without umlauts
          }
          
          if (similarity > threshold && similarity > bestMatchScore) {
            bestMatchIndex = j;
            bestMatchScore = similarity * 0.8; // Scale back slightly to prioritize exact/compound matches
            isCompoundPart = false;
          }
        }
      }
      
      // If we found a match, add it to the positions array
      if (bestMatchIndex !== -1 && bestMatchScore > 0.3) {
        userWordPositions.push({
          word: userWords[i],
          expectedPosition: bestMatchIndex,
          isCorrect: bestMatchScore >= 0.9 && !isCompoundPart,
          isCompoundPart: isCompoundPart,
          score: bestMatchScore
        });
      } else {
        // No match found, mark as incorrect with a special position
        userWordPositions.push({
          word: userWords[i],
          expectedPosition: -1,
          isCorrect: false,
          isCompoundPart: false,
          score: 0
        });
      }
    }
    
    // Second phase: create the rendered elements in correct order
    let nextExpectedWordIndex = 0;
    
    // Process expected words in order
    for (let i = 0; i < expectedWords.length; i++) {
      // Find the best matching user word for this expected position
      const userWordMatch = userWordPositions.find(
        wp => wp.expectedPosition === i && !processedUserWordIndices.has(userWordPositions.indexOf(wp))
      );
      
      // If there's a gap (missing words before this position), add placeholders
      while (nextExpectedWordIndex < i) {
        const tooltipId = `missing-${sentenceIndex}-${nextExpectedWordIndex}`;
        renderElements.push(
          <span 
            key={`missing-${nextExpectedWordIndex}`}
            className="word-placeholder"
            onClick={() => setActiveTooltip(tooltipId)}
            onMouseLeave={() => setActiveTooltip(null)}
            ref={el => wordRefs.current[tooltipId] = el}
          >
            _____
            {activeTooltip === tooltipId && 
              renderTooltip(tooltipId, expectedWords[nextExpectedWordIndex])}
          </span>
        );
        nextExpectedWordIndex++;
      }
      
      // If we found a user word match for this expected position
      if (userWordMatch) {
        // Mark the word as processed
        processedUserWordIndices.add(userWordPositions.indexOf(userWordMatch));
        
        if (userWordMatch.isCorrect) {
          // Exact match
          renderElements.push(
            <span 
              key={`word-${i}`}
              className="word correct"
            >
              {userWordMatch.word}
            </span>
          );
        } else if (userWordMatch.isCompoundPart) {
          // Part of a compound word
          const tooltipId = `compound-${sentenceIndex}-${i}`;
          renderElements.push(
            <span 
              key={`compound-${i}`}
              className="word compound-part"
              onClick={() => setActiveTooltip(tooltipId)}
              onMouseLeave={() => setActiveTooltip(null)}
              ref={el => wordRefs.current[tooltipId] = el}
            >
              {userWordMatch.word}
              {activeTooltip === tooltipId && 
                renderTooltip(tooltipId, expectedWords[i])}
            </span>
          );
        } else {
          // Incorrect word (wrong spelling or completely different)
          const tooltipId = `incorrect-${sentenceIndex}-${i}`;
          renderElements.push(
            <span 
              key={`incorrect-${i}`}
              className="word incorrect"
              onClick={() => setActiveTooltip(tooltipId)}
              onMouseLeave={() => setActiveTooltip(null)}
              ref={el => wordRefs.current[tooltipId] = el}
            >
              {userWordMatch.word}
              {activeTooltip === tooltipId && 
                renderTooltip(tooltipId, expectedWords[i])}
            </span>
          );
        }
        
        nextExpectedWordIndex = i + 1;
      } else {
        // No user word for this expected position, add a placeholder
        const tooltipId = `missing-${sentenceIndex}-${i}`;
        renderElements.push(
          <span 
            key={`missing-${i}`}
            className="word-placeholder"
            onClick={() => setActiveTooltip(tooltipId)}
            onMouseLeave={() => setActiveTooltip(null)}
            ref={el => wordRefs.current[tooltipId] = el}
          >
            _____
            {activeTooltip === tooltipId && 
              renderTooltip(tooltipId, expectedWords[i])}
          </span>
        );
        nextExpectedWordIndex = i + 1;
      }
    }
    
    // Add any remaining unmatched user words at the end (extras)
    userWordPositions.forEach((wordPosition, index) => {
      if (!processedUserWordIndices.has(index)) {
        const tooltipId = `extra-${sentenceIndex}-${index}`;
        renderElements.push(
          <span 
            key={`extra-${index}`}
            className="word incorrect"
            onClick={() => setActiveTooltip(tooltipId)}
            onMouseLeave={() => setActiveTooltip(null)}
            ref={el => wordRefs.current[tooltipId] = el}
          >
            {wordPosition.word}
            {activeTooltip === tooltipId && 
              renderTooltip(tooltipId, "Extra word")}
          </span>
        );
      }
    });
    
    return (
      <div className="user-sentence">
        {renderElements.map((element, index) => (
          <React.Fragment key={index}>
            {element}
            {index < renderElements.length - 1 && ' '}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="dictation-feedback">
      <h2>Dictation Results</h2>
      
      <div className="feedback-stats">
        <div className="stat-item">
          <div className="stat-title">Completion</div>
          <div className="stat-value">{Math.round(stats.percentageCompleted)}%</div>
          <div className="stat-detail">
            {stats.completedWords} / {stats.totalWords} words
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-title">Accuracy</div>
          <div className="stat-value">{Math.round(stats.accuracyPercentage)}%</div>
          <div className="stat-detail">
            {stats.correctWords} correct words
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-title">Mistakes</div>
          <div className="stat-value">
            {stats.incorrectWords} / {stats.totalWords}
          </div>
          <div className="stat-detail">
            ({stats.totalWords > 0 
              ? Math.round((stats.incorrectWords / stats.totalWords) * 100) 
              : 0}%)
          </div>
        </div>
        
        <div className="stat-item">
          <div className="stat-title">Time</div>
          <div className="stat-value">{formatTime(totalTime)}</div>
          <div className="stat-detail">
            {stats.totalWords > 0 
              ? Math.round((stats.completedWords / (totalTime / 60)) * 10) / 10
              : 0} words/min
          </div>
        </div>
      </div>
      
      <SentenceByLineComparison />
      
      <button 
        className="restart-button"
        onClick={onRestart}
      >
        New Dictation
      </button>
    </div>
  );
};

export default DictationFeedback; 