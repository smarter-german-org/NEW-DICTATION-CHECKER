import React, { useMemo, useState, useRef, useEffect } from 'react';
import './DictationFeedback.css';
import { 
  alignWords, 
  normalizeGermanText, 
  levenshteinDistance 
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
        // Count words in the expected text for this sentence
        const expectedWordCount = result.expected.split(/\s+/).filter(Boolean).length;
        
        // Count words in the user's input
        const actualWordCount = result.actual.split(/\s+/).filter(Boolean).length;
        completedWords += actualWordCount;
        
        if (result.isCorrect) {
          correctWords += actualWordCount;
        } else {
          // Normalize both expected and actual words with umlaut handling
          const expectedWords = result.expected.split(/\s+/).filter(Boolean)
            .map(w => normalizeGermanText(w.toLowerCase()));
          const actualWords = result.actual.split(/\s+/).filter(Boolean)
            .map(w => normalizeGermanText(w.toLowerCase()));
          
          // Count correct words (those that match after normalization)
          let tempCorrectWords = 0;
          const matchedExpectedIndices = new Set();
          
          actualWords.forEach(normalizedActual => {
            // Find first unmatched expected word that matches this actual word
            const matchIndex = expectedWords.findIndex((normalizedExpected, idx) => 
              !matchedExpectedIndices.has(idx) && normalizedActual === normalizedExpected
            );
            
            if (matchIndex !== -1) {
              matchedExpectedIndices.add(matchIndex);
              tempCorrectWords++;
            }
          });
          
          correctWords += tempCorrectWords;
          
          // Incorrect words are those entered incorrectly (not missing words)
          incorrectWords += (actualWordCount - tempCorrectWords);
          
          // Missing words are calculated separately (no need to add to incorrectWords)
          const missingWordsCount = Math.max(0, expectedWordCount - matchedExpectedIndices.size);
        }
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
        // Check if word is close to right edge (less than 60px from right)
        const isNearRightEdge = containerRect.right - rect.right < 60;
        // Check if word is close to top edge (less than 50px from top of viewport)
        const isNearTopEdge = rect.top < 60;
        
        let position = 'center';
        if (isNearLeftEdge) {
          position = 'left';
        } else if (isNearRightEdge) {
          position = 'right';
        }
        // If not enough space above, show below
        if (isNearTopEdge) {
          position = 'below';
        }
        
        debug('TOOLTIP_POSITION', { 
          tooltipId: activeTooltip, 
          position,
          isNearLeftEdge,
          isNearRightEdge,
          isNearTopEdge
        });
        
        setTooltipPositions({
          ...tooltipPositions,
          [activeTooltip]: position
        });
      }
    }, [activeTooltip]);
    
    // Split both texts into words
    const userWords = userText.split(/\s+/).filter(Boolean);
    const expectedWords = expectedText.split(/\s+/).filter(Boolean);
    
    // Use the same alignment as the stats calculation
    const alignment = alignWords(expectedWords, userWords, dictationResults.checkCapitalization);
    
    // Render elements based on alignment
    const renderElements = alignment.map((pair, idx) => {
      let className = '';
      let tooltipId = `word-${sentenceIndex}-${idx}`;
      let tooltipContent = null;
      
      if (pair.op === 'match') {
        className = 'word-correct';
      } else if (pair.op === 'sub') {
        className = 'word-partial';
        tooltipContent = pair.ref;
      } else if (pair.op === 'ins') {
        className = 'word-incorrect';
        tooltipContent = 'Extra word';
      } else if (pair.op === 'del') {
        className = 'word-placeholder';
        tooltipContent = pair.ref;
      }
      
      return (
        <span
          key={idx}
          className={className}
          onClick={tooltipContent ? () => setActiveTooltip(tooltipId) : undefined}
          onMouseLeave={tooltipContent ? () => setActiveTooltip(null) : undefined}
          ref={el => wordRefs.current[tooltipId] = el}
        >
          {pair.user || (className === 'word-placeholder' ? '_____' : null)}
          {activeTooltip === tooltipId && tooltipContent && renderTooltip(tooltipId, tooltipContent)}
        </span>
      );
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

  // Add the missing renderTooltip function
  const renderTooltip = (id, content) => {
    const position = tooltipPositions[id] || 'center';
    const tooltipClass = `word-tooltip ${position === 'left' ? 'word-tooltip-left' : 
                                         position === 'right' ? 'word-tooltip-right' : 
                                         position === 'below' ? 'word-tooltip-below' : ''}`;
    return (
      <div className={tooltipClass}>
        {content}
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