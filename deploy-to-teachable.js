#!/usr/bin/env node
// deploy-to-teachable.js - Comprehensive deployment script for Teachable integration

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  projectRoot: process.cwd(),
  dropboxPath: '/Users/denkmuskel/Dropbox/NEW Dictation Tool',
  levels: ['A1', 'A2', 'B1', 'B2'],
  outputLog: path.join(process.cwd(), 'logs', 'deployment.json'),
  files: {
    toDeploy: [
      { src: 'public/embed.html', dest: 'embed.html' },
      { src: 'public/teachable-integration.js', dest: 'teachable-integration.js' },
      { src: 'public/mobile-detection.js', dest: 'mobile-detection.js' },
    ]
  }
};

// Ensure log directory exists
if (!fs.existsSync(path.dirname(config.outputLog))) {
  fs.mkdirSync(path.dirname(config.outputLog), { recursive: true });
}

// Main execution
function main() {
  console.log('=== Teachable Deployment Script ===');
  console.log(`Date: ${new Date().toLocaleString()}\n`);
  
  // 1. Check Dropbox folder structure
  checkDropboxFolders();
  
  // 2. Deploy core files
  deployFiles();
  
  // 3. Generate VTT files if needed
  ensureVttFilesExist();
  
  // 4. Print deployment summary
  printSummary();
  
  // 5. Open the GUI tool
  openGuiTool();
}

// Check Dropbox folder structure
function checkDropboxFolders() {
  console.log('Checking Dropbox folder structure...');
  
  // Check main Dropbox project folder
  if (!fs.existsSync(config.dropboxPath)) {
    console.error(`Dropbox folder not found: ${config.dropboxPath}`);
    process.exit(1);
  }
  
  // Check and create audio folders
  const audioBasePath = path.join(config.dropboxPath, 'DT-Audio Files');
  if (!fs.existsSync(audioBasePath)) {
    fs.mkdirSync(audioBasePath, { recursive: true });
    console.log(`Created audio base folder: ${audioBasePath}`);
  }
  
  // Check and create VTT folders
  const vttBasePath = path.join(config.dropboxPath, 'DT-VTT Files');
  if (!fs.existsSync(vttBasePath)) {
    fs.mkdirSync(vttBasePath, { recursive: true });
    console.log(`Created VTT base folder: ${vttBasePath}`);
  }
  
  // Create level folders
  config.levels.forEach(level => {
    const audioLevelPath = path.join(audioBasePath, `DT-${level}-Audio`);
    const vttLevelPath = path.join(vttBasePath, `DT-${level}-VTT`);
    
    if (!fs.existsSync(audioLevelPath)) {
      fs.mkdirSync(audioLevelPath, { recursive: true });
      console.log(`Created audio level folder: ${audioLevelPath}`);
    }
    
    if (!fs.existsSync(vttLevelPath)) {
      fs.mkdirSync(vttLevelPath, { recursive: true });
      console.log(`Created VTT level folder: ${vttLevelPath}`);
    }
  });
  
  console.log('Folder structure check complete.\n');
}

// Deploy files to Dropbox
function deployFiles() {
  console.log('Deploying files to Dropbox...');
  
  config.files.toDeploy.forEach(file => {
    const srcPath = path.join(config.projectRoot, file.src);
    const destPath = path.join(config.dropboxPath, file.dest);
    
    if (!fs.existsSync(srcPath)) {
      console.error(`Source file not found: ${srcPath}`);
      return;
    }
    
    try {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Deployed: ${file.src} -> ${file.dest}`);
    } catch (error) {
      console.error(`Failed to copy ${file.src} to ${file.dest}: ${error.message}`);
    }
  });
  
  console.log('File deployment complete.\n');
}

// Ensure VTT files exist for all audio files
function ensureVttFilesExist() {
  console.log('Checking VTT files...');
  
  // Run the batch VTT generator script
  try {
    console.log('Running batch VTT generator...');
    execSync('node batch-vtt-generator.js', { stdio: 'inherit' });
    console.log('VTT generation complete.\n');
  } catch (error) {
    console.error(`Failed to run VTT generator: ${error.message}`);
    console.log('Please run the batch-vtt-generator.js script manually.\n');
  }
}

// Print summary of deployment
function printSummary() {
  console.log('=== Deployment Summary ===');
  
  // Count audio and VTT files by level
  const summary = {};
  
  config.levels.forEach(level => {
    const audioLevelPath = path.join(config.dropboxPath, 'DT-Audio Files', `DT-${level}-Audio`);
    const vttLevelPath = path.join(config.dropboxPath, 'DT-VTT Files', `DT-${level}-VTT`);
    
    let audioCount = 0;
    let vttCount = 0;
    
    try {
      if (fs.existsSync(audioLevelPath)) {
        audioCount = fs.readdirSync(audioLevelPath)
          .filter(file => file.endsWith('.mp3') && !file.startsWith('.')).length;
      }
      
      if (fs.existsSync(vttLevelPath)) {
        vttCount = fs.readdirSync(vttLevelPath)
          .filter(file => file.endsWith('.vtt') && !file.startsWith('.')).length;
      }
    } catch (error) {
      console.error(`Error counting files for level ${level}: ${error.message}`);
    }
    
    summary[level] = {
      audioCount,
      vttCount,
      complete: audioCount === vttCount,
      missingVtt: audioCount - vttCount
    };
    
    console.log(`Level ${level}: ${audioCount} audio files, ${vttCount} VTT files (${summary[level].missingVtt} missing)`);
  });
  
  // Save summary to log file
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      summary,
      deployedFiles: config.files.toDeploy.map(file => file.dest)
    };
    
    fs.writeFileSync(config.outputLog, JSON.stringify(logEntry, null, 2), 'utf8');
    console.log(`\nDeployment log written to: ${config.outputLog}`);
  } catch (error) {
    console.error(`Failed to write log: ${error.message}`);
  }
  
  console.log('\nDeployment complete!');
}

// Open the GUI tool
function openGuiTool() {
  console.log('\nOpening the Teachable Embed Generator GUI...');
  
  try {
    // This uses 'open' command on macOS - adjust for other platforms
    execSync('open teachable-embed-gui.html');
  } catch (error) {
    console.log('Failed to automatically open the GUI tool.');
    console.log('Please open teachable-embed-gui.html manually in your browser.');
  }
  
  console.log('\nNext steps:');
  console.log('1. Use the GUI tool to generate embedding codes for each lesson');
  console.log('2. Paste the generated codes into your Teachable lessons');
  console.log('3. Test the embedded dictation checker in your Teachable environment');
}

// Run the main function
main();
