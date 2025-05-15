import React, { useMemo, useState, useRef, useEffect } from 'react';
import './DictationFeedback.css';
import { 
  alignWords, 
  normalizeGermanText, 
  levenshteinDistance,
  areSimilarWords,
  areExactlyEqual
} from '../utils/textUtils';
import { debug } from '../utils/debug';

const DictationFeedback = ({ 
  dictationResults, 
  sentenceResults, 
  totalTime = 0, 
  onRestart 
}) => {
  debug('RENDER_FEEDBACK', dictationResults, sentenceResults);

  // State for showing tooltips on word click
  const [activeTooltip, setActiveTooltip] = useState(null);
  
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
    
    // State for tracking active tooltip
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const [tooltipContent, setTooltipContent] = useState('');
    
    // Ref to track positions of words
    const wordRefs = useRef({});
    
    // Split both texts into words
    const userWords = userText.split(/\s+/).filter(Boolean);
    const expectedWords = expectedText.split(/\s+/).filter(Boolean);
    
    // Use the same alignment algorithm for consistent results
    const alignment = alignWords(expectedWords, userWords, dictationResults.checkCapitalization);
    
    // Handle click on a word to show tooltip
    const handleWordClick = (tooltipId, content) => {
      if (activeTooltip === tooltipId) {
        // Toggle off
        setActiveTooltip(null);
        return;
      }
      
      const wordEl = wordRefs.current[tooltipId];
      if (wordEl) {
        const rect = wordEl.getBoundingClientRect();
        
        // Position tooltip centered above the word
        setTooltipPosition({
          left: rect.left + (rect.width / 2),
          top: rect.top
        });
        
        setTooltipContent(content);
        setActiveTooltip(tooltipId);
      }
    };
    
    // Custom function to check if words are similar but should be considered incorrect
    const shouldMarkAsIncorrect = (refWord, userWord) => {
      if (!refWord || !userWord) return true;
      
      // Convert to lowercase for comparison
      const refLower = refWord.toLowerCase();
      const userLower = userWord.toLowerCase();
      
      // Special cases for common German mistakes that should be marked incorrect
      
      // Case 1: schöner vs schoner (missing umlaut)
      if ((refLower === 'schöner' && userLower === 'schoner') ||
          (refLower === 'schön' && userLower === 'schon')) {
        return true;
      }
      
      // Case 2: Berlin vs balin/berlin (capital city error)
      if (refLower === 'berlin' && (userLower === 'balin' || userLower === 'berlim')) {
        return true;
      }
      
      // Case 3: montagmorgen vs montagmorgan 
      if (refLower === 'montagmorgen' && (userLower === 'montagmorgan' || userLower === 'montakmorgen')) {
        return true;
      }
      
      // Special case for missing key letters in German words
      if (refLower.includes('ö') && userLower.replace('o', 'ö') === refLower) {
        return true; // Missing umlaut
      }
      
      if (refLower.includes('ä') && userLower.replace('a', 'ä') === refLower) {
        return true; // Missing umlaut
      }
      
      if (refLower.includes('ü') && userLower.replace('u', 'ü') === refLower) {
        return true; // Missing umlaut
      }
      
      // Check for "en" vs "an" endings which is a common German mistake
      if (refLower.endsWith('en') && userLower.endsWith('an') && 
          refLower.slice(0, -2) === userLower.slice(0, -2)) {
        return true;
      }
      
      // Force mark balin as incorrect consistently
      if (userLower === 'balin') {
        return true;
      }
      
      return false;
    };
    
    // Render elements based on alignment
    const renderElements = alignment.map((pair, idx) => {
      let className = '';
      let tooltipId = `word-${sentenceIndex}-${idx}`;
      let content = null;
      let displayText = pair.user;
      let isCorrect = false;
      
      // Check if the words are similar using the more sophisticated matching
      if (pair.op === 'match') {
        isCorrect = true;
      } else if (pair.op === 'sub' && pair.ref && pair.user) {
        // First check with our custom function for known incorrect patterns
        if (shouldMarkAsIncorrect(pair.ref, pair.user)) {
          isCorrect = false;
        } else {
          // Otherwise use the general similarity check
          isCorrect = areSimilarWords(pair.ref, pair.user);
        }
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
        content = pair.ref; // Show correct word in tooltip
      } else if (pair.op === 'ins') {
        className = 'word-incorrect';
        content = 'Extra word';
      } else if (pair.op === 'del') {
        className = 'word-placeholder';
        content = pair.ref;
        displayText = '_____';
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
          onClick={content ? () => handleWordClick(tooltipId, content) : undefined}
          ref={el => wordRefs.current[tooltipId] = el}
        >
          {displayText}
        </span>
      );
    });
    
    // Render global tooltip
    const renderGlobalTooltip = () => {
      if (!activeTooltip) return null;
      
      return (
        <div 
          className="word-tooltip" 
          style={{ 
            left: `${tooltipPosition.left}px`, 
            top: `${tooltipPosition.top}px`
          }}
        >
          {tooltipContent}
        </div>
      );
    };
    
    return (
      <div className="user-sentence">
        {renderElements.map((element, index) => (
          <React.Fragment key={index}>
            {element}
            {index < renderElements.length - 1 && ' '}
          </React.Fragment>
        ))}
        {renderGlobalTooltip()}
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