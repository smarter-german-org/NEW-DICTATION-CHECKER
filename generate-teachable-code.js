#!/usr/bin/env node
/**
 * Teachable Integration Code Generator
 * 
 * This utility helps you quickly generate the HTML code needed to embed
 * the Dictation Checker app in Teachable lessons.
 * 
 * Usage: node generate-teachable-code.js
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const CONFIG = {
  baseUrl: '',      // Will be set based on hosting platform
  appUrl: '',       // Will be set to the full URL of the embedded app
  scriptUrl: ''     // Will be set to the full URL of the integration script
};

console.log('\n=== Teachable Integration Code Generator ===\n');

// Prompt for hosting config
function promptForDomain() {
  rl.question(`Hosting platform (github, dropbox, aws, or custom): `, (platform) => {
    platform = platform.trim().toLowerCase();
    
    if (platform === 'github') {
      rl.question('GitHub username: ', (username) => {
        CONFIG.baseUrl = `https://${username}.github.io`;
        rl.question('Repository name: ', (repo) => {
          // For GitHub Pages, the app and script URLs are within the repo
          CONFIG.appUrl = `${CONFIG.baseUrl}/${repo}/embed.html`;
          CONFIG.scriptUrl = `${CONFIG.baseUrl}/${repo}/teachable-integration.js`;
          promptForCourseLesson();
        });
      });
    } else if (platform === 'dropbox') {
      console.log('\nUsing Dropbox as hosting platform');
      console.log('Note: For Dropbox links, make sure to:');
      console.log('1. Use "Copy Link" option from Dropbox');
      console.log('2. Change "www.dropbox.com" to "dl.dropboxusercontent.com"');
      console.log('3. Remove "?dl=0" and replace with "?raw=1" at the end\n');
      
      rl.question('Full URL to embedded app (embed.html): ', (appUrl) => {
        CONFIG.appUrl = formatDropboxUrl(appUrl);
        rl.question('Full URL to integration script (teachable-integration.js): ', (scriptUrl) => {
          CONFIG.scriptUrl = formatDropboxUrl(scriptUrl);
          promptForCourseLesson();
        });
      });
    } else if (platform === 'aws') {
      rl.question('S3 bucket URL (e.g., https://bucket-name.s3.amazonaws.com): ', (bucketUrl) => {
        CONFIG.baseUrl = bucketUrl.trim().replace(/\/$/, '');
        rl.question('Path to app folder (e.g., /dictation-app): ', (appPath) => {
          const normalizedPath = appPath.startsWith('/') ? appPath : `/${appPath}`;
          CONFIG.appUrl = `${CONFIG.baseUrl}${normalizedPath}/embed.html`;
          CONFIG.scriptUrl = `${CONFIG.baseUrl}${normalizedPath}/teachable-integration.js`;
          promptForCourseLesson();
        });
      });
    } else if (platform === 'custom') {
      rl.question('Full URL to embedded app (embed.html): ', (appUrl) => {
        CONFIG.appUrl = appUrl.trim();
        rl.question('Full URL to integration script (teachable-integration.js): ', (scriptUrl) => {
          CONFIG.scriptUrl = scriptUrl.trim();
          promptForCourseLesson();
        });
      });
    } else {
      console.log('Unrecognized platform. Please provide direct URLs:');
      promptForDomain();
    }
  });
}

// Format Dropbox URL for direct access
function formatDropboxUrl(url) {
  return url.trim()
    .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
    .replace('?dl=0', '?raw=1');
}

// Prompt for course and lesson info
function promptForCourseLesson() {
  console.log('\nGenerating code for dictation exercise:');
  
  rl.question('Course name or number: ', (course) => {
    const courseId = course.trim();
    
    rl.question('Lesson name or number: ', (lesson) => {
      const lessonId = lesson.trim();
      
      console.log('\nEnter the full URLs for your audio and VTT files:');
      console.log('For Dropbox links, remember to use the dl.dropboxusercontent.com format with ?raw=1\n');
      
      rl.question('Complete audio URL: ', (audioUrl) => {
        let processedAudioUrl = audioUrl.trim();
        
        // Auto-format Dropbox URLs if they appear to be Dropbox links
        if (processedAudioUrl.includes('dropbox.com')) {
          processedAudioUrl = formatDropboxUrl(processedAudioUrl);
          console.log(`Formatted audio URL: ${processedAudioUrl}`);
        }
        
        rl.question('Complete VTT URL: ', (vttUrl) => {
          let processedVttUrl = vttUrl.trim();
          
          // Auto-format Dropbox URLs if they appear to be Dropbox links
          if (processedVttUrl.includes('dropbox.com')) {
            processedVttUrl = formatDropboxUrl(processedVttUrl);
            console.log(`Formatted VTT URL: ${processedVttUrl}`);
          }
          
          generateCode(courseId, lessonId, processedAudioUrl, processedVttUrl);
        });
      });
    });
  });
}

// Generate the HTML code
function generateCode(courseId, lessonId, audioUrl, vttUrl) {
  // Generate the HTML
  const htmlCode = `<!-- Dictation Exercise - Course ${courseId}, Lesson ${lessonId} -->
<div class="dictation-app-container" 
     data-course-id="${courseId}" 
     data-lesson-id="${lessonId}" 
     data-audio-url="${audioUrl}"
     data-vtt-url="${vttUrl}">
</div>

<script src="${CONFIG.scriptUrl}"></script>`;

  // Display the result
  console.log('\n=== Copy this code into your Teachable lesson HTML editor ===\n');
  console.log(htmlCode);
  console.log('\n===============================================================\n');
  
  // Ask if user wants to save the code to a file
  rl.question('Do you want to save this code to a file? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      saveCodeToFile(courseId, lessonId, htmlCode);
    } else {
      askForAnother();
    }
  });
}

// Save the generated code to a file
function saveCodeToFile(courseId, lessonId, htmlCode) {
  const fileName = `teachable-code-course${courseId}-lesson${lessonId}.html`;
  
  fs.writeFile(fileName, htmlCode, (err) => {
    if (err) {
      console.error('Error saving file:', err);
    } else {
      console.log(`Code saved to ${fileName}`);
    }
    askForAnother();
  });
}

// Ask if the user wants to generate another code
function askForAnother() {
  rl.question('Generate code for another lesson? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      promptForCourseLesson();
    } else {
      rl.close();
      console.log('\nThank you for using the Teachable Integration Code Generator!\n');
    }
  });
}

// Start the process
promptForDomain();
