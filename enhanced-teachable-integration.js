/**
 * Dictation Checker - Enhanced Teachable Integration Script
 * 
 * This script allows embedding of the Dictation Checker app into Teachable lessons
 * with a CORS workaround for Dropbox hosting. It implements a simplified version
 * of the dictation app directly in JavaScript, avoiding iframe embedding issues.
 * 
 * Key features:
 * - Direct DOM manipulation instead of iframe loading
 * - Built-in simple dictation checking functionality
 * - Compatible with VTT files in Dropbox (with ?raw=1)
 * 
 * Installation:
 * 1. Upload this file to your Dropbox
 * 2. Share the link (copy Dropbox link)
 * 3. Use the teachable-embed-generator.html tool to create embedding code
 * 4. Paste the generated code into your Teachable lesson
 * 
 * Important: All URLs (script, audio, VTT) must use dl.dropboxusercontent.com 
 * with ?raw=1 parameter. The embed generator tool will handle this conversion.
 * 
 * This simplified version doesn't need the full app, just the audio and VTT files!
 */

(function() {
  // Automatically detect the app location from the script source
  const appBaseUrl = (function() {
    // Get the current script tag
    const scripts = document.getElementsByTagName('script');
    const currentScript = scripts[scripts.length - 1];
    const scriptSrc = currentScript.src;
    
    // Extract the base URL from the script source
    return scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
  })();
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Find all dictation app containers
    const containers = document.querySelectorAll('.dictation-app-container');
    
    if (containers.length === 0) {
      console.log('Dictation App: No container elements found. Add a div with class "dictation-app-container"');
      return;
    }
    
    // Process each container
    containers.forEach(function(container, index) {
      // Get configuration from data attributes
      const courseId = container.getAttribute('data-course-id');
      const lessonId = container.getAttribute('data-lesson-id');
      const audioUrl = container.getAttribute('data-audio-url');
      const vttUrl = container.getAttribute('data-vtt-url');
      
      // Validate required attributes
      if (!audioUrl || !vttUrl) {
        container.innerHTML = `
          <div style="padding: 20px; border: 2px solid #f44336; background-color: #ffebee; color: #b71c1c;">
            <h3>Dictation App Configuration Error</h3>
            <p>Missing required attributes: data-audio-url and data-vtt-url must be specified.</p>
          </div>
        `;
        return;
      }
      
      // Generate a unique ID for this container
      const containerId = 'dictation-embed-' + (index + 1);
      container.id = containerId;
      
      // CORS WORKAROUND: Use direct embedding instead of iframe
      initDictationPlayer(container, {
        courseId,
        lessonId,
        audioUrl,
        vttUrl
      });
    });
    
    // Add the needed CSS for the containers
    const style = document.createElement('style');
    style.textContent = `
      .dictation-app-container {
        margin: 20px 0;
        width: 100%;
        max-width: 900px;
        min-height: 650px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      .dictation-player {
        background-color: #f8f9fa;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      .dictation-controls {
        margin-bottom: 20px;
      }
      .dictation-btn {
        background-color: #ff5500;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        margin-right: 10px;
        cursor: pointer;
      }
      .dictation-btn:hover {
        background-color: #e64a00;
      }
      .dictation-btn:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
      }
      .dictation-input {
        width: 100%;
        padding: 15px;
        margin: 10px 0;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 16px;
        min-height: 150px;
      }
      .dictation-result {
        padding: 15px;
        background-color: #effaf5;
        border-radius: 4px;
        margin-top: 15px;
        display: none;
      }
      .dictation-sentences {
        margin-top: 15px;
      }
      .dictation-sentence {
        padding: 10px;
        margin-bottom: 5px;
        background-color: white;
        border-radius: 4px;
        border-left: 3px solid #cccccc;
      }
      .dictation-sentence.correct {
        border-left-color: #28a745;
      }
      .dictation-sentence.incorrect {
        border-left-color: #dc3545;
      }
    `;
    document.head.appendChild(style);
  });
  
  // Initialize the dictation player with direct DOM creation
  function initDictationPlayer(container, config) {
    const { courseId, lessonId, audioUrl, vttUrl } = config;
    
    // Create player container
    const player = document.createElement('div');
    player.className = 'dictation-player';
    
    // Add controls
    const controls = document.createElement('div');
    controls.className = 'dictation-controls';
    
    // Add play button
    const playBtn = document.createElement('button');
    playBtn.className = 'dictation-btn';
    playBtn.textContent = 'Play';
    playBtn.onclick = function() {
      audio.play();
      playBtn.disabled = true;
      pauseBtn.disabled = false;
    };
    
    // Add pause button
    const pauseBtn = document.createElement('button');
    pauseBtn.className = 'dictation-btn';
    pauseBtn.textContent = 'Pause';
    pauseBtn.disabled = true;
    pauseBtn.onclick = function() {
      audio.pause();
      playBtn.disabled = false;
      pauseBtn.disabled = true;
    };
    
    // Add stop button
    const stopBtn = document.createElement('button');
    stopBtn.className = 'dictation-btn';
    stopBtn.textContent = 'Stop';
    stopBtn.onclick = function() {
      audio.pause();
      audio.currentTime = 0;
      playBtn.disabled = false;
      pauseBtn.disabled = true;
    };
    
    // Add buttons to controls
    controls.appendChild(playBtn);
    controls.appendChild(pauseBtn);
    controls.appendChild(stopBtn);
    
    // Add status info
    const statusInfo = document.createElement('div');
    statusInfo.style.marginTop = '10px';
    statusInfo.textContent = `Course: ${courseId}, Lesson: ${lessonId}`;
    controls.appendChild(statusInfo);
    
    // Add audio element
    const audio = document.createElement('audio');
    audio.src = audioUrl;
    audio.style.display = 'none';
    audio.addEventListener('ended', function() {
      playBtn.disabled = false;
      pauseBtn.disabled = true;
    });
    audio.addEventListener('error', function(e) {
      statusInfo.textContent = `Error loading audio: ${e.message || 'Unknown error'}`;
      statusInfo.style.color = 'red';
    });
    
    // Add dictation input
    const input = document.createElement('textarea');
    input.className = 'dictation-input';
    input.placeholder = 'Type what you hear...';
    
    // Add check button
    const checkBtn = document.createElement('button');
    checkBtn.className = 'dictation-btn';
    checkBtn.textContent = 'Check My Answer';
    checkBtn.onclick = function() {
      // Load VTT and check - in a production app this would have proper VTT parsing
      loadVttContent(vttUrl, function(vttText) {
        const sentences = parseVtt(vttText);
        displayResults(input.value, sentences);
      });
    };
    
    // Add result container
    const resultContainer = document.createElement('div');
    resultContainer.className = 'dictation-result';
    
    // Add sentences container
    const sentencesContainer = document.createElement('div');
    sentencesContainer.className = 'dictation-sentences';
    
    // Add all elements to player
    player.appendChild(controls);
    player.appendChild(audio);
    player.appendChild(input);
    player.appendChild(checkBtn);
    player.appendChild(resultContainer);
    player.appendChild(sentencesContainer);
    
    // Clear container and add player
    container.innerHTML = '';
    container.appendChild(player);
    
    // Function to load VTT content
    function loadVttContent(url, callback) {
      fetch(url)
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          return response.text();
        })
        .then(data => {
          callback(data);
        })
        .catch(error => {
          resultContainer.style.display = 'block';
          resultContainer.textContent = `Error loading VTT file: ${error.message}. Make sure your URL includes ?raw=1 and is publicly accessible.`;
          resultContainer.style.backgroundColor = '#f8d7da';
          resultContainer.style.color = '#721c24';
        });
    }
    
    // Function to parse VTT content
    function parseVtt(vttText) {
      const sentences = [];
      const lines = vttText.split('\n');
      let currentText = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and WEBVTT header
        if (line === '' || line === 'WEBVTT') continue;
        
        // Skip timestamp lines (they contain --> )
        if (line.includes(' --> ')) continue;
        
        // If not a timestamp or header, it's a text line
        if (line && !line.includes(':')) {
          currentText = line;
          sentences.push(currentText);
          currentText = '';
        }
      }
      
      return sentences;
    }
    
    // Function to display results
    function displayResults(userInput, expectedSentences) {
      sentencesContainer.innerHTML = '';
      resultContainer.style.display = 'block';
      
      const userSentences = userInput.split(/[.!?]/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      let correctCount = 0;
      
      // Compare each sentence
      for (let i = 0; i < expectedSentences.length; i++) {
        const expected = expectedSentences[i].toLowerCase().trim();
        const user = (i < userSentences.length) ? 
          userSentences[i].toLowerCase().trim() : '';
        
        const sentence = document.createElement('div');
        sentence.className = 'dictation-sentence';
        
        // Simple comparison - in a real app, this would be more sophisticated
        const isCorrect = expected === user || 
          levenshteinDistance(expected, user) / Math.max(expected.length, 1) < 0.3;
        
        if (isCorrect) {
          sentence.classList.add('correct');
          correctCount++;
        } else {
          sentence.classList.add('incorrect');
        }
        
        sentence.innerHTML = `
          <div><strong>Expected:</strong> ${expectedSentences[i]}</div>
          <div><strong>Your answer:</strong> ${i < userSentences.length ? userSentences[i] : '<missing>'}</div>
        `;
        
        sentencesContainer.appendChild(sentence);
      }
      
      // Calculate score
      const score = Math.round((correctCount / expectedSentences.length) * 100);
      
      resultContainer.innerHTML = `
        <h3>Your Result</h3>
        <p>You got ${correctCount} out of ${expectedSentences.length} sentences correct.</p>
        <p><strong>Score: ${score}%</strong></p>
      `;
    }
    
    // Helper function to calculate Levenshtein distance for fuzzy matching
    function levenshteinDistance(a, b) {
      if (a.length === 0) return b.length;
      if (b.length === 0) return a.length;
      
      const matrix = [];
      
      // Initialize matrix
      for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
      }
      
      for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
      }
      
      // Fill matrix
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1, // substitution
              matrix[i][j - 1] + 1,     // insertion
              matrix[i - 1][j] + 1      // deletion
            );
          }
        }
      }
      
      return matrix[b.length][a.length];
    }
  }
})();
