// Helper functions for loading external dictation resources for embedded mode
import { debug } from './debug';

// Default file paths (for local development/testing)
const DEFAULT_RESOURCES = {
  audio: '/audio/chap01.mp3',
  vtt: '/audio/chap01.vtt',
};

/**
 * Loads embedded dictation resources from localStorage (set by embed.html)
 * or uses default local resources if not available
 */
export function getEmbeddedResources() {
  // Check if we're in embedded mode (URL parameters stored in localStorage)
  const audioUrl = localStorage.getItem('dictation_audioUrl');
  const vttUrl = localStorage.getItem('dictation_vttUrl');
  const courseId = localStorage.getItem('dictation_courseId');
  const lessonId = localStorage.getItem('dictation_lessonId');
  
  const isEmbedded = !!(audioUrl && vttUrl);
  
  debug('EMBEDDED_RESOURCES', {
    isEmbedded,
    audioUrl,
    vttUrl,
    courseId,
    lessonId
  });
  
  // Return resource config
  return {
    isEmbedded,
    audioUrl: audioUrl || DEFAULT_RESOURCES.audio,
    vttUrl: vttUrl || DEFAULT_RESOURCES.vtt,
    courseId,
    lessonId
  };
}

/**
 * Parse the VTT file to extract both timing and text content for dictation
 * @param {string} vttUrl - URL to the VTT file
 * @returns {Promise} - Resolves to a dictation exercise object
 */
export async function loadDictationFromVtt(vttUrl) {
  try {
    // Fetch the VTT file content
    const response = await fetch(vttUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const vttContent = await response.text();
    
    // Parse the VTT file to extract cues and create dictation exercise
    const sentences = parseVttToSentences(vttContent);
    
    return {
      title: extractTitleFromVtt(vttContent) || "Dictation Exercise",
      audio: getEmbeddedResources().audioUrl,
      sentences
    };
  } catch (error) {
    console.error("Failed to load dictation from VTT:", error);
    throw error;
  }
}

/**
 * Extract a title from VTT metadata if available
 */
function extractTitleFromVtt(vttContent) {
  // Look for a NOTE with title in the VTT header
  const titleMatch = vttContent.match(/NOTE[\s\n]+Title:([^\n]+)/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }
  return null;
}

/**
 * Parse VTT file content to extract sentences with timing
 */
function parseVttToSentences(vttContent) {
  const lines = vttContent.split('\n');
  const sentences = [];
  let currentIndex = 0;
  
  // Skip the WEBVTT header
  let i = 0;
  while (i < lines.length && !lines[i].includes('-->')) {
    i++;
  }
  
  // Process each cue
  while (i < lines.length) {
    if (lines[i].includes('-->')) {
      // This is a timestamp line
      const times = lines[i].match(/(\d{2}:\d{2}:\d{2}.\d{3}) --> (\d{2}:\d{2}:\d{2}.\d{3})/);
      
      if (times && times.length >= 3) {
        const startTime = convertVttTimeToSeconds(times[1]);
        const endTime = convertVttTimeToSeconds(times[2]);
        
        // Get the text content (may span multiple lines)
        i++;
        let text = '';
        while (i < lines.length && lines[i].trim() !== '') {
          text += lines[i] + ' ';
          i++;
        }
        
        text = text.trim();
        
        if (text) {
          sentences.push({
            id: currentIndex++,
            text,
            startTime,
            endTime
          });
        }
      }
    }
    i++;
  }
  
  return sentences;
}

/**
 * Convert VTT timestamp format (00:00:00.000) to seconds
 */
function convertVttTimeToSeconds(vttTime) {
  const parts = vttTime.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsPart = parseFloat(parts[2]);
  
  return hours * 3600 + minutes * 60 + secondsPart;
}
