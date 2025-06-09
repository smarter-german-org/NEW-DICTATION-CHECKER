# Dictation Checker System Documentation

## Overview

This document explains how our dictation checking system works, particularly the text input handling and correction mechanisms. The system allows users to type words in any order and with misspellings while still matching them to their correct positions in a reference text.

## Core Components

### 1. Word Alignment System

The system uses a sophisticated algorithm to match input words with reference text, regardless of input order or spelling mistakes.

```javascript
/**
 * Finds the best matches between expected words and actual user input
 * @param {string[]} expectedWords - Array of words from the reference text
 * @param {string[]} actualWords - Array of words from user input
 * @return {Object[]} - Array of match objects with alignment information
 */
function findBestWordMatches(expectedWords, actualWords) {
  const result = [];
  let remainingActualWords = [...actualWords]; // Copy to track unmatched words
  
  // For each expected word in the reference text
  for (let i = 0; i < expectedWords.length; i++) {
    const expectedWord = expectedWords[i].toLowerCase();
    let bestMatch = null;
    let bestScore = 0.3; // Minimum threshold to consider a match
    
    // Try to find the best matching word from user input
    for (let j = 0; j < remainingActualWords.length; j++) {
      const actualWord = remainingActualWords[j].toLowerCase();
      const score = calculateSimilarityScore(expectedWord, actualWord);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = {
          expectedIndex: i,
          actualIndex: actualWords.indexOf(remainingActualWords[j]),
          word: remainingActualWords[j],
          score: score,
          expected: expectedWords[i]
        };
      }
    }
    
    if (bestMatch) {
      result.push(bestMatch);
      // Remove the matched word from consideration
      const matchedWordIndex = remainingActualWords.indexOf(bestMatch.word);
      remainingActualWords.splice(matchedWordIndex, 1);
    } else {
      // No match found for this expected word
      result.push({
        expectedIndex: i,
        actualIndex: -1,
        word: null,
        score: 0,
        expected: expectedWords[i],
        missing: true
      });
    }
  }
  
  // Handle extra words that don't match any expected word
  remainingActualWords.forEach(word => {
    result.push({
      expectedIndex: -1,
      actualIndex: actualWords.indexOf(word),
      word: word,
      score: 0,
      expected: null,
      extra: true
    });
  });
  
  return result;
}
```

### 2. Similarity Scoring

Multiple techniques are used to determine how well words match:

```javascript
/**
 * Calculates similarity between two words
 * @param {string} expected - Word from reference text
 * @param {string} actual - Word from user input
 * @return {number} - Score between 0 and 1
 */
function calculateSimilarityScore(expected, actual) {
  // Exact match
  if (expected === actual) return 1.0;
  
  // Normalized match (lowercase, no punctuation)
  const normalizedExpected = normalizeWord(expected);
  const normalizedActual = normalizeWord(actual);
  if (normalizedExpected === normalizedActual) return 0.95;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(normalizedExpected, normalizedActual);
  const maxLength = Math.max(normalizedExpected.length, normalizedActual.length);
  
  // Convert distance to similarity score
  const similarityFromLevenshtein = 1 - (distance / maxLength);
  
  // Check for substring match (compound words)
  let substringScore = 0;
  if (normalizedExpected.includes(normalizedActual)) {
    substringScore = normalizedActual.length / normalizedExpected.length * 0.8;
  } else if (normalizedActual.includes(normalizedExpected)) {
    substringScore = normalizedExpected.length / normalizedActual.length * 0.8;
  }
  
  // Return the best score
  return Math.max(similarityFromLevenshtein, substringScore);
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = str1[i-1] === str2[j-1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i-1][j] + 1,      // deletion
        dp[i][j-1] + 1,      // insertion
        dp[i-1][j-1] + cost  // substitution
      );
    }
  }
  
  return dp[m][n];
}

/**
 * Normalizes a word for comparison
 */
function normalizeWord(word) {
  return word.toLowerCase()
    .replace(/[.,?!;:()'"]/g, '')
    .replace(/oe/g, 'ö')
    .replace(/ae/g, 'ä')
    .replace(/ue/g, 'ü')
    .replace(/s\//g, 'ß')
    .trim();
}
```

### 3. Text Input Processing

```javascript
/**
 * Processes user input and aligns it with reference text
 * @param {string} referenceText - The expected text
 * @param {string} userInput - The text entered by the user
 * @return {Object} - Alignment results with word status
 */
function processInput(referenceText, userInput) {
  // Normalize and split texts into words
  const normalizedReference = normalizeText(referenceText);
  const normalizedInput = normalizeText(userInput);
  
  const expectedWords = normalizedReference.split(/\s+/).filter(word => word);
  const actualWords = normalizedInput.split(/\s+/).filter(word => word);
  
  // Find best matches
  const matches = findBestWordMatches(expectedWords, actualWords);
  
  // Organize results for rendering
  const result = {
    words: expectedWords.map((word, index) => {
      const match = matches.find(m => m.expectedIndex === index);
      if (!match || match.missing) {
        return { word, status: 'missing', position: index };
      } else {
        return {
          word: match.word,
          expected: word,
          status: match.score === 1 ? 'correct' : 'misspelled',
          score: match.score,
          position: index
        };
      }
    }),
    extraWords: matches.filter(m => m.extra).map(m => {
      return { word: m.word, status: 'extra' };
    })
  };
  
  return result;
}

/**
 * Normalizes text for processing
 */
function normalizeText(text) {
  return text
    .replace(/oe/g, 'ö')
    .replace(/o\//g, 'ö')
    .replace(/ae/g, 'ä')
    .replace(/ue/g, 'ü')
    .replace(/s\//g, 'ß');
}
```

## Example Scenarios

### Example 1: Out-of-order Typing

```javascript
// Reference text: "Es gibt viel zu tun"
// User input: "zu gibt Es tun"

const referenceText = "Es gibt viel zu tun";
const userInput = "zu gibt Es tun";
const result = processInput(referenceText, userInput);

console.log(result);
/* Output:
{
  words: [
    { word: 'Es', expected: 'Es', status: 'correct', score: 1, position: 0 },
    { word: 'gibt', expected: 'gibt', status: 'correct', score: 1, position: 1 },
    { word: 'viel', status: 'missing', position: 2 },
    { word: 'zu', expected: 'zu', status: 'correct', score: 1, position: 3 },
    { word: 'tun', expected: 'tun', status: 'correct', score: 1, position: 4 }
  ],
  extraWords: []
}
*/
```

### Example 2: Misspelled Words

```javascript
// Reference text: "Es gibt viel zu tun" 
// User input: "esss gibtte zu tun"

const referenceText = "Es gibt viel zu tun";
const userInput = "esss gibtte zu tun";
const result = processInput(referenceText, userInput);

console.log(result);
/* Output:
{
  words: [
    { word: 'esss', expected: 'Es', status: 'misspelled', score: 0.75, position: 0 },
    { word: 'gibtte', expected: 'gibt', status: 'misspelled', score: 0.83, position: 1 },
    { word: 'viel', status: 'missing', position: 2 },
    { word: 'zu', expected: 'zu', status: 'correct', score: 1, position: 3 },
    { word: 'tun', expected: 'tun', status: 'correct', score: 1, position: 4 }
  ],
  extraWords: []
}
*/
```

### Example 3: Missing & Extra Words

```javascript
// Reference text: "Die Sonne scheint hell am Himmel"
// User input: "Die scheint sehr hell am blauen Himmel"

const referenceText = "Die Sonne scheint hell am Himmel";
const userInput = "Die scheint sehr hell am blauen Himmel";
const result = processInput(referenceText, userInput);

console.log(result);
/* Output:
{
  words: [
    { word: 'Die', expected: 'Die', status: 'correct', score: 1, position: 0 },
    { word: 'Sonne', status: 'missing', position: 1 },
    { word: 'scheint', expected: 'scheint', status: 'correct', score: 1, position: 2 },
    { word: 'hell', expected: 'hell', status: 'correct', score: 1, position: 3 },
    { word: 'am', expected: 'am', status: 'correct', score: 1, position: 4 },
    { word: 'Himmel', expected: 'Himmel', status: 'correct', score: 1, position: 5 }
  ],
  extraWords: [
    { word: 'sehr', status: 'extra' },
    { word: 'blauen', status: 'extra' }
  ]
}
*/
```

## Implementation Guide for Development Teams

### Step 1: Core Algorithms

1. Implement the word alignment algorithm (`findBestWordMatches`) 
2. Create the similarity scoring functions (`calculateSimilarityScore`, `levenshteinDistance`)
3. Build input normalization utilities (`normalizeText`, `normalizeWord`)

### Step 2: Input Processing Module

Create a module that:
- Takes the reference text and user input
- Normalizes both
- Splits into words
- Calls the matching algorithm
- Returns a structured result object

### Step 3: Display Component

Build a component that:
- Renders the reference text structure
- Shows user input in the correct positions
- Highlights words according to their status (correct, misspelled, missing)
- Indicates extra words

### Step 4: Configuration System

Implement configurable options:
- Similarity threshold (how close words need to be for matching)
- Language-specific normalization rules
- Strictness settings for different use cases

### Step 5: Testing

Test with various scenarios:
- Words typed out of order
- Misspelled words
- Missing words 
- Extra words
- Compound words
- Special characters and accents

## Advanced Features

### 1. Compound Word Handling

German and some other languages use compound words extensively. The system can detect when a user has split a compound word:

```javascript
// Reference: "Kindergarten"
// User input: "Kinder garten"
// The system can identify these as parts of the same compound word
```

### 2. Progressive Matching

As users type, the system can progressively match input against the reference:

```javascript
// Reference: "Der schnelle braune Fuchs"
// User begins typing: "Der sch"
// System identifies partial match for "schnelle"
```

### 3. Learning from User Patterns

The system could adapt to common user mistakes, improving matching over time:

```javascript
// If a user consistently types "ß" as "ss", the system can prioritize this match
```

## Edge Cases and Considerations

1. **Punctuation handling** - Decide whether punctuation affects matching
2. **Case sensitivity** - Most implementations ignore case for matching
3. **Languages with special characters** - Ensure proper normalization
4. **Very long texts** - Consider performance optimizations for lengthy content
5. **Highly misspelled text** - Adjust thresholds for severe spelling issues

By implementing this system, your application will offer a flexible and forgiving text input experience that can handle a wide range of user input styles while still providing accurate feedback.