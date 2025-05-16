import React, { useMemo, useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './DictationFeedback.css';
import { 
  alignWords, 
  normalizeGermanText, 
  levenshteinDistance,
  areSimilarWords,
  areExactlyEqual
} from '../utils/textUtils';
import { debug } from '../utils/debug';

// Tooltip component that will be rendered at the document level
const Tooltip = ({ content, position, onClose }) => {
  return ReactDOM.createPortal(
    <div 
      className="word-tooltip" 
      style={{ 
        left: `${position.left}px`, 
        top: `${position.top}px`
      }}
      onClick={onClose}
    >
      {content}
    </div>,
    document.body
  );
};

const DictationFeedback = ({ 
  dictationResults, 
  sentenceResults, 
  totalTime = 0, 
  onRestart 
}) => {
  debug('RENDER_FEEDBACK', dictationResults, sentenceResults);

  // State for showing tooltips on word click
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [tooltipContent, setTooltipContent] = useState('');
  
  // Check if a word potentially contains an umlaut or alternative notation
  const hasUmlautPattern = (word) => {
    if (!word) return false;
    
    // Check for actual umlauts
    if (/[äöüÄÖÜß]/.test(word)) return true;
    
    // Check for common alternative notations
    if (/a\/|ae|a:|o\/|oe|o:|u\/|ue|u:|s\//.test(word)) return true;
    
    return false;
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
    debug('CALC_STATS', {
      hasDictationResults: !!dictationResults,
      sentenceResultsLength: sentenceResults?.length
    });

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
        // Count words in the user's input
        const actualWords = result.actual.split(/\s+/).filter(Boolean);
        const expectedWords = result.expected.split(/\s+/).filter(Boolean);
        
        completedWords += actualWords.length;
        
        // When calculating stats, use STRICT matching for correct words
        // This ensures words are only counted as correct if they match 100%
        let tempCorrectWords = 0;
        const matchedExpectedIndices = new Set();
        
        actualWords.forEach(actualWord => {
          // Try to find a match among expected words
          for (let i = 0; i < expectedWords.length; i++) {
            if (matchedExpectedIndices.has(i)) continue; // Skip already matched words
            
            const expectedWord = expectedWords[i];
            
            // For statistics, use strict exact matching (100% match required)
            // Only exception is capitalization when Aa toggle is off
            if (areExactlyEqual(actualWord, expectedWord, dictationResults.checkCapitalization)) {
              matchedExpectedIndices.add(i);
              tempCorrectWords++;
              break; // Found a match, move to next actual word
            }
          }
        });
        
        correctWords += tempCorrectWords;
        
        // Incorrect words are those entered incorrectly (not missing words)
        incorrectWords += (actualWords.length - tempCorrectWords);
      }
    });

    // Calculate percentages
    const percentageCompleted = totalWords > 0 ? (completedWords / totalWords) * 100 : 0;
    const accuracyPercentage = completedWords > 0 ? (correctWords / completedWords) * 100 : 0;

    const statsObj = {
      totalWords,
      completedWords,
      correctWords,
      incorrectWords,
      percentageCompleted,
      accuracyPercentage,
      totalSentences,
      completedSentences
    };
    
    debug('STATS_CALCULATED', statsObj);
    return statsObj;
  }, [dictationResults, sentenceResults]);

  // Format time from seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Global click handler to close tooltip when clicking anywhere else
  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Close tooltip when clicking anywhere except tooltip elements
      if (activeTooltip && 
          !e.target.closest('.word-tooltip') && 
          !e.target.closest('.word-incorrect')) {
        setActiveTooltip(null);
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [activeTooltip]);
  
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
    
    // Ref to track positions of words
    const wordRefs = useRef({});
    
    // Split both texts into words
    const userWords = userText.split(/\s+/).filter(Boolean);
    const expectedWords = expectedText.split(/\s+/).filter(Boolean);
    
    // Use the same alignment algorithm for consistent results
    const alignment = alignWords(expectedWords, userWords, dictationResults.checkCapitalization);

    // Helper function to find the best match for a word in the expected text
    // This is ONLY used for tooltip content, not for alignment or statistics
    const findBetterMatchForTooltip = (word) => {
      if (!word) return null;
      
      let bestMatch = null;
      let bestScore = 0;
      
      // First, check for exact matches (ignoring case)
      for (const expectedWord of expectedWords) {
        if (expectedWord.toLowerCase() === word.toLowerCase()) {
          return expectedWord; // Return exact match immediately
        }
      }
      
      // Handle common typos with single character differences
      for (const expectedWord of expectedWords) {
        // If the lengths are similar (within 2 characters)
        if (Math.abs(expectedWord.length - word.length) <= 2) {
          // Calculate basic Levenshtein distance
          const distance = levenshteinDistance(
            expectedWord.toLowerCase(), 
            word.toLowerCase()
          );
          
          // For very short words (3 chars or less), allow only 1 difference
          // For longer words, allow up to 2 differences
          const maxAllowedDistance = expectedWord.length <= 3 ? 1 : 2;
          
          if (distance <= maxAllowedDistance) {
            return expectedWord;
          }
        }
      }
      
      // Then look for similar words with higher threshold
      for (const expectedWord of expectedWords) {
        // Calculate similarity score
        const similarity = calculateSimilarity(word, expectedWord);
        
        if (similarity > bestScore && similarity > 0.6) { // Increased threshold for more accuracy
          bestScore = similarity;
          bestMatch = expectedWord;
        }
      }
      
      return bestMatch;
    };
    
    // Handle click on a word to show tooltip
    const handleWordClick = (tooltipId, word) => {
      if (activeTooltip === tooltipId) {
        // Toggle off
        setActiveTooltip(null);
        return;
      }
      
      const wordEl = wordRefs.current[tooltipId];
      if (wordEl) {
        const rect = wordEl.getBoundingClientRect();
        
        // Position tooltip using fixed positioning relative to viewport
        setTooltipPosition({
          left: rect.left + (rect.width / 2),
          top: rect.top - 10
        });
        
        // For tooltip content, always look for the best match for this word
        const betterMatch = findBetterMatchForTooltip(word);
        const tooltipText = betterMatch || 'Extra word';
        
        setTooltipContent(tooltipText);
        setActiveTooltip(tooltipId);
      }
    };
    
    // Render elements based on alignment
    const renderElements = alignment.map((pair, idx) => {
      let className = '';
      let tooltipId = `word-${sentenceIndex}-${idx}`;
      let displayText = pair.user;
      let isCorrect = false;
      
      // Use strict exact matching (100% match required) for visual display
      // This matches the statistics calculation for consistency
      if (pair.op === 'match') {
        isCorrect = true;
      } else if (pair.op === 'sub' && pair.ref && pair.user) {
        // Use the same strict matching as statistics with areExactlyEqual
        isCorrect = areExactlyEqual(pair.user, pair.ref, dictationResults.checkCapitalization);
      }
      
      if (isCorrect) {
        className = 'word-correct';
        // When Aa is off, we still want to show proper capitalization
        // So use the reference word (which has correct capitalization)
        // But we still consider it correct
        if (!dictationResults.checkCapitalization && pair.ref && pair.user) {
          // If capitalization differs but words match case-insensitively
          if (pair.ref.toLowerCase() === pair.user.toLowerCase() && 
              pair.ref !== pair.user) {
            displayText = pair.ref; // Use properly capitalized version
          }
        }
      } else if (pair.op === 'sub') {
        className = 'word-incorrect';
      } else if (pair.op === 'ins') {
        className = 'word-incorrect';
      } else if (pair.op === 'del') {
        className = 'word-placeholder';
        displayText = '_'.repeat(pair.ref.length); // Dynamic placeholder based on word length
      }
      
      // Apply different styles based on whether the word is correct or not
      const style = isCorrect ? 
        { color: 'var(--text-light)', textDecoration: 'none', backgroundColor: 'transparent' } : 
        {
          color: 'var(--incorrect)',
          textDecoration: pair.op === 'sub' || pair.op === 'ins' ? 'line-through' : 'none',
          position: 'relative',
          backgroundColor: 'rgba(255, 82, 82, 0.1)'
        };
      
      return (
        <span
          key={idx}
          className={className}
          style={style}
          onClick={!isCorrect && displayText !== '_'.repeat(pair.ref?.length || 0) ? 
            () => handleWordClick(tooltipId, displayText) : undefined}
          ref={el => wordRefs.current[tooltipId] = el}
        >
          {displayText}
        </span>
      );
    });
    
    return (
      <div className="user-sentence-wrapper">
        <div className="user-sentence">
          {renderElements.map((element, index) => (
            <React.Fragment key={index}>
              {element}
            </React.Fragment>
          ))}
        </div>
        <div className="expected-sentence-reference">
          <span className="expected-label">Correct: </span>
          {expectedText}
        </div>
      </div>
    );
  };

  return (
    <div className="dictation-feedback">
      <h2>Dictation Results</h2>
      
      {/* Add Score Display at the top */}
      {dictationResults.score !== undefined && (
        <div className="score-display">
          <div className="score-value">{dictationResults.score}</div>
          <div className="score-label">Score</div>
          
          {/* Display hint penalty if hints were used */}
          {dictationResults.maxHintLevelUsed > 0 && (
            <div className="hint-penalty-info">
              <span className="hint-icon">💡</span>
              <span className="hint-text">
                Hint penalty: {Math.round((1 - dictationResults.hintPenaltyMultiplier) * 100)}%
              </span>
            </div>
          )}
        </div>
      )}
      
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
            {stats.incorrectWords} / {stats.completedWords}
          </div>
          <div className="stat-detail">
            ({stats.completedWords > 0 
              ? Math.round((stats.incorrectWords / stats.completedWords) * 100) 
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
      {activeTooltip && (
        <Tooltip 
          content={tooltipContent}
          position={tooltipPosition}
          onClose={() => setActiveTooltip(null)}
        />
      )}
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