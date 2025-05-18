#!/usr/bin/env node
// dropbox-scanner.js - Scans Dropbox folders and generates JSON metadata for the GUI tool

const fs = require('fs');
const path = require('path');

// Define paths
const DROPBOX_PATH = '/Users/denkmuskel/Dropbox/NEW Dictation Tool';
const audioFolderBase = path.join(DROPBOX_PATH, 'DT-Audio Files');
const vttFolderBase = path.join(DROPBOX_PATH, 'DT-VTT Files');
const OUTPUT_FILE = path.join(__dirname, 'public/lesson-metadata.json');

// Make sure output directory exists
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}

// Define levels for organization
const LEVELS = ['A1', 'A2', 'B1', 'B2'];

function scanLevelFolder(level) {
  console.log(`Scanning level ${level}...`);
  const result = {
    level: level,
    lessons: []
  };

  // Define folder paths
  const audioLevelFolder = path.join(audioFolderBase, `DT-${level}-Audio`);
  const vttLevelFolder = path.join(vttFolderBase, `DT-${level}-VTT`);
  
  // Check if folders exist
  if (!fs.existsSync(audioLevelFolder)) {
    console.log(`Warning: Audio folder not found for level ${level}: ${audioLevelFolder}`);
    return result;
  }

  // Create VTT folder if it doesn't exist
  if (!fs.existsSync(vttLevelFolder)) {
    fs.mkdirSync(vttLevelFolder, { recursive: true });
    console.log(`Created VTT level folder: ${vttLevelFolder}`);
  }
  
  // Get all audio files in the folder
  const audioFiles = fs.readdirSync(audioLevelFolder)
    .filter(file => file.endsWith('.mp3') && !file.startsWith('.'));
  
  console.log(`Found ${audioFiles.length} audio files for level ${level}`);
  
  // Process each audio file
  for (const audioFile of audioFiles) {
    // Extract lesson number from filename
    const lessonMatch = audioFile.match(/L(\d+)/i);
    const lessonNumber = lessonMatch ? lessonMatch[1].padStart(2, '0') : '00';
    const lessonId = `L${lessonNumber}`;
    
    // Define file paths
    const audioFilePath = path.join(audioLevelFolder, audioFile);
    const vttFileName = `DT-${level}${lessonId}-VTT.vtt`;
    const vttFilePath = path.join(vttLevelFolder, vttFileName);
    
    // Check if VTT file exists
    const vttFileExists = fs.existsSync(vttFilePath);
    
    // Collect metadata
    result.lessons.push({
      lessonId: lessonId,
      lessonNumber: parseInt(lessonNumber),
      audioFile: audioFile,
      audioPath: audioFilePath,
      vttFile: vttFileName,
      vttPath: vttFilePath,
      vttExists: vttFileExists,
      audioUrl: convertToDropboxUrl(audioFilePath),
      vttUrl: vttFileExists ? convertToDropboxUrl(vttFilePath) : ""
    });
  }
  
  // Sort by lesson number
  result.lessons.sort((a, b) => a.lessonNumber - b.lessonNumber);
  
  return result;
}

// Function to convert local path to Dropbox URL
function convertToDropboxUrl(localPath) {
  // This is a stub function - in a real implementation you'd have to calculate
  // the actual Dropbox URL based on the folder structure and file path
  return `https://dl.dropboxusercontent.com/.../${path.basename(localPath)}?raw=1`;
}

// Main function
function main() {
  console.log('=== Dropbox Folder Scanner ===');
  console.log(`Scanning folders in: ${DROPBOX_PATH}`);
  
  const metadata = {
    timestamp: new Date().toISOString(),
    levels: []
  };
  
  // Process each level
  for (const level of LEVELS) {
    const levelData = scanLevelFolder(level);
    metadata.levels.push(levelData);
  }
  
  // Write metadata to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`\nMetadata written to: ${OUTPUT_FILE}`);
  console.log('This file can be used by the GUI tool for faster lookup of course materials.');
  
  // Print summary
  console.log('\n=== Summary ===');
  metadata.levels.forEach(level => {
    console.log(`${level.level}: ${level.lessons.length} lessons found`);
    console.log(`   VTT files: ${level.lessons.filter(l => l.vttExists).length} available, ${level.lessons.filter(l => !l.vttExists).length} missing`);
  });
}

// Run the script
try {
  main();
} catch (error) {
  console.error('Error running Dropbox scanner:', error);
}
