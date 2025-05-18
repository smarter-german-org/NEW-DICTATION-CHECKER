#!/usr/bin/env node
// batch-vtt-generator.js - Tool to batch create VTT files for all audio files

import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Define paths
const DROPBOX_PATH = '/Users/denkmuskel/Dropbox/NEW Dictation Tool';
const audioFolderBase = path.join(DROPBOX_PATH, 'DT-Audio Files');
const vttFolderBase = path.join(DROPBOX_PATH, 'DT-VTT Files');
const textFolderBase = path.join(DROPBOX_PATH, 'DT-Text Files'); // Folder with source text files if available

// Create VTT folder structure if it doesn't exist
if (!fs.existsSync(vttFolderBase)) {
  fs.mkdirSync(vttFolderBase, { recursive: true });
  console.log(`Created VTT base folder: ${vttFolderBase}`);
}

// Define levels for organization
const LEVELS = ['A1', 'A2', 'B1', 'B2'];

// Function to create a simple VTT file if no text source is available
function createSimpleVTT(vttFilePath, lessonId, level) {
  const vttContent = `WEBVTT

00:00:00.000 --> 00:00:05.000
This is a placeholder for ${level} lesson ${lessonId}.

00:00:05.000 --> 00:00:10.000
Please replace this VTT file with the actual transcript.

00:00:10.000 --> 00:00:15.000
Each line should represent a complete sentence from the audio.`;

  fs.writeFileSync(vttFilePath, vttContent, 'utf8');
  console.log(`Created simple VTT template at: ${vttFilePath}`);
  return true;
}

// Function to convert text file to VTT format
function convertTextToVTT(textFilePath, vttFilePath) {
  try {
    // Read the text file
    const textContent = fs.readFileSync(textFilePath, 'utf8');
    
    // Create VTT content
    let vttContent = "WEBVTT\n\n";
    
    // Split text into sentences or paragraphs (adjust as needed)
    const lines = textContent.split(/\n+/).filter(line => line.trim().length > 0);
    
    // Create timed captions with simple timing logic
    lines.forEach((line, index) => {
      const startTime = index * 5; // Start 5 seconds after previous line
      const endTime = startTime + 5; // Each line gets 5 seconds
      
      // Format time as mm:ss.000
      const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
      };
      
      // Add the caption
      vttContent += `${formatTime(startTime)} --> ${formatTime(endTime)}\n${line.trim()}\n\n`;
    });
    
    // Write the VTT file
    fs.writeFileSync(vttFilePath, vttContent, 'utf8');
    console.log(`VTT file created at: ${vttFilePath}`);
    return true;
  } catch (error) {
    console.error(`Error converting text to VTT: ${error.message}`);
    return false;
  }
}

// Process each level folder
async function processLevelFolder(level) {
  console.log(`\n=== Processing Level ${level} ===`);
  
  // Define folder paths
  const audioLevelFolder = path.join(audioFolderBase, `DT-${level}-Audio`);
  const vttLevelFolder = path.join(vttFolderBase, `DT-${level}-VTT`);
  const textLevelFolder = path.join(textFolderBase, `DT-${level}-Text`);
  
  // Check if audio level folder exists
  if (!fs.existsSync(audioLevelFolder)) {
    console.log(`Audio folder not found: ${audioLevelFolder}`);
    return;
  }
  
  // Create VTT level folder if it doesn't exist
  if (!fs.existsSync(vttLevelFolder)) {
    fs.mkdirSync(vttLevelFolder, { recursive: true });
    console.log(`Created VTT level folder: ${vttLevelFolder}`);
  }
  
  // Get all audio files in the folder
  const audioFiles = fs.readdirSync(audioLevelFolder)
    .filter(file => file.endsWith('.mp3') && !file.startsWith('.'));
  
  console.log(`Found ${audioFiles.length} audio files in ${level}`);
  
  // Process each audio file
  for (const audioFile of audioFiles) {
    // Extract lesson number from filename
    const lessonMatch = audioFile.match(/L(\d+)/i);
    let lessonNumber = lessonMatch ? lessonMatch[1].padStart(2, '0') : '00';
    const lessonId = `L${lessonNumber}`;
    
    // Define VTT filename
    const vttFileName = `DT-${level}${lessonId}-VTT.vtt`;
    const vttFilePath = path.join(vttLevelFolder, vttFileName);
    
    // Check if VTT file already exists
    if (fs.existsSync(vttFilePath)) {
      console.log(`VTT file already exists: ${vttFileName}`);
      continue;
    }
    
    // Try to find a corresponding text file
    const textBaseName = `${level}${lessonId}`; // e.g., A1L01
    const possibleTextFiles = [
      path.join(textLevelFolder, `DT-${textBaseName}-Text.txt`),
      path.join(textLevelFolder, `${textBaseName}.txt`),
      path.join(textLevelFolder, `${level.toLowerCase()}${lessonId.toLowerCase()}.txt`),
      path.join(textLevelFolder, `${audioFile.replace('.mp3', '.txt')}`)
    ];
    
    let foundTextFile = null;
    for (const textFile of possibleTextFiles) {
      if (fs.existsSync(textFile)) {
        foundTextFile = textFile;
        break;
      }
    }
    
    if (foundTextFile) {
      console.log(`Found text file for ${level}${lessonId}: ${path.basename(foundTextFile)}`);
      if (convertTextToVTT(foundTextFile, vttFilePath)) {
        console.log(`Successfully converted text to VTT for ${level}${lessonId}`);
      } else {
        console.log(`Failed to convert text for ${level}${lessonId}, creating simple template`);
        createSimpleVTT(vttFilePath, lessonId, level);
      }
    } else {
      console.log(`No text file found for ${level}${lessonId}, creating simple template`);
      createSimpleVTT(vttFilePath, lessonId, level);
    }
  }
}

// Main function
async function main() {
  console.log('=== VTT Batch Generator ===');
  console.log('This script will create VTT files for all audio files in the Dropbox folder.');
  
  // Process each level
  for (const level of LEVELS) {
    await processLevelFolder(level);
  }
  
  console.log('\n=== VTT Generation Complete ===');
  console.log(`VTT files have been generated in: ${vttFolderBase}`);
  console.log('Please review the generated VTT files and make any necessary adjustments.');
}

// Run the script
main().catch(error => {
  console.error('Error running VTT batch generator:', error);
});
