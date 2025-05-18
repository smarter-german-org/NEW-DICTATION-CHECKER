/**
 * Dictation Checker - Teachable Integration Script
 * 
 * This script allows easy embedding of the Dictation Checker app into Teachable lessons.
 * Add this script to all lessons where you want to include a dictation exercise.
 * 
 * Installation Instructions:
 * 1. Host the app files on your preferred platform (GitHub Pages, AWS, Dropbox, etc.)
 * 2. Host your audio and VTT files on any accessible platform
 * 3. Add the container div and include this script in each Teachable lesson
 * 
 * Example usage:
 * <div class="dictation-app-container" 
 *      data-course-id="1" 
 *      data-lesson-id="3" 
 *      data-audio-url="https://dl.dropboxusercontent.com/s/your-files/audio.mp3?raw=1"
 *      data-vtt-url="https://dl.dropboxusercontent.com/s/your-files/audio.vtt?raw=1">
 * </div>
 * 
 * <script src="https://path-to-your-hosted-app/teachable-integration.js"></script>
 */

(function() {
  // Automatically detect the app location from the script source or use GitHub Pages URL
  const appBaseUrl = (function() {
    try {
      // Get the current script tag
      const scripts = document.getElementsByTagName('script');
      const currentScript = scripts[scripts.length - 1];
      const scriptSrc = currentScript.src;
      
      // Extract the base URL from the script source
      const autoDetectedUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));
      
      // If autodetection works, use that URL
      if (autoDetectedUrl && autoDetectedUrl.length > 0) {
        console.log('Dictation App: Using auto-detected URL:', autoDetectedUrl);
        return autoDetectedUrl;
      }
    } catch (e) {
      console.warn('Dictation App: Auto-detection failed, using default GitHub Pages URL');
    }
    
    // Fallback to GitHub Pages URL if auto-detection fails
    return 'https://smarter-german-org.github.io/NEW-DICTATION-CHECKER';
  })();
  
  // Wait for DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Find all dictation app containers
    const containers = document.querySelectorAll('.dictation-app-container');
    
    if (containers.length === 0) {
      console.log('Dictation App: No container elements found. Add a div with class "dictation-app-container"');
      return;
    }
    
    // Process each container
    containers.forEach(function(container, index) {
      // Get configuration from data attributes
      const courseId = container.getAttribute('data-course-id');
      const lessonId = container.getAttribute('data-lesson-id');
      const audioUrl = container.getAttribute('data-audio-url');
      const vttUrl = container.getAttribute('data-vtt-url');
      
      // Validate required attributes
      if (!audioUrl || !vttUrl) {
        container.innerHTML = `
          <div style="padding: 20px; border: 2px solid #f44336; background-color: #ffebee; color: #b71c1c;">
            <h3>Dictation App Configuration Error</h3>
            <p>Missing required attributes: data-audio-url and data-vtt-url must be specified.</p>
          </div>
        `;
        return;
      }
      
      // Generate a unique ID for this container
      const containerId = 'dictation-embed-' + (index + 1);
      container.id = containerId;
      
      // Construct the iframe URL with parameters
      let iframeUrl = `${appBaseUrl}/embed.html?`;
      iframeUrl += `audio=${encodeURIComponent(audioUrl)}`;
      iframeUrl += `&vtt=${encodeURIComponent(vttUrl)}`;
      
      // Add optional parameters if available
      if (courseId) iframeUrl += `&course=${encodeURIComponent(courseId)}`;
      if (lessonId) iframeUrl += `&lesson=${encodeURIComponent(lessonId)}`;
      
      // Create and insert the iframe
      const iframe = document.createElement('iframe');
      iframe.src = iframeUrl;
      iframe.width = '100%';
      iframe.height = '650px'; // Default height
      iframe.style.border = 'none';
      iframe.allow = 'autoplay; fullscreen';
      iframe.id = `${containerId}-iframe`;
      
      // Clear the container and add the iframe
      container.innerHTML = '';
      container.appendChild(iframe);
      
      // Add responsive height adjustment
      window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'DICTATION_APP_READY') {
          if (event.data.height) {
            // Add a small buffer to the height
            const desiredHeight = Math.max(650, event.data.height + 50);
            iframe.height = `${desiredHeight}px`;
          }
        }
      });
    });
    
    // Add the needed CSS for the containers
    const style = document.createElement('style');
    style.textContent = `
      .dictation-app-container {
        margin: 20px 0;
        width: 100%;
        max-width: 900px;
      }
      @media (max-width: 768px) {
        .dictation-app-container iframe {
          height: 750px;
        }
      }
    `;
    document.head.appendChild(style);
  });
})();
