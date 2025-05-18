#!/usr/bin/env node

/**
 * Simple Dropbox URL Formatter
 * 
 * This script formats a Dropbox URL for direct access.
 * It converts a standard Dropbox share link to a direct download link.
 * 
 * Usage: 
 * 1. Run: node format-dropbox-url.cjs "https://www.dropbox.com/your-link"
 * 2. Or run without arguments to paste the URL when prompted
 */

const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Format Dropbox URL
function formatDropboxUrl(url) {
  // Basic cleanup
  let formattedUrl = url.trim();
  
  // Replace domain
  formattedUrl = formattedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  
  // Fix query parameters
  if (formattedUrl.includes('?')) {
    // Extract base URL and parameters
    const [baseUrl, params] = formattedUrl.split('?');
    
    // Parse parameters
    const paramPairs = params.split('&');
    const paramMap = {};
    
    paramPairs.forEach(pair => {
      const [key, value] = pair.split('=');
      paramMap[key] = value;
    });
    
    // Remove dl=0 and add raw=1
    delete paramMap.dl;
    paramMap.raw = '1';
    
    // Keep important parameters like rlkey
    const newParams = Object.entries(paramMap)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    // Reconstruct URL
    formattedUrl = `${baseUrl}?${newParams}`;
  } else {
    // If no parameters, just add raw=1
    formattedUrl += '?raw=1';
  }
  
  return formattedUrl;
}

// If URL is provided as command-line argument
if (process.argv.length > 2) {
  const url = process.argv[2];
  const formattedUrl = formatDropboxUrl(url);
  console.log('\nOriginal URL:');
  console.log(url);
  console.log('\nFormatted URL for direct access:');
  console.log(formattedUrl);
  process.exit(0);
} else {
  // Otherwise prompt for URL
  rl.question('\nEnter Dropbox URL: ', (url) => {
    const formattedUrl = formatDropboxUrl(url);
    console.log('\nFormatted URL for direct access:');
    console.log(formattedUrl);
    rl.close();
  });
}
