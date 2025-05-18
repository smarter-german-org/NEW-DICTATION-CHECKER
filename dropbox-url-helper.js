#!/usr/bin/env node
/**
 * Dropbox URL Helper for Dictation App
 * 
 * This utility helps you work with Dropbox links for your audio and VTT files.
 * It can:
 * 1. Convert standard Dropbox URLs to direct download links
 * 2. Batch process a list of URLs from a CSV/text file
 * 3. Generate a mapping file for your content
 * 
 * Usage: node dropbox-url-helper.js
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== Dropbox URL Helper for Dictation App ===\n');

// Main menu
function showMainMenu() {
  console.log('\nSelect an option:');
  console.log('1. Convert a single Dropbox URL');
  console.log('2. Batch convert URLs from a file');
  console.log('3. Generate a content mapping file');
  console.log('4. Exit');
  
  rl.question('\nEnter your choice (1-4): ', (answer) => {
    switch(answer.trim()) {
      case '1':
        convertSingleUrl();
        break;
      case '2':
        batchConvertUrls();
        break;
      case '3':
        generateMappingFile();
        break;
      case '4':
        rl.close();
        console.log('\nThank you for using the Dropbox URL Helper!\n');
        break;
      default:
        console.log('\nInvalid choice. Please try again.');
        showMainMenu();
        break;
    }
  });
}

// Convert a single Dropbox URL
function convertSingleUrl() {
  rl.question('\nEnter the Dropbox URL to convert: ', (url) => {
    const convertedUrl = formatDropboxUrl(url);
    console.log('\nConverted URL:');
    console.log(convertedUrl);
    
    rl.question('\nPress Enter to continue...', () => {
      showMainMenu();
    });
  });
}

// Batch convert URLs from a file
function batchConvertUrls() {
  rl.question('\nEnter the path to your file with URLs (one URL per line): ', (filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`\nError: File not found at ${filePath}`);
        showMainMenu();
        return;
      }
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const lines = fileContent.split('\n');
      const convertedUrls = [];
      
      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine && trimmedLine.includes('dropbox.com')) {
          convertedUrls.push({
            original: trimmedLine,
            converted: formatDropboxUrl(trimmedLine)
          });
        }
      });
      
      if (convertedUrls.length === 0) {
        console.log('\nNo Dropbox URLs found in the file.');
        showMainMenu();
        return;
      }
      
      // Save the results
      const outputPath = `${path.dirname(filePath)}/converted_urls.csv`;
      let csvContent = 'Original URL,Converted URL\n';
      
      convertedUrls.forEach((item) => {
        csvContent += `"${item.original}","${item.converted}"\n`;
      });
      
      fs.writeFileSync(outputPath, csvContent);
      console.log(`\nConverted ${convertedUrls.length} URLs. Results saved to: ${outputPath}`);
      
      rl.question('\nPress Enter to continue...', () => {
        showMainMenu();
      });
      
    } catch (error) {
      console.log(`\nError processing file: ${error.message}`);
      showMainMenu();
    }
  });
}

// Generate a content mapping file
function generateMappingFile() {
  console.log('\nThis will help you create a mapping of your course content with proper Dropbox URLs.');
  
  rl.question('How many courses do you have? ', (numCoursesStr) => {
    const numCourses = parseInt(numCoursesStr, 10);
    
    if (isNaN(numCourses) || numCourses <= 0) {
      console.log('Please enter a valid number.');
      return generateMappingFile();
    }
    
    const contentMap = {
      courses: {}
    };
    
    processNextCourse(1, numCourses, contentMap);
  });
}

// Process course information recursively
function processNextCourse(currentCourse, totalCourses, contentMap) {
  if (currentCourse > totalCourses) {
    // All courses processed, save the mapping file
    const jsonContent = JSON.stringify(contentMap, null, 2);
    const outputPath = 'content-mapping.json';
    
    fs.writeFileSync(outputPath, jsonContent);
    console.log(`\nContent mapping saved to: ${outputPath}`);
    
    rl.question('\nPress Enter to continue...', () => {
      showMainMenu();
    });
    return;
  }
  
  console.log(`\n=== Course ${currentCourse} ===`);
  
  rl.question(`Course ${currentCourse} name or ID: `, (courseId) => {
    contentMap.courses[courseId] = { lessons: {} };
    
    rl.question(`How many lessons in Course ${currentCourse}? `, (numLessonsStr) => {
      const numLessons = parseInt(numLessonsStr, 10);
      
      if (isNaN(numLessons) || numLessons <= 0) {
        console.log('Please enter a valid number.');
        return processNextCourse(currentCourse, totalCourses, contentMap);
      }
      
      processNextLesson(currentCourse, courseId, 1, numLessons, contentMap, () => {
        processNextCourse(currentCourse + 1, totalCourses, contentMap);
      });
    });
  });
}

// Process lesson information recursively
function processNextLesson(courseNum, courseId, currentLesson, totalLessons, contentMap, callback) {
  if (currentLesson > totalLessons) {
    // All lessons for this course processed
    callback();
    return;
  }
  
  console.log(`\n--- Course ${courseNum}, Lesson ${currentLesson} ---`);
  
  rl.question(`Lesson ${currentLesson} name or ID: `, (lessonId) => {
    rl.question('Dropbox URL for audio file: ', (audioUrl) => {
      rl.question('Dropbox URL for VTT file: ', (vttUrl) => {
        // Store in content map with formatted URLs
        contentMap.courses[courseId].lessons[lessonId] = {
          audio: formatDropboxUrl(audioUrl),
          vtt: formatDropboxUrl(vttUrl)
        };
        
        processNextLesson(courseNum, courseId, currentLesson + 1, totalLessons, contentMap, callback);
      });
    });
  });
}

// Format Dropbox URL for direct access
function formatDropboxUrl(url) {
  return url.trim()
    .replace('www.dropbox.com', 'dl.dropboxusercontent.com')
    .replace('?dl=0', '?raw=1');
}

// Start the process
showMainMenu();
