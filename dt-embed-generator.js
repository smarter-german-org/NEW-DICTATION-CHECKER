// Enhanced script to generate embedding code with Dropbox folder support
import readline from 'readline';
import fs from 'fs';
import path from 'path';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Define paths
const DROPBOX_PATH = '/Users/denkmuskel/Dropbox/NEW Dictation Tool';
const audioFolderBase = path.join(DROPBOX_PATH, 'DT-Audio Files');
const vttFolderBase = path.join(DROPBOX_PATH, 'DT-VTT Files');

// Define levels for organization
const LEVELS = ['A1', 'A2', 'B1', 'B2'];

console.log('\n=== Dictation Checker Embedding Code Generator ===\n');

// Function to format Dropbox URL
function formatDropboxUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    let formattedUrl = url.trim();
    
    // Replace www.dropbox.com with dl.dropboxusercontent.com
    formattedUrl = formattedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    
    // Replace dl=0 with raw=1
    formattedUrl = formattedUrl.replace('dl=0', 'raw=1');
    
    return formattedUrl;
  } catch (error) {
    console.error('Error formatting Dropbox URL:', error);
    return url;
  }
}

// Function to get Dropbox share link for a file
async function getDropboxShareLink(filePath) {
  try {
    console.log(`Getting share link for: ${filePath}`);
    
    // For now, we'll prompt the user to manually copy the link
    return new Promise((resolve) => {
      console.log('\nAction needed:');
      console.log(`1. Open Dropbox and locate: ${path.basename(filePath)}`);
      console.log('2. Right-click on the file and select "Copy Link"');
      console.log('3. Paste the link below\n');
      
      rl.question('Paste the Dropbox link here: ', (link) => {
        resolve(formatDropboxUrl(link));
      });
    });
  } catch (error) {
    console.error('Error getting Dropbox share link:', error);
    return null;
  }
}

// Function to list available audio folders
function listAvailableLevels() {
  console.log('\nAvailable course levels:');
  
  // Get the level folders
  let levelFolders = [];
  
  try {
    levelFolders = fs.readdirSync(audioFolderBase)
      .filter(item => fs.statSync(path.join(audioFolderBase, item)).isDirectory())
      .filter(folder => folder.includes('-A') || folder.includes('-B'))
      .map(folder => {
        const level = folder.replace('DT-', '').replace('-Audio', '');
        return { folder, level };
      });
  } catch (error) {
    console.error('Error reading audio folders:', error);
    return [];
  }
  
  levelFolders.forEach((item, index) => {
    console.log(`${index + 1}. ${item.level} (${item.folder})`);
  });
  
  return levelFolders;
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
    fs.writeFileSync(vttFilePath, vttContent);
    console.log(`VTT file created at: ${vttFilePath}`);
    return true;
  } catch (error) {
    console.error('Error converting text to VTT:', error);
    return false;
  }
}

// Main process
async function main() {
  // First, get the required main app files
  console.log('First, we need the Dropbox links for the main application files.\n');
  
  const embedHtmlPath = path.join(DROPBOX_PATH, 'embed.html');
  const integrationJsPath = path.join(DROPBOX_PATH, 'teachable-integration.js');
  
  console.log('Please provide the Dropbox links for your main application files.');
  
  // Get embed.html link
  const formattedEmbedUrl = await getDropboxShareLink(embedHtmlPath);
  console.log(`Formatted URL: ${formattedEmbedUrl}\n`);
  
  // Get teachable-integration.js link
  const formattedScriptUrl = await getDropboxShareLink(integrationJsPath);
  console.log(`Formatted URL: ${formattedScriptUrl}\n`);
  
  // Now handle the audio and VTT files
  console.log('Now, let\'s select an audio file and its corresponding VTT file.\n');
  
  // List available levels
  const levelFolders = listAvailableLevels();
  
  if (levelFolders.length === 0) {
    console.log('No level folders found. Please check your Dropbox structure.');
    rl.close();
    return;
  }
  
  rl.question('Select a level number: ', async (levelIndex) => {
    const selectedLevel = levelFolders[parseInt(levelIndex) - 1];
    
    if (!selectedLevel) {
      console.log('Invalid selection. Exiting...');
      rl.close();
      return;
    }
    
    console.log(`\nSelected level: ${selectedLevel.level}`);
    
    // List audio files in the selected level folder
    const audioFolder = path.join(audioFolderBase, selectedLevel.folder);
    const audioFiles = fs.readdirSync(audioFolder)
      .filter(file => file.endsWith('.mp3') && !file.startsWith('.'));
    
    if (audioFiles.length === 0) {
      console.log('No audio files found in this folder. Exiting...');
      rl.close();
      return;
    }
    
    console.log('\nAvailable audio files:');
    audioFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${file}`);
    });
    
    rl.question('Select an audio file number: ', async (audioIndex) => {
      const selectedAudioFile = audioFiles[parseInt(audioIndex) - 1];
      
      if (!selectedAudioFile) {
        console.log('Invalid selection. Exiting...');
        rl.close();
        return;
      }
      
      console.log(`\nSelected audio file: ${selectedAudioFile}`);
      
      // Extract lesson number from filename
      const lessonMatch = selectedAudioFile.match(/L(\d+)/i);
      let lessonNumber = lessonMatch ? lessonMatch[1].padStart(2, '0') : '01';
      
      // Define VTT file naming based on your preferred logical naming convention
      const vttFileName = `DT-${selectedLevel.level}L${lessonNumber}-VTT.vtt`;
      const vttFolderName = `DT-${selectedLevel.level}-VTT`;
      const vttFolder = path.join(vttFolderBase, vttFolderName);
      const vttFilePath = path.join(vttFolder, vttFileName);
      
      // Check if the VTT folder exists, create if not
      if (!fs.existsSync(vttFolder)) {
        fs.mkdirSync(vttFolder, { recursive: true });
        console.log(`Created VTT folder: ${vttFolder}`);
      }
      
      // Check if the VTT file exists
      let vttFileMissing = false;
      if (!fs.existsSync(vttFilePath)) {
        console.log(`\nWARNING: VTT file not found at ${vttFilePath}`);
        console.log('You will need to manually provide a VTT file path or create one.');
        vttFileMissing = true;
      } else {
        console.log(`\nFound corresponding VTT file: ${vttFileName}`);
      }
      
      // Get the audio file link
      const audioFilePath = path.join(audioFolder, selectedAudioFile);
      const formattedAudioUrl = await getDropboxShareLink(audioFilePath);
      console.log(`Formatted audio URL: ${formattedAudioUrl}\n`);
      
      // Handle VTT file
      if (vttFileMissing) {
        console.log('\nSince the VTT file is missing, you can either:');
        console.log('1. Create it from a text file');
        console.log('2. Provide a link to an existing VTT file');
        console.log('3. Use the sample VTT for testing purposes\n');
        
        rl.question('Choose an option (1/2/3): ', async (option) => {
          let formattedVttUrl = '';
          
          if (option === '1') {
            console.log('\nCreate VTT from text file:');
            rl.question('Enter the path to the text file: ', async (txtFilePath) => {
              if (fs.existsSync(txtFilePath)) {
                if (convertTextToVTT(txtFilePath, vttFilePath)) {
                  console.log('VTT file created successfully.');
                  
                  // Now get the Dropbox link for the newly created VTT file
                  formattedVttUrl = await getDropboxShareLink(vttFilePath);
                  generateFinalCode(selectedLevel.level, lessonNumber, formattedEmbedUrl, 
                                   formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
                } else {
                  console.log('Failed to create VTT file. Using sample VTT for testing.');
                  formattedVttUrl = await getDropboxShareLink(path.join(DROPBOX_PATH, 'chap01.vtt'));
                  generateFinalCode(selectedLevel.level, lessonNumber, formattedEmbedUrl, 
                                   formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
                }
              } else {
                console.log('Text file not found. Using sample VTT for testing.');
                formattedVttUrl = await getDropboxShareLink(path.join(DROPBOX_PATH, 'chap01.vtt'));
                generateFinalCode(selectedLevel.level, lessonNumber, formattedEmbedUrl, 
                                 formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
              }
            });
          } else if (option === '2') {
            rl.question('Paste the Dropbox link to an existing VTT file: ', (vttUrl) => {
              formattedVttUrl = formatDropboxUrl(vttUrl);
              generateFinalCode(selectedLevel.level, lessonNumber, formattedEmbedUrl, 
                              formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
            });
          } else {
            console.log('Using sample VTT for testing.');
            formattedVttUrl = await getDropboxShareLink(path.join(DROPBOX_PATH, 'chap01.vtt'));
            generateFinalCode(selectedLevel.level, lessonNumber, formattedEmbedUrl, 
                            formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
          }
        });
      } else {
        const formattedVttUrl = await getDropboxShareLink(vttFilePath);
        console.log(`Formatted VTT URL: ${formattedVttUrl}\n`);
        generateFinalCode(selectedLevel.level, lessonNumber, formattedEmbedUrl, 
                         formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
      }
    });
  });
}

// Function to generate the final embedding code
function generateFinalCode(level, lessonNumber, embedUrl, scriptUrl, audioUrl, vttUrl) {
  const courseId = level; // e.g., A1, A2, etc.
  const lessonId = `L${lessonNumber}`; // e.g., L01, L02, etc.
  
  console.log('\n=== Generated Embedding Code ===\n');
  
  const code = `<div class="dictation-app-container" 
     data-course-id="${courseId}" 
     data-lesson-id="${lessonId}" 
     data-audio-url="${audioUrl}"
     data-vtt-url="${vttUrl}">
</div>
<script src="${scriptUrl}"></script>`;
  
  console.log(code);
  console.log('\n=== End of Code ===\n');
  
  console.log('Instructions:');
  console.log('1. Copy the code above');
  console.log('2. In Teachable, open the HTML editor for your lesson');
  console.log('3. Paste the code into the editor');
  console.log('4. Save the changes');
  console.log('5. Preview the lesson to ensure it works correctly\n');
  
  // Create a log entry for future reference
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      lessonId,
      audioUrl,
      vttUrl,
      scriptUrl
    };
    
    // Check if the logs folder exists, create if not
    const logsFolder = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsFolder)) {
      fs.mkdirSync(logsFolder);
    }
    
    // Append to a log file
    const logFile = path.join(logsFolder, 'teachable-embeds.json');
    let logs = [];
    
    if (fs.existsSync(logFile)) {
      const fileContent = fs.readFileSync(logFile, 'utf8');
      try {
        logs = JSON.parse(fileContent);
      } catch (e) {
        console.log('Note: Could not parse existing log file, creating a new one.');
      }
    }
    
    logs.push(logEntry);
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf8');
    console.log('Link information saved to logs/teachable-embeds.json\n');
  } catch (error) {
    console.log('Note: Could not save log entry:', error.message);
  }
  
  rl.close();
}

// Start the script
main();
