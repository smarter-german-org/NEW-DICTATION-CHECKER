// Dictation Matcher Utility
// Loads, preprocesses, and matches dictation sentences/words with typo-tolerance and caching

import { normalizeText, areSimilarWords, levenshteinDistance, isPartOfCompoundWord } from './textUtils';

const DICTATION_FILE_PATH = '/src/data/dictations/a1-dictations.txt';
const CACHE_KEY = 'dictationMatcherCache_v1';

let dictationData = null;

// Helper: Fetch and preprocess the dictations file
async function loadAndPreprocessDictations() {
  // Try to fetch the file
  const response = await fetch(DICTATION_FILE_PATH);
  const text = await response.text();
  // Split into lines, filter out empty lines
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // Group by lesson headers (A1L01, etc.)
  const lessons = {};
  let currentLesson = null;
  for (const line of lines) {
    if (/^A1L\d+/.test(line)) {
      currentLesson = line;
      lessons[currentLesson] = [];
    } else if (currentLesson) {
      lessons[currentLesson].push(line);
    }
  }
  // Flatten all sentences for global matching
  const allSentences = Object.values(lessons).flat();
  // Also build a set of all unique words
  const allWords = new Set();
  allSentences.forEach(sentence => {
    normalizeText(sentence).split(' ').forEach(word => {
      if (word) allWords.add(word);
    });
  });
  return { lessons, allSentences, allWords: Array.from(allWords) };
}

// Helper: Save to localStorage
function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (e) {}
}

// Helper: Load from localStorage
function loadCache() {
  try {
    const data = localStorage.getItem(CACHE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
}

// Public: Initialize (load from cache or fetch fresh)
export async function initDictationMatcher() {
  let cache = loadCache();
  if (cache) {
    dictationData = cache;
    return;
  }
  dictationData = await loadAndPreprocessDictations();
  saveCache(dictationData);
}

// Public: Match user input to expected word (typo-tolerant)
export function matchWord(userInput) {
  if (!dictationData) throw new Error('DictationMatcher not initialized');
  const normalizedInput = normalizeText(userInput);
  let bestMatch = null;
  let bestDistance = Infinity;
  for (const word of dictationData.allWords) {
    const dist = levenshteinDistance(normalizedInput, word);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestMatch = word;
    }
  }
  return { bestMatch, bestDistance };
}

// Public: Get all sentences for a lesson
export function getSentencesForLesson(lessonId) {
  if (!dictationData) throw new Error('DictationMatcher not initialized');
  return dictationData.lessons[lessonId] || [];
}

// Public: Get all lessons
export function getAllLessons() {
  if (!dictationData) throw new Error('DictationMatcher not initialized');
  return Object.keys(dictationData.lessons);
}

// Advanced alignment: global alignment with matcher and compound logic
export function alignWithMatcher(expectedWords, userWords) {
  const m = expectedWords.length;
  const n = userWords.length;
  // dp[i][j] = {cost, ops: [op, ...], path: [{op, ref, user, matchType} ...]}
  const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(null));
  dp[0][0] = { cost: 0, path: [] };
  for (let i = 1; i <= m; i++) {
    dp[i][0] = { cost: i, path: [...dp[i-1][0].path, { op: 'del', ref: expectedWords[i-1], user: null, matchType: 'missing' }] };
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = { cost: j, path: [...dp[0][j-1].path, { op: 'ins', ref: null, user: userWords[j-1], matchType: 'extra' }] };
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const ref = expectedWords[i-1];
      const user = userWords[j-1];
      const { bestMatch, bestDistance } = matchWord(user);
      
      // More lenient threshold for longer words, especially compound words
      const baseThreshold = ref.length <= 5 ? 1 : 
                            ref.length <= 8 ? 2 : 3;
      
      // Even more lenient for obvious compound words (over 10 chars)
      const threshold = ref.length > 10 ? Math.max(3, Math.floor(ref.length * 0.3)) : baseThreshold;
      
      let matchType = 'none';
      let matchCost = 1;
      
      // Check exact match with typo tolerance
      if (bestMatch === ref && bestDistance <= threshold) {
        matchType = 'typo';
        matchCost = 0;
      } 
      // Check compound match (e.g., "montagmrgen" for "Montagmorgen")
      else if (isPartOfCompoundWord(user, ref)) {
        matchType = 'compound';
        matchCost = 0;
      }
      // Additional check for missing vowels in longer words (common typo pattern)
      else if (ref.length > 7 && user.length > 5) {
        // Create consonant-only versions (remove vowels)
        const refConsonants = ref.toLowerCase().replace(/[aeiouäöü]/g, '');
        const userConsonants = user.toLowerCase().replace(/[aeiouäöü]/g, '');
        
        // If consonant skeletons match or are very close, it's likely a match with missing vowels
        const consonantDist = levenshteinDistance(refConsonants, userConsonants);
        if (consonantDist <= 2) {
          matchType = 'consonant-match';
          matchCost = 0;
        }
      }
      
      // Substitution or match
      const sub = { cost: dp[i-1][j-1].cost + matchCost, path: [...dp[i-1][j-1].path, { op: matchCost === 0 ? 'match' : 'sub', ref, user, matchType }] };
      // Insertion
      const ins = { cost: dp[i][j-1].cost + 1, path: [...dp[i][j-1].path, { op: 'ins', ref: null, user, matchType: 'extra' }] };
      // Deletion
      const del = { cost: dp[i-1][j].cost + 1, path: [...dp[i-1][j].path, { op: 'del', ref, user: null, matchType: 'missing' }] };
      // Choose min
      const best = [sub, ins, del].reduce((a, b) => (a.cost <= b.cost ? a : b));
      dp[i][j] = best;
    }
  }
  return dp[m][n].path;
} 