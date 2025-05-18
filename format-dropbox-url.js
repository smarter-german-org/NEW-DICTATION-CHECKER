#!/usr/bin/env node
/**
 * Simple Dropbox URL Formatter
 * 
 * This utility helps you quickly convert Dropbox share links to direct download links.
 * 
 * Usage: node format-dropbox-url.js [url]
 */

// Check if URL is provided as command line argument
const urlArg = process.argv[2];

if (urlArg) {
  // Format URL provided as argument
  const formattedUrl = formatDropboxUrl(urlArg);
  console.log('\nFormatted URL:');
  console.log(formattedUrl);
} else {
  // Interactive mode
  console.log('\n=== Dropbox URL Formatter ===\n');
  console.log('This tool converts Dropbox share links to direct download links.\n');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('Paste your Dropbox URL: ', (url) => {
    const formattedUrl = formatDropboxUrl(url);
    console.log('\nConverted URL:');
    console.log(formattedUrl);
    rl.close();
  });
}

/**
 * Formats a Dropbox URL for direct access using simple string replacements
 * 
 * @param {string} url - The Dropbox share URL
 * @returns {string} - The formatted direct download URL
 */
function formatDropboxUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  try {
    // Start with a trimmed version of the URL
    let formattedUrl = url.trim();
    
    // Simple method: change domain and parameters with string replacement
    formattedUrl = formattedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    
    // Remove any state token parameter
    formattedUrl = formattedUrl.replace(/[?&]st=[^&]+/, '');
    
    // Replace dl=0 with raw=1 if it exists
    if (formattedUrl.includes('dl=0')) {
      formattedUrl = formattedUrl.replace('dl=0', 'raw=1');
    }
    // Otherwise add the raw=1 parameter
    else if (!formattedUrl.includes('raw=1')) {
      if (formattedUrl.includes('?')) {
        formattedUrl += '&raw=1';
      } else {
        formattedUrl += '?raw=1';
      }
    }
    
    return formattedUrl;
  } catch (error) {
    console.error('Error formatting Dropbox URL:', error);
    return url;
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { formatDropboxUrl };
}

// Export for use in other scripts
if (typeof module !== 'undefined') {
  module.exports = { formatDropboxUrl };
}
