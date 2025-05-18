#!/usr/bin/env node
/**
 * Batch Dropbox URL Formatter
 * 
 * This utility helps you convert multiple Dropbox share links to direct download links
 * and generate HTML embed code for Teachable lessons.
 * 
 * Usage: node format-dictation-batch.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { formatDropboxUrl } = require('./format-dropbox-url');

// Configuration
const CONFIG = {
  appUrl: '',  // Will be set to the URL of your embed.html
  scriptUrl: '' // Will be set to the URL of your teachable-integration.js
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Batch Dictation Code Generator ===\n');

// Start the process
setupAppLinks();

/**
 * Setup app links from Dropbox
 */
function setupAppLinks() {
  console.log('First, we need the links to your app files hosted on Dropbox.\n');
  console.log('Please get the "Copy link" for these files from your Dropbox:');
  console.log('1. embed.html (the embedded app entry point)');
  console.log('2. teachable-integration.js (the integration script)\n');
  
  rl.question('Paste the Dropbox link to embed.html: ', (embedUrl) => {
    CONFIG.appUrl = formatDropboxUrl(embedUrl);
    console.log(`Formatted URL: ${CONFIG.appUrl}\n`);
    
    rl.question('Paste the Dropbox link to teachable-integration.js: ', (scriptUrl) => {
      CONFIG.scriptUrl = formatDropboxUrl(scriptUrl);
      console.log(`Formatted URL: ${CONFIG.scriptUrl}\n`);
      
      console.log('App links set. Now we can generate code for your lessons.\n');
      showMainMenu();
    });
  });
}

/**
 * Show the main menu
 */
function showMainMenu() {
  console.log('\n=== Main Menu ===');
  console.log('1. Generate code for a single lesson');
  console.log('2. Generate code for multiple lessons from a CSV/text file');
  console.log('3. Update app links');
  console.log('4. Exit\n');
  
  rl.question('Choose an option (1-4): ', (choice) => {
    switch(choice.trim()) {
      case '1':
        generateSingleLesson();
        break;
      case '2':
        generateBatchLessons();
        break;
      case '3':
        setupAppLinks();
        break;
      case '4':
        rl.close();
        console.log('\nThank you for using the Batch Dictation Code Generator!\n');
        break;
      default:
        console.log('Invalid option. Please try again.');
        showMainMenu();
        break;
    }
  });
}

/**
 * Generate code for a single lesson
 */
function generateSingleLesson() {
  console.log('\n=== Generate Code for Single Lesson ===');
  
  rl.question('Course name or ID: ', (courseId) => {
    rl.question('Lesson name or ID: ', (lessonId) => {
      rl.question('Paste Dropbox link to audio file: ', (audioUrl) => {
        const formattedAudioUrl = formatDropboxUrl(audioUrl);
        console.log(`Formatted audio URL: ${formattedAudioUrl}\n`);
        
        rl.question('Paste Dropbox link to VTT file: ', (vttUrl) => {
          const formattedVttUrl = formatDropboxUrl(vttUrl);
          console.log(`Formatted VTT URL: ${formattedVttUrl}\n`);
          
          // Generate and display the HTML
          const htmlCode = generateHtmlCode(courseId, lessonId, formattedAudioUrl, formattedVttUrl);
          console.log('\n=== Embed Code for Teachable ===\n');
          console.log(htmlCode);
          console.log('\n===============================\n');
          
          rl.question('Save this code to a file? (y/n): ', (answer) => {
            if (answer.toLowerCase() === 'y') {
              saveCodeToFile(courseId, lessonId, htmlCode);
            } else {
              showMainMenu();
            }
          });
        });
      });
    });
  });
}

/**
 * Generate code for multiple lessons from a CSV/text file
 */
function generateBatchLessons() {
  console.log('\n=== Generate Code for Multiple Lessons ===');
  console.log('This option reads a CSV file with the following format:');
  console.log('CourseID,LessonID,AudioURL,VTTURL');
  console.log('Example: A1,L01,https://www.dropbox.com/path/to/audio.mp3,https://www.dropbox.com/path/to/vtt.vtt\n');
  
  rl.question('Path to CSV file: ', (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`Error: File not found at ${filePath}`);
        showMainMenu();
        return;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');
      const results = [];
      
      // Skip header if present
      const startIndex = lines[0].toLowerCase().includes('courseid') ? 1 : 0;
      
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length < 4) {
          console.log(`Warning: Line ${i+1} doesn't have enough columns. Skipping.`);
          continue;
        }
        
        const courseId = parts[0].trim();
        const lessonId = parts[1].trim();
        const audioUrl = formatDropboxUrl(parts[2].trim());
        const vttUrl = formatDropboxUrl(parts[3].trim());
        
        const htmlCode = generateHtmlCode(courseId, lessonId, audioUrl, vttUrl);
        results.push({
          courseId,
          lessonId,
          htmlCode
        });
      }
      
      if (results.length === 0) {
        console.log('No valid entries found in the file.');
        showMainMenu();
        return;
      }
      
      console.log(`\nProcessed ${results.length} lessons.`);
      
      // Ask whether to save to individual files or one combined file
      rl.question('\nSave as (1) individual files or (2) single combined file? (1/2): ', (answer) => {
        if (answer.trim() === '1') {
          // Save as individual files
          const outputDir = `lesson-codes-${new Date().toISOString().replace(/[:.]/g, '-')}`;
          fs.mkdirSync(outputDir, { recursive: true });
          
          results.forEach(result => {
            const fileName = path.join(outputDir, `teachable-code-course${result.courseId}-lesson${result.lessonId}.html`);
            fs.writeFileSync(fileName, result.htmlCode);
          });
          
          console.log(`\nSaved ${results.length} files to directory: ${outputDir}`);
          showMainMenu();
        } else {
          // Save as combined file
          const fileName = `teachable-codes-combined-${new Date().toISOString().replace(/[:.]/g, '-')}.html`;
          let combinedContent = '<!DOCTYPE html>\n<html>\n<head>\n<title>Teachable Embed Codes</title>\n';
          combinedContent += '<style>body{font-family:sans-serif;max-width:900px;margin:0 auto;padding:20px}';
          combinedContent += '.lesson-code{margin:30px 0;padding:15px;border:1px solid #ddd;background:#f9f9f9;}</style>\n';
          combinedContent += '</head>\n<body>\n<h1>Teachable Embed Codes</h1>\n\n';
          
          results.forEach(result => {
            combinedContent += `<div class="lesson-code">\n<h2>Course ${result.courseId}, Lesson ${result.lessonId}</h2>\n`;
            combinedContent += `<pre><code>${result.htmlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>\n</div>\n\n`;
          });
          
          combinedContent += '</body>\n</html>';
          fs.writeFileSync(fileName, combinedContent);
          
          console.log(`\nSaved combined output to: ${fileName}`);
          showMainMenu();
        }
      });
      
    } catch (error) {
      console.log(`Error processing file: ${error.message}`);
      showMainMenu();
    }
  });
}

/**
 * Generate HTML code for embedding in Teachable
 */
function generateHtmlCode(courseId, lessonId, audioUrl, vttUrl) {
  return `<!-- Dictation Exercise - Course ${courseId}, Lesson ${lessonId} -->
<div class="dictation-app-container" 
     data-course-id="${courseId}" 
     data-lesson-id="${lessonId}" 
     data-audio-url="${audioUrl}"
     data-vtt-url="${vttUrl}">
</div>

<script src="${CONFIG.scriptUrl}"></script>`;
}

/**
 * Save generated code to a file
 */
function saveCodeToFile(courseId, lessonId, htmlCode) {
  const fileName = `teachable-code-course${courseId}-lesson${lessonId}.html`;
  
  fs.writeFile(fileName, htmlCode, (err) => {
    if (err) {
      console.error('Error saving file:', err);
    } else {
      console.log(`Code saved to ${fileName}`);
    }
    showMainMenu();
  });
}
