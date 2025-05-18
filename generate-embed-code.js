// Enhanced script to generate embedding code with Dropbox folder support
import readline from 'readline';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);
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
    // Use osascript to trigger the "Copy Link" action via AppleScript
    // This is a simplified approach - a more robust method would use the Dropbox API
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

// Function to list available audio files
function listAvailableAudioFiles() {
  console.log('\nAvailable course levels:');
  
  // Get the level folders
  const levelFolders = fs.readdirSync(audioFolderBase)
    .filter(item => item.startsWith('DT-') && item.endsWith('-Audio'))
    .map(folder => {
      const level = folder.replace('DT-', '').replace('-Audio', '');
      return { folder, level };
    });
  
  levelFolders.forEach((item, index) => {
    console.log(`${index + 1}. ${item.level} (${item.folder})`);
  });
  
  return levelFolders;
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
  const levelFolders = listAvailableAudioFiles();
  
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
      
      // Determine the corresponding VTT file name (same base name, different extension)
      const vttFileName = selectedAudioFile.replace('.mp3', '.vtt');
      const vttFolder = path.join(vttFolderBase, selectedLevel.folder.replace('Audio', 'VTT'));
      const vttFilePath = path.join(vttFolder, vttFileName);
      
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
      
      // Get or create the VTT file link
      let formattedVttUrl;
      if (vttFileMissing) {
        console.log('\nSince the VTT file is missing, you can either:');
        console.log('1. Create it now in the appropriate folder');
        console.log('2. Provide a link to an existing VTT file');
        console.log('3. We can use a sample VTT for testing purposes\n');
        
        rl.question('Choose an option (1/2/3): ', async (option) => {
          if (option === '1') {
            console.log('\nCreate the VTT file at the path shown above, then continue.');
            rl.question('Press ENTER when done to get the link: ', async () => {
              if (fs.existsSync(vttFilePath)) {
                formattedVttUrl = await getDropboxShareLink(vttFilePath);
              } else {
                console.log('VTT file still not found. Using sample VTT for testing.');
                formattedVttUrl = await getDropboxShareLink(path.join(DROPBOX_PATH, 'chap01.vtt'));
              }
              generateFinalCode(selectedLevel.level, selectedAudioFile, formattedEmbedUrl, formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
            });
          } else if (option === '2') {
            rl.question('Paste the Dropbox link to an existing VTT file: ', (vttUrl) => {
              formattedVttUrl = formatDropboxUrl(vttUrl);
              generateFinalCode(selectedLevel.level, selectedAudioFile, formattedEmbedUrl, formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
            });
          } else {
            console.log('Using sample VTT for testing.');
            formattedVttUrl = await getDropboxShareLink(path.join(DROPBOX_PATH, 'chap01.vtt'));
            generateFinalCode(selectedLevel.level, selectedAudioFile, formattedEmbedUrl, formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
          }
        });
      } else {
        formattedVttUrl = await getDropboxShareLink(vttFilePath);
        console.log(`Formatted VTT URL: ${formattedVttUrl}\n`);
        generateFinalCode(selectedLevel.level, selectedAudioFile, formattedEmbedUrl, formattedScriptUrl, formattedAudioUrl, formattedVttUrl);
      }
    });
  });
}

// Function to generate the final embedding code
function generateFinalCode(level, audioFileName, embedUrl, scriptUrl, audioUrl, vttUrl) {
  // Extract a lesson number from the filename if possible
  let lessonId = 'L01'; // Default
  const lessonMatch = audioFileName.match(/L(\d+)/i);
  if (lessonMatch) {
    lessonId = `L${lessonMatch[1].padStart(2, '0')}`;
  }
  
  rl.question(`Enter the lesson ID (default: ${lessonId}): `, (customLessonId) => {
    const finalLessonId = customLessonId || lessonId;
    
    console.log('\n=== Generated Embedding Code ===\n');
    
    const code = `<div class="dictation-app-container" 
     data-course-id="${level}" 
     data-lesson-id="${finalLessonId}" 
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
        lessonId: finalLessonId,
        audioFile: audioFileName,
        embedUrl,
        scriptUrl,
        audioUrl,
        vttUrl
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
  });
}

// Start the script
main();
            
            const code = `<div class="dictation-app-container" 
     data-course-id="${courseId}" 
     data-lesson-id="${lessonId}" 
     data-audio-url="${formattedAudioUrl}"
     data-vtt-url="${formattedVttUrl}">
</div>
<script src="${formattedScriptUrl}"></script>`;
            
            console.log(code);
            console.log('\n=== End of Code ===\n');
            
            console.log('Instructions:');
            console.log('1. Copy the code above');
            console.log('2. In Teachable, open the HTML editor for your lesson');
            console.log('3. Paste the code into the editor');
            console.log('4. Save the changes');
            console.log('5. Preview the lesson to ensure it works correctly\n');
            
            rl.close();
          });
        });
      });
    });
  });
});
