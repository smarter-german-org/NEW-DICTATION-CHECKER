#!/usr/bin/env node
/**
 * Dropbox Synced Files Helper
 * 
 * This script helps generate embedding code for audio files 
 * that are synced with Dropbox on your local machine.
 * 
 * Usage: node dropbox-synced-helper.js [syncedFolderPath]
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';

// For URL formatting
function formatDropboxUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    let formattedUrl = url.trim();
    
    // Extract parts
    const urlObj = new URL(formattedUrl);
    
    // Step 1: Replace the domain
    urlObj.hostname = 'dl.dropboxusercontent.com';
    
    // Step 2: Create a new search params object
    const searchParams = new URLSearchParams(urlObj.search);
    
    // Step 3: Remove the st parameter and set raw=1
    searchParams.delete('st');
    searchParams.delete('dl');
    searchParams.set('raw', '1');
    
    // Step 4: Update the URL search
    urlObj.search = searchParams.toString();
    
    // Final URL
    formattedUrl = urlObj.toString();
    
    return formattedUrl;
  } catch (error) {
    console.error('Error formatting Dropbox URL:', error);
    return url;
  }
}

// Define a structure to store audio and VTT links
const fileLinks = {
  app: {
    embedHtml: '',
    integrationJs: ''
  },
  courses: {}
};

// Configuration for embedding code
const CONFIG = {
  appUrl: '',      // Will be set to the full URL of the embedded app
  scriptUrl: ''    // Will be set to the full URL of the integration script
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main function
async function main() {
  console.log('\n=== Dropbox Synced Files Helper ===\n');
  
  // First, set up the app links
  await setupAppLinks();
  
  // Show main menu
  showMainMenu();
}

// Set up app links
async function setupAppLinks() {
  console.log('First, we need the links to your app files hosted on Dropbox.\n');
  
  return new Promise((resolve) => {
    rl.question('Paste the Dropbox link to embed.html: ', (embedUrl) => {
      CONFIG.appUrl = formatDropboxUrl(embedUrl);
      console.log(`Formatted URL: ${CONFIG.appUrl}\n`);
      
      rl.question('Paste the Dropbox link to teachable-integration.js: ', (scriptUrl) => {
        CONFIG.scriptUrl = formatDropboxUrl(scriptUrl);
        console.log(`Formatted URL: ${CONFIG.scriptUrl}\n`);
        
        console.log('App links set. Now you can manage your audio files.\n');
        resolve();
      });
    });
  });
}

// Show main menu
function showMainMenu() {
  console.log('\n=== Main Menu ===');
  console.log('1. Add a single audio file');
  console.log('2. Scan a directory for audio files');
  console.log('3. Generate embedding code for a course/lesson');
  console.log('4. Export all links to CSV');
  console.log('5. Update app links');
  console.log('6. Exit\n');
  
  rl.question('Choose an option (1-6): ', (choice) => {
    switch(choice.trim()) {
      case '1':
        addSingleFile();
        break;
      case '2':
        scanDirectory();
        break;
      case '3':
        generateEmbeddingCode();
        break;
      case '4':
        exportToCSV();
        break;
      case '5':
        setupAppLinks().then(() => showMainMenu());
        break;
      case '6':
        rl.close();
        console.log('\nThank you for using the Dropbox Synced Files Helper!\n');
        break;
      default:
        console.log('Invalid option. Please try again.');
        showMainMenu();
        break;
    }
  });
}

// Add a single file
function addSingleFile() {
  console.log('\n=== Add a Single Audio File ===');
  
  rl.question('Course name or ID: ', (courseId) => {
    courseId = courseId.trim();
    if (!fileLinks.courses[courseId]) {
      fileLinks.courses[courseId] = {};
    }
    
    rl.question('Lesson name or ID: ', (lessonId) => {
      lessonId = lessonId.trim();
      
      rl.question('Full path to audio file: ', async (audioPath) => {
        audioPath = audioPath.trim();
        if (!fs.existsSync(audioPath)) {
          console.log('File not found. Please check the path and try again.');
          return showMainMenu();
        }
        
        console.log('Retrieving Dropbox link for audio file...');
        
        try {
          // First check if we're on macOS or another platform
          let audioUrl = '';
          
          if (process.platform === 'darwin') {
            // Try to use AppleScript to get the Dropbox link on macOS
            try {
              // This will only work if the file is in a Dropbox synced folder
              const script = `
                tell application "Finder"
                  set theFile to POSIX file "${audioPath}" as alias
                  tell application "Dropbox"
                    set shareLinkUrl to get shareable link for theFile
                    return shareLinkUrl
                  end tell
                end tell
              `;
              
              console.log('Attempting to get Dropbox link via AppleScript...');
              // Note: This requires Dropbox desktop app to be installed and running
              audioUrl = execSync(`osascript -e '${script}'`).toString().trim();
            } catch (e) {
              console.log('Could not automatically get Dropbox link.');
              console.log('Please right-click the file in Finder, choose "Copy Dropbox Link", and paste it here.');
            }
          }
          
          if (!audioUrl) {
            rl.question('Please paste the Dropbox link for the audio file: ', (pastedUrl) => {
              processAudioLinks(courseId, lessonId, pastedUrl.trim());
            });
          } else {
            processAudioLinks(courseId, lessonId, audioUrl);
          }
        } catch (error) {
          console.error('Error processing audio file:', error);
          rl.question('\nPlease paste the Dropbox link manually: ', (pastedUrl) => {
            processAudioLinks(courseId, lessonId, pastedUrl.trim());
          });
        }
      });
    });
  });
}

// Process audio links
function processAudioLinks(courseId, lessonId, audioUrl) {
  // Format the URL
  const formattedAudioUrl = formatDropboxUrl(audioUrl);
  console.log(`Formatted audio URL: ${formattedAudioUrl}`);
  
  // Now ask for the VTT file
  rl.question('\nPaste the Dropbox link for the VTT file: ', (vttUrl) => {
    const formattedVttUrl = formatDropboxUrl(vttUrl.trim());
    console.log(`Formatted VTT URL: ${formattedVttUrl}\n`);
    
    // Store the links
    if (!fileLinks.courses[courseId]) {
      fileLinks.courses[courseId] = {};
    }
    
    fileLinks.courses[courseId][lessonId] = {
      audio: formattedAudioUrl,
      vtt: formattedVttUrl
    };
    
    // Save the links to file
    saveLinksToFile();
    
    // Ask if user wants to generate code now
    rl.question('Generate embedding code for this file now? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        generateCodeForLesson(courseId, lessonId);
      } else {
        showMainMenu();
      }
    });
  });
}

// Generate code for a lesson
function generateCodeForLesson(courseId, lessonId) {
  if (!fileLinks.courses[courseId] || !fileLinks.courses[courseId][lessonId]) {
    console.log('Course or lesson not found.');
    return showMainMenu();
  }
  
  const lesson = fileLinks.courses[courseId][lessonId];
  
  // Generate the HTML
  const htmlCode = `<!-- Dictation Exercise - Course ${courseId}, Lesson ${lessonId} -->
<div class="dictation-app-container" 
     data-course-id="${courseId}" 
     data-lesson-id="${lessonId}" 
     data-audio-url="${lesson.audio}"
     data-vtt-url="${lesson.vtt}">
</div>

<script src="${CONFIG.scriptUrl}"></script>`;

  console.log('\n=== Copy this code into your Teachable lesson HTML editor ===\n');
  console.log(htmlCode);
  console.log('\n===============================================================\n');
  
  // Ask if user wants to save the code to a file
  rl.question('Save this code to a file? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      const fileName = `teachable-code-course${courseId}-lesson${lessonId}.html`;
      
      fs.writeFile(fileName, htmlCode, (err) => {
        if (err) {
          console.error('Error saving file:', err);
        } else {
          console.log(`Code saved to ${fileName}`);
        }
        showMainMenu();
      });
    } else {
      showMainMenu();
    }
  });
}

// Scan directory for audio files
function scanDirectory() {
  console.log('\n=== Scan Directory for Audio Files ===');
  
  rl.question('Enter the path to the directory containing audio files: ', (dirPath) => {
    dirPath = dirPath.trim();
    
    if (!fs.existsSync(dirPath)) {
      console.log('Directory not found. Please check the path and try again.');
      return showMainMenu();
    }
    
    rl.question('Course name or ID for these files: ', (courseId) => {
      courseId = courseId.trim();
      
      if (!fileLinks.courses[courseId]) {
        fileLinks.courses[courseId] = {};
      }
      
      console.log(`\nScanning directory: ${dirPath}`);
      const files = fs.readdirSync(dirPath);
      const audioFiles = files.filter(file => file.endsWith('.mp3'));
      
      console.log(`Found ${audioFiles.length} audio files.`);
      
      if (audioFiles.length === 0) {
        console.log('No audio files found in this directory.');
        return showMainMenu();
      }
      
      console.log('\nFor each audio file, you will need to provide the lesson ID and VTT file link.');
      processNextAudioFile(courseId, dirPath, audioFiles, 0);
    });
  });
}

// Process audio files one by one
function processNextAudioFile(courseId, dirPath, audioFiles, index) {
  if (index >= audioFiles.length) {
    console.log('\nAll audio files processed!');
    saveLinksToFile();
    return showMainMenu();
  }
  
  const audioFile = audioFiles[index];
  const audioPath = path.join(dirPath, audioFile);
  
  console.log(`\nProcessing file ${index + 1}/${audioFiles.length}: ${audioFile}`);
  
  rl.question('Lesson name or ID: ', (lessonId) => {
    lessonId = lessonId.trim();
    
    console.log('Getting Dropbox link for audio file...');
    
    // Try to use the operating system to get the link, otherwise prompt
    if (process.platform === 'darwin') {
      try {
        const script = `
          tell application "Finder"
            set theFile to POSIX file "${audioPath}" as alias
            tell application "Dropbox"
              set shareLinkUrl to get shareable link for theFile
              return shareLinkUrl
            end tell
          end tell
        `;
        
        try {
          const audioUrl = execSync(`osascript -e '${script}'`).toString().trim();
          console.log(`Retrieved link: ${audioUrl}`);
          promptForVtt(courseId, lessonId, audioUrl, dirPath, audioFiles, index);
        } catch (e) {
          console.log('Could not automatically get Dropbox link.');
          rl.question('Please paste the Dropbox link for the audio file: ', (audioUrl) => {
            promptForVtt(courseId, lessonId, audioUrl, dirPath, audioFiles, index);
          });
        }
      } catch (err) {
        console.error('Error getting Dropbox link:', err);
        rl.question('Please paste the Dropbox link for the audio file: ', (audioUrl) => {
          promptForVtt(courseId, lessonId, audioUrl, dirPath, audioFiles, index);
        });
      }
    } else {
      rl.question('Please paste the Dropbox link for the audio file: ', (audioUrl) => {
        promptForVtt(courseId, lessonId, audioUrl, dirPath, audioFiles, index);
      });
    }
  });
}

// Prompt for VTT file
function promptForVtt(courseId, lessonId, audioUrl, dirPath, audioFiles, index) {
  const formattedAudioUrl = formatDropboxUrl(audioUrl.trim());
  console.log(`Formatted audio URL: ${formattedAudioUrl}`);
  
  // Check if VTT file exists with same base name
  const audioBase = path.basename(audioFiles[index], path.extname(audioFiles[index]));
  const potentialVttPath = path.join(dirPath, `${audioBase}.vtt`);
  
  if (fs.existsSync(potentialVttPath)) {
    console.log(`Found matching VTT file: ${audioBase}.vtt`);
    
    if (process.platform === 'darwin') {
      try {
        const script = `
          tell application "Finder"
            set theFile to POSIX file "${potentialVttPath}" as alias
            tell application "Dropbox"
              set shareLinkUrl to get shareable link for theFile
              return shareLinkUrl
            end tell
          end tell
        `;
        
        try {
          const vttUrl = execSync(`osascript -e '${script}'`).toString().trim();
          console.log(`Retrieved link: ${vttUrl}`);
          saveAndContinue(courseId, lessonId, formattedAudioUrl, vttUrl, dirPath, audioFiles, index);
        } catch (e) {
          console.log('Could not automatically get Dropbox link for VTT.');
          rl.question('Please paste the Dropbox link for the VTT file: ', (vttUrl) => {
            saveAndContinue(courseId, lessonId, formattedAudioUrl, vttUrl, dirPath, audioFiles, index);
          });
        }
      } catch (err) {
        rl.question('Please paste the Dropbox link for the VTT file: ', (vttUrl) => {
          saveAndContinue(courseId, lessonId, formattedAudioUrl, vttUrl, dirPath, audioFiles, index);
        });
      }
    } else {
      rl.question('Please paste the Dropbox link for the VTT file: ', (vttUrl) => {
        saveAndContinue(courseId, lessonId, formattedAudioUrl, vttUrl, dirPath, audioFiles, index);
      });
    }
  } else {
    console.log('No matching VTT file found.');
    rl.question('Please paste the Dropbox link for the VTT file: ', (vttUrl) => {
      saveAndContinue(courseId, lessonId, formattedAudioUrl, vttUrl, dirPath, audioFiles, index);
    });
  }
}

// Save links and continue processing
function saveAndContinue(courseId, lessonId, audioUrl, vttUrl, dirPath, audioFiles, index) {
  const formattedVttUrl = formatDropboxUrl(vttUrl.trim());
  console.log(`Formatted VTT URL: ${formattedVttUrl}`);
  
  // Store the links
  if (!fileLinks.courses[courseId]) {
    fileLinks.courses[courseId] = {};
  }
  
  fileLinks.courses[courseId][lessonId] = {
    audio: audioUrl,
    vtt: formattedVttUrl
  };
  
  // Save the links and process next file
  saveLinksToFile();
  processNextAudioFile(courseId, dirPath, audioFiles, index + 1);
}

// Save links to file
function saveLinksToFile() {
  const data = JSON.stringify(fileLinks, null, 2);
  fs.writeFileSync('dictation-links.json', data);
  console.log('Links saved to dictation-links.json');
}

// Generate embedding code
function generateEmbeddingCode() {
  console.log('\n=== Generate Embedding Code ===');
  
  try {
    if (!fs.existsSync('dictation-links.json')) {
      console.log('No links file found. Please add some files first.');
      return showMainMenu();
    }
    
    const data = fs.readFileSync('dictation-links.json', 'utf8');
    const links = JSON.parse(data);
    
    // Update current data with file data
    fileLinks.courses = links.courses;
    CONFIG.appUrl = links.app.embedHtml || CONFIG.appUrl;
    CONFIG.scriptUrl = links.app.integrationJs || CONFIG.scriptUrl;
    
    // Get available courses
    const courses = Object.keys(fileLinks.courses);
    
    if (courses.length === 0) {
      console.log('No courses found in the links file.');
      return showMainMenu();
    }
    
    console.log('\nAvailable courses:');
    courses.forEach((course, index) => {
      console.log(`${index + 1}. ${course}`);
    });
    
    rl.question('\nSelect a course number: ', (courseIndex) => {
      const index = parseInt(courseIndex.trim()) - 1;
      
      if (isNaN(index) || index < 0 || index >= courses.length) {
        console.log('Invalid selection.');
        return showMainMenu();
      }
      
      const selectedCourse = courses[index];
      const lessons = Object.keys(fileLinks.courses[selectedCourse]);
      
      if (lessons.length === 0) {
        console.log('No lessons found for this course.');
        return showMainMenu();
      }
      
      console.log(`\nLessons for course ${selectedCourse}:`);
      lessons.forEach((lesson, index) => {
        console.log(`${index + 1}. ${lesson}`);
      });
      
      rl.question('\nSelect a lesson number (or "all" for all lessons): ', (lessonInput) => {
        if (lessonInput.trim().toLowerCase() === 'all') {
          // Generate code for all lessons
          generateCodeForAllLessons(selectedCourse, lessons);
        } else {
          const lessonIndex = parseInt(lessonInput.trim()) - 1;
          
          if (isNaN(lessonIndex) || lessonIndex < 0 || lessonIndex >= lessons.length) {
            console.log('Invalid selection.');
            return showMainMenu();
          }
          
          const selectedLesson = lessons[lessonIndex];
          generateCodeForLesson(selectedCourse, selectedLesson);
        }
      });
    });
  } catch (error) {
    console.error('Error loading links:', error);
    return showMainMenu();
  }
}

// Generate code for all lessons
function generateCodeForAllLessons(courseId, lessons) {
  console.log(`\nGenerating code for all lessons in course ${courseId}...`);
  
  // Create a directory for the output
  const outputDir = `teachable-codes-course${courseId}`;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  // Generate code for each lesson
  let combinedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Teachable Embed Codes for Course ${courseId}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; }
    h1, h2 { color: #333; }
    .lesson-code { margin: 30px 0; padding: 15px; border: 1px solid #ddd; background: #f9f9f9; }
    code { display: block; white-space: pre-wrap; padding: 10px; background: #f1f1f1; border: 1px solid #ddd; }
    .copy-btn { padding: 5px 10px; margin-top: 10px; cursor: pointer; background: #4CAF50; color: white; border: none; }
  </style>
</head>
<body>
  <h1>Teachable Embed Codes for Course ${courseId}</h1>
  <p>Below are the HTML code snippets for each lesson. Copy and paste them into your Teachable lesson HTML editor.</p>
`;
  
  lessons.forEach(lessonId => {
    const lesson = fileLinks.courses[courseId][lessonId];
    
    // Generate the HTML
    const htmlCode = `<!-- Dictation Exercise - Course ${courseId}, Lesson ${lessonId} -->
<div class="dictation-app-container" 
     data-course-id="${courseId}" 
     data-lesson-id="${lessonId}" 
     data-audio-url="${lesson.audio}"
     data-vtt-url="${lesson.vtt}">
</div>

<script src="${CONFIG.scriptUrl}"></script>`;
    
    // Save to individual file
    const fileName = path.join(outputDir, `lesson${lessonId}.html`);
    fs.writeFileSync(fileName, htmlCode);
    
    // Add to combined HTML
    combinedHtml += `
  <div class="lesson-code">
    <h2>Lesson ${lessonId}</h2>
    <code>${htmlCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code>
    <button class="copy-btn" onclick="copyToClipboard(this.previousElementSibling)">Copy Code</button>
  </div>
`;
  });
  
  // Add JavaScript for copy functionality
  combinedHtml += `
  <script>
    function copyToClipboard(element) {
      const text = element.textContent;
      navigator.clipboard.writeText(text).then(() => {
        alert('Code copied to clipboard!');
      }, () => {
        alert('Failed to copy code.');
      });
    }
  </script>
</body>
</html>`;
  
  // Save the combined HTML
  fs.writeFileSync(path.join(outputDir, 'all-lessons.html'), combinedHtml);
  
  console.log(`\nCode generated for ${lessons.length} lessons.`);
  console.log(`Files saved to directory: ${outputDir}`);
  console.log(`Open '${outputDir}/all-lessons.html' in a browser to view and copy the codes.`);
  
  showMainMenu();
}

// Export links to CSV
function exportToCSV() {
  console.log('\n=== Export Links to CSV ===');
  
  try {
    if (!fs.existsSync('dictation-links.json')) {
      console.log('No links file found. Please add some files first.');
      return showMainMenu();
    }
    
    const data = fs.readFileSync('dictation-links.json', 'utf8');
    const links = JSON.parse(data);
    
    let csvContent = 'CourseID,LessonID,AudioURL,VTTURL\n';
    
    Object.keys(links.courses).forEach(courseId => {
      Object.keys(links.courses[courseId]).forEach(lessonId => {
        const lesson = links.courses[courseId][lessonId];
        csvContent += `${courseId},${lessonId},${lesson.audio},${lesson.vtt}\n`;
      });
    });
    
    const outputFile = 'dictation-links.csv';
    fs.writeFileSync(outputFile, csvContent);
    
    console.log(`\nLinks exported to ${outputFile}`);
    
    showMainMenu();
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return showMainMenu();
  }
}

// Run the main function
main();
