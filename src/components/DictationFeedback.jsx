import React, { useMemo } from 'react';
import './DictationFeedback.css';

const DictationFeedback = ({ 
  dictationResults, 
  sentenceResults, 
  totalTime = 0, 
  onRestart 
}) => {
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

    // Count completed and correct words
    let totalWords = 0;
    let completedWords = 0;
    let correctWords = 0;
    let incorrectWords = 0;

    sentenceResults.forEach(result => {
      if (result) {
        const expectedWordCount = result.expected.split(/\s+/).filter(Boolean).length;
        const actualWordCount = result.actual.split(/\s+/).filter(Boolean).length;
        
        totalWords += expectedWordCount;
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

  // Highlight differences between expected and actual texts
  const HighlightedText = ({ text, isReference = false }) => {
    if (!text) return <span className="empty-text">(No text)</span>;
    
    // For simplicity, just highlight based on words
    const words = text.split(/\s+/);
    
    if (isReference) {
      // Reference text (correct text)
      return (
        <div className="highlighted-text reference">
          {words.map((word, idx) => (
            <span key={idx} className="word">{word} </span>
          ))}
        </div>
      );
    } else {
      // User's text
      return (
        <div className="highlighted-text user">
          {words.map((word, idx) => {
            // This is simplified - in a real implementation, you'd compare with the exact expected word
            const isCorrect = dictationResults?.correctWords?.includes(word.toLowerCase());
            return (
              <span 
                key={idx} 
                className={`word ${isCorrect ? 'correct' : 'incorrect'}`}
              >
                {word}{' '}
              </span>
            );
          })}
        </div>
      );
    }
  };

  // Simple comparison for side-by-side highlighting
  const SideBySideComparison = () => {
    // Combine all sentences
    const expectedText = sentenceResults
      .map(result => result?.expected || '')
      .filter(Boolean)
      .join(' ');
    
    const actualText = sentenceResults
      .map(result => result?.actual || '')
      .filter(Boolean)
      .join(' ');
    
    return (
      <div className="side-by-side-comparison">
        <div className="comparison-column">
          <h3>Your Text</h3>
          <div className="text-container">
            <HighlightedText text={actualText} isReference={false} />
          </div>
        </div>
        <div className="comparison-column">
          <h3>Correct Text</h3>
          <div className="text-container">
            <HighlightedText text={expectedText} isReference={true} />
          </div>
        </div>
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
      
      <SideBySideComparison />
      
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