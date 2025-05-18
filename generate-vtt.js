#!/usr/bin/env node
/**
 * VTT Generator for Dictation App
 * 
 * This utility helps you create VTT files for your audio files.
 * You'll need to provide the script text for each audio file.
 * 
 * Usage: node generate-vtt.js
 */

import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n=== VTT Generator for Dictation App ===\n');

// Main function
function start() {
  console.log('This utility will help you create VTT files for your dictation audio.');
  console.log('You\'ll need to provide:');
  console.log('1. The path to your audio file');
  console.log('2. The text of the audio (the script)');
  console.log('3. Optional timing information\n');
  
  promptForAudioFile();
}

// Prompt for audio file
function promptForAudioFile() {
  rl.question('Path to audio file (MP3): ', (audioPath) => {
    if (!fs.existsSync(audioPath)) {
      console.log('\nAudio file not found. Please check the path and try again.');
      return promptForAudioFile();
    }
    
    // Generate output file path based on audio path
    const outputPath = audioPath.replace(/\.[^.]+$/, '.vtt');
    
    console.log('\nPlease enter the script text for this audio file.');
    console.log('Type or paste the full text, then press Enter twice to finish.');
    console.log('Each paragraph will be treated as a separate sentence.\n');
    
    let text = '';
    let emptyLines = 0;
    
    rl.prompt();
    
    rl.on('line', (line) => {
      if (line.trim() === '') {
        emptyLines++;
        if (emptyLines >= 2) {
          // Double empty line indicates the end of input
          rl.removeAllListeners('line');
          processScriptText(text, audioPath, outputPath);
        }
      } else {
        emptyLines = 0;
        text += line + '\n';
      }
    });
  });
}

// Process script text
function processScriptText(text, audioPath, outputPath) {
  console.log('\nText received! Processing...');
  
  // Split into sentences (paragraphs)
  const sentences = text.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  console.log(`\nDetected ${sentences.length} sentences.`);
  
  rl.question('\nDo you want to specify timing information? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      promptForTimingInfo(sentences, outputPath);
    } else {
      generateSimpleVtt(sentences, outputPath);
    }
  });
}

// Generate a simple VTT with auto-generated timing
function generateSimpleVtt(sentences, outputPath) {
  console.log('\nGenerating VTT with automatic timing...');
  
  // Simple timing: Assume each sentence takes about 5 seconds
  let currentTime = 0;
  const averageSentenceDuration = 5; // seconds
  
  let vttContent = 'WEBVTT\n\n';
  
  sentences.forEach((sentence, index) => {
    const startTime = formatVttTime(currentTime);
    currentTime += averageSentenceDuration;
    const endTime = formatVttTime(currentTime);
    
    vttContent += `${index + 1}\n`;
    vttContent += `${startTime} --> ${endTime}\n`;
    vttContent += `${sentence}\n\n`;
  });
  
  saveVttFile(vttContent, outputPath);
}

// Prompt user for timing information
function promptForTimingInfo(sentences, outputPath) {
  console.log('\nYou can now enter the timing for each sentence.');
  console.log('Format: mm:ss (e.g., 01:23 for 1 minute and 23 seconds)');
  
  const timings = [];
  
  promptForNextSentenceTiming(sentences, timings, 0, outputPath);
}

// Recursively prompt for timing of each sentence
function promptForNextSentenceTiming(sentences, timings, index, outputPath) {
  if (index >= sentences.length) {
    generateTimedVtt(sentences, timings, outputPath);
    return;
  }
  
  console.log(`\nSentence ${index + 1}/${sentences.length}:`);
  console.log(`"${sentences[index]}"`);
  
  rl.question(`Start time (mm:ss): `, (startTimeStr) => {
    rl.question(`End time (mm:ss): `, (endTimeStr) => {
      timings.push({
        start: parseTimeString(startTimeStr),
        end: parseTimeString(endTimeStr)
      });
      
      promptForNextSentenceTiming(sentences, timings, index + 1, outputPath);
    });
  });
}

// Generate VTT with user-specified timing
function generateTimedVtt(sentences, timings, outputPath) {
  console.log('\nGenerating VTT with your specified timing...');
  
  let vttContent = 'WEBVTT\n\n';
  
  sentences.forEach((sentence, index) => {
    const timing = timings[index];
    const startTime = formatVttTime(timing.start);
    const endTime = formatVttTime(timing.end);
    
    vttContent += `${index + 1}\n`;
    vttContent += `${startTime} --> ${endTime}\n`;
    vttContent += `${sentence}\n\n`;
  });
  
  saveVttFile(vttContent, outputPath);
}

// Save the VTT content to a file
function saveVttFile(vttContent, outputPath) {
  fs.writeFile(outputPath, vttContent, (err) => {
    if (err) {
      console.error('Error saving VTT file:', err);
    } else {
      console.log(`\nVTT file successfully created: ${outputPath}`);
    }
    
    rl.question('\nDo you want to create another VTT file? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        promptForAudioFile();
      } else {
        rl.close();
        console.log('\nThank you for using the VTT Generator!\n');
      }
    });
  });
}

// Parse time string in mm:ss format to seconds
function parseTimeString(timeStr) {
  const parts = timeStr.trim().split(':');
  
  if (parts.length !== 2) {
    return 0;
  }
  
  const minutes = parseInt(parts[0], 10);
  const seconds = parseInt(parts[1], 10);
  
  return (minutes * 60) + seconds;
}

// Format time in seconds to VTT format (HH:MM:SS.mmm)
function formatVttTime(timeInSeconds) {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
  
  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}.${padZero(milliseconds, 3)}`;
}

// Pad numbers with leading zeros
function padZero(num, length = 2) {
  return num.toString().padStart(length, '0');
}

// Start the application
start();
