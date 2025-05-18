#!/bin/bash
# Build script for Dictation Checker App

# Exit on any error
set -e

# Display build information
echo "=====================================================
Building Dictation Checker App for Teachable Integration
====================================================="

echo "1. Installing dependencies..."
npm ci

echo "2. Building production version..."
npm run build

echo "3. Creating embedded version..."
# Copy the embed.html and teachable-integration.js files to dist
cp ./public/embed.html ./dist/
cp ./public/teachable-integration.js ./dist/
cp ./public/mobile-detection.js ./dist/

echo "4. Organizing files..."
# Create directories for content with improved structure
mkdir -p ./dist/content/course1/audio
mkdir -p ./dist/content/course1/vtt
mkdir -p ./dist/content/course2/audio
mkdir -p ./dist/content/course2/vtt
mkdir -p ./dist/content/course3/audio
mkdir -p ./dist/content/course3/vtt
mkdir -p ./dist/content/course4/audio
mkdir -p ./dist/content/course4/vtt

# Copy documentation
mkdir -p ./dist/docs
cp ./docs/TEACHABLE-INTEGRATION.md ./dist/docs/
cp ./docs/DROPBOX-HOSTING-GUIDE.md ./dist/docs/

# Copy sample audio file
cp ./public/audio/chap01.mp3 ./dist/content/course1/audio/lesson1.mp3
cp ./public/audio/chap01.vtt ./dist/content/course1/vtt/lesson1.vtt

echo "5. Creating test page..."
cat > ./dist/test-embed.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dictation App Test</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
    .test-container { margin: 20px 0; padding: 20px; border: 1px solid #ccc; }
    h1, h2, h3 { color: #333; }
    iframe { width: 100%; height: 650px; border: 1px solid #ddd; }
    .guide { background: #f8f9fa; padding: 15px; margin: 20px 0; border-left: 4px solid #4CAF50; }
    code { background: #f1f1f1; padding: 2px 4px; border-radius: 3px; font-family: monospace; }
    .tabs { display: flex; margin-bottom: -1px; }
    .tab { padding: 10px 15px; cursor: pointer; border: 1px solid #ccc; background: #f1f1f1; margin-right: 5px; }
    .tab.active { background: white; border-bottom: 1px solid white; }
    .tab-content { display: none; border: 1px solid #ccc; padding: 15px; }
    .tab-content.active { display: block; }
  </style>
</head>
<body>
  <h1>Dictation App Embed Test</h1>
  
  <div class="guide">
    <h3>Hosting Options</h3>
    <p>This test page shows examples of embedding with different hosting configurations:</p>
    <ul>
      <li><strong>Local Files:</strong> Using local sample files (only works when testing locally)</li>
      <li><strong>Dropbox:</strong> Shows how to embed using Dropbox-hosted files</li>
      <li><strong>GitHub Pages:</strong> Shows how to embed using GitHub Pages-hosted files</li>
    </ul>
  </div>
  
  <div class="tabs">
    <div class="tab active" onclick="switchTab(0)">Local Files</div>
    <div class="tab" onclick="switchTab(1)">Dropbox</div>
    <div class="tab" onclick="switchTab(2)">GitHub Pages</div>
  </div>

  <div class="tab-content active">
    <h2>Sample Lesson Using Local Files</h2>
    <iframe src="./embed.html?audio=./content/course1/audio/lesson1.mp3&vtt=./content/course1/vtt/lesson1.vtt&course=1&lesson=1" 
      allow="autoplay; fullscreen"></iframe>

    <div class="guide">
      <h3>Integration Code Example</h3>
      <pre><code>&lt;!-- Dictation Exercise - Course 1, Lesson 1 --&gt;
&lt;div class="dictation-app-container" 
     data-course-id="1" 
     data-lesson-id="1" 
     data-audio-url="./content/course1/audio/lesson1.mp3"
     data-vtt-url="./content/course1/vtt/lesson1.vtt"&gt;
&lt;/div&gt;

&lt;script src="./teachable-integration.js"&gt;&lt;/script&gt;</code></pre>
    </div>
  </div>

  <div class="tab-content">
    <h2>Sample Lesson Using Dropbox</h2>
    <p>Replace these placeholder URLs with your actual Dropbox URLs:</p>
    
    <div class="guide">
      <h3>Dropbox URL Format</h3>
      <p>For Dropbox hosted files, convert the URLs:</p>
      <ul>
        <li>Change <code>www.dropbox.com</code> to <code>dl.dropboxusercontent.com</code></li>
        <li>Replace <code>?dl=0</code> with <code>?raw=1</code></li>
      </ul>
    </div>

    <div class="guide">
      <h3>Integration Code Example</h3>
      <pre><code>&lt;!-- Dictation Exercise - Course 1, Lesson 1 --&gt;
&lt;div class="dictation-app-container" 
     data-course-id="1" 
     data-lesson-id="1" 
     data-audio-url="https://dl.dropboxusercontent.com/s/your-file-path/lesson1.mp3?raw=1"
     data-vtt-url="https://dl.dropboxusercontent.com/s/your-file-path/lesson1.vtt?raw=1"&gt;
&lt;/div&gt;

&lt;script src="https://dl.dropboxusercontent.com/s/your-app-path/teachable-integration.js?raw=1"&gt;&lt;/script&gt;</code></pre>
    </div>
  </div>

  <div class="tab-content">
    <h2>Sample Lesson Using GitHub Pages</h2>
    <p>Replace these placeholder URLs with your actual GitHub Pages URLs:</p>
    
    <div class="guide">
      <h3>Integration Code Example</h3>
      <pre><code>&lt;!-- Dictation Exercise - Course 1, Lesson 1 --&gt;
&lt;div class="dictation-app-container" 
     data-course-id="1" 
     data-lesson-id="1" 
     data-audio-url="https://your-username.github.io/your-repo/content/course1/audio/lesson1.mp3"
     data-vtt-url="https://your-username.github.io/your-repo/content/course1/vtt/lesson1.vtt"&gt;
&lt;/div&gt;

&lt;script src="https://your-username.github.io/your-repo/teachable-integration.js"&gt;&lt;/script&gt;</code></pre>
    </div>
  </div>
  
  <script>
    function switchTab(tabIndex) {
      // Update tabs
      const tabs = document.querySelectorAll('.tab');
      tabs.forEach((tab, index) => {
        if (index === tabIndex) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // Update content
      const contents = document.querySelectorAll('.tab-content');
      contents.forEach((content, index) => {
        if (index === tabIndex) {
          content.classList.add('active');
        } else {
          content.classList.remove('active');
        }
      });
    }
  
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'DICTATION_APP_READY') {
        console.log('App is ready, height:', event.data.height);
      }
    });
  </script>
</body>
</html>
EOL

echo "✅ Build completed successfully!"
echo "You can test the app by opening ./dist/test-embed.html in a browser"
echo "For Teachable integration, upload the entire dist directory to your server and use the embed instructions."
