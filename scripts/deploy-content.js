const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration - Updated with your specific domains
const WORDPRESS_SERVER = 'user@smartergerman.com'; // Update with your WordPress SSH login
const REMOTE_PATH = '/path/to/wp-content/uploads/dictation-app'; // Update with your WordPress file path
const CONTENT_DIR = path.join(__dirname, '../content');

// Function to deploy files using rsync
async function deployContent() {
  console.log('Starting content deployment...');
  
  // Ensure the remote directory exists
  exec(`ssh ${WORDPRESS_SERVER} "mkdir -p ${REMOTE_PATH}"`, (error) => {
    if (error) {
      console.error('Error creating remote directory:', error);
      return;
    }
    
    // Deploy content using rsync
    const rsyncCommand = `rsync -avz --progress ${CONTENT_DIR}/ ${WORDPRESS_SERVER}:${REMOTE_PATH}/`;
    
    console.log(`Executing: ${rsyncCommand}`);
    const rsync = exec(rsyncCommand);
    
    rsync.stdout.on('data', (data) => {
      console.log(data.toString().trim());
    });
    
    rsync.stderr.on('data', (data) => {
      console.error(data.toString().trim());
    });
    
    rsync.on('close', (code) => {
      if (code === 0) {
        console.log('Content deployment completed successfully!');
        console.log(`Files available at: https://smartergerman.com/wp-content/uploads/dictation-app/`);
      } else {
        console.error(`Deployment failed with exit code ${code}`);
      }
    });
  });
}

deployContent();