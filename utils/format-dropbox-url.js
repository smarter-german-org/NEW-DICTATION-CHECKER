/**
 * Simple utility to convert standard Dropbox links to direct download links
 * 
 * Usage:
 * 1. Copy your Dropbox share link
 * 2. Run this function with the link
 * 3. Use the formatted link in your app
 */

function formatDropboxUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  let formattedUrl = url.trim();
  
  // Replace www.dropbox.com with dl.dropboxusercontent.com
  formattedUrl = formattedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  
  // Replace dl=0 with raw=1
  formattedUrl = formattedUrl.replace('dl=0', 'raw=1');
  
  // Add raw=1 if not present
  if (!formattedUrl.includes('?')) {
    formattedUrl += '?raw=1';
  } else if (!formattedUrl.includes('raw=1')) {
    formattedUrl += '&raw=1';
  }
  
  return formattedUrl;
}

// Example usage
// const originalUrl = 'https://www.dropbox.com/s/abc123/file.mp3?dl=0';
// const directUrl = formatDropboxUrl(originalUrl);
// console.log(directUrl);
