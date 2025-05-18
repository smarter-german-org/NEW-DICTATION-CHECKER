# Dictation Checker - Teachable Integration Guide

This guide explains how to integrate the Dictation Checker app into your Teachable courses, allowing you to add interactive dictation exercises to any lesson.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Choosing a Hosting Solution](#choosing-a-hosting-solution)
3. [File Structure Setup](#file-structure-setup)
4. [Preparing Your Audio and VTT Files](#preparing-your-audio-and-vtt-files)
5. [Adding the Dictation App to Teachable Lessons](#adding-the-dictation-app-to-teachable-lessons)
6. [Customization Options](#customization-options)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

Before you begin, ensure you have:
- Access to a hosting solution for audio/VTT files and the app (see next section)
- Admin access to your Teachable courses
- Audio recordings for your dictation exercises
- VTT files with timing information for each sentence

## Choosing a Hosting Solution

You have several options for hosting the dictation app and content files:

### Option 1: Dropbox (Recommended for large audio collections)
- Pros: 2GB free storage (Plus plan: 2TB), easy file management
- Cons: URLs need special formatting, potential CORS issues
- Setup: See our [Dropbox Hosting Guide](./DROPBOX-HOSTING-GUIDE.md)

### Option 2: GitHub Pages
- Pros: Free, integrated with version control
- Cons: 1GB repository size limit, 100MB per file limit
- Best for: Smaller projects with limited audio files

### Option 3: AWS S3
- Pros: Highly scalable, reliable, proper CORS support
- Cons: Pay-per-use pricing, more complex setup
- Best for: Professional deployments with high traffic

## File Structure Setup

For optimal organization across 4 courses with 50 lessons, we recommend the following file structure (adapt to your hosting platform):

```
dictation-app/                     # Main app folder
├── embed.html                     # Embedded entry point
├── index.html                     # Standalone entry point
├── teachable-integration.js       # Integration script 
├── assets/                        # All app assets
│   ├── [all app js and css files]
├── content/                       # All course content
│   ├── course1/                   # First course
│   │   ├── audio/                 # Audio files for course 1
│   │   │   ├── lesson1.mp3
│   │   │   ├── lesson2.mp3
│   │   │   └── [lessons 3-50...]
│   │   └── vtt/                   # VTT files for course 1
│   │       ├── lesson1.vtt
│   │       ├── lesson2.vtt
│   │       └── [lessons 3-50...]
│   ├── course2/
│   │   ├── audio/
│   │   └── vtt/
│   ├── course3/
│   └── course4/
```

## Preparing Your Audio and VTT Files

### Audio Format Requirements
- Format: MP3 
- Bitrate: 128-192 kbps recommended
- Clear audio without background noise

### VTT File Format
Each VTT file should contain timing information for individual sentences:

```
WEBVTT

NOTE Title: Lesson 1 - Introduction

00:00:00.000 --> 00:00:03.500
This is the first sentence of your dictation.

00:00:03.800 --> 00:00:08.200
Here is the second sentence with more words to type.

[and so on...]
```

## Setting Up Your WordPress Site

1. **Build the dictation app:**
   ```bash
   cd /path/to/dictation-checker
   chmod +x build-embedded.sh
   ./build-embedded.sh
   ```

2. **Upload the files:**
   - Upload the entire `dist` folder to your WordPress site at `wp-content/uploads/dictation-app/`
   - Create the `courses` folder structure and upload your audio/VTT files as described above

3. **Configure CORS (Cross-Origin Resource Sharing):**
   Add these lines to your WordPress site's `.htaccess` file:
   ```apache
   # Allow CORS for dictation app resources
   <IfModule mod_headers.c>
     <FilesMatch "\.(mp3|vtt)$">
       Header set Access-Control-Allow-Origin "https://YOUR-TEACHABLE-DOMAIN.teachable.com"
       Header set Access-Control-Allow-Methods "GET"
     </FilesMatch>
   </IfModule>
   ```

4. **Update the Base URL:**
   Edit `teachable-integration.js` to set your actual WordPress domain:
   ```javascript
   const APP_BASE_URL = 'https://your-actual-wordpress-site.com/wp-content/uploads/dictation-app';
   ```

## Adding the Dictation App to Teachable Lessons

1. **Edit your Teachable lesson:**
   - Go to your course in Teachable
   - Edit the lesson where you want to add the dictation exercise

2. **Switch to HTML mode** in the Teachable editor

3. **Add the following code:**
   ```html
   <div class="dictation-app-container" 
        data-course-id="1" 
        data-lesson-id="3" 
        data-audio-url="https://yoursite.com/wp-content/uploads/dictation-app/courses/course1/lesson3/audio.mp3"
        data-vtt-url="https://yoursite.com/wp-content/uploads/dictation-app/courses/course1/lesson3/audio.vtt">
   </div>
   
   <script src="https://yoursite.com/wp-content/uploads/dictation-app/teachable-integration.js"></script>
   ```

4. **Update the attributes:**
   - Replace `data-course-id` with your course number (1-4)
   - Replace `data-lesson-id` with the lesson number (1-50)
   - Update the URLs to point to your actual audio and VTT files
   - Replace `yoursite.com` with your actual WordPress domain

5. **Save the lesson**

## Customization Options

You can add additional data attributes to customize the dictation app:

```html
<div class="dictation-app-container" 
     data-course-id="1" 
     data-lesson-id="3" 
     data-audio-url="https://yoursite.com/wp-content/uploads/dictation-app/courses/course1/lesson3/audio.mp3"
     data-vtt-url="https://yoursite.com/wp-content/uploads/dictation-app/courses/course1/lesson3/audio.vtt"
     data-height="700"
     data-theme="dark"
     data-check-capitalization="true">
</div>
```

Available options:
- `data-height`: Set a custom height for the iframe (default: 650px)
- `data-theme`: Choose "light" or "dark" theme (default: dark)
- `data-check-capitalization`: Set to "true" to check capitalization (default: false)

## Troubleshooting

### Common Issues

**App doesn't load:**
- Verify that all files are uploaded correctly
- Check browser console for errors
- Ensure CORS is properly configured on your WordPress server

**Audio doesn't play:**
- Check if the audio URL is correct and accessible
- Verify that the audio format is supported (MP3 recommended)
- Check if browser permissions for audio playback are granted

**Dictation text doesn't match audio:**
- Verify your VTT file timing and accuracy
- Make sure the VTT file has the correct format

**App appears small or has scrollbars:**
- Adjust the `data-height` attribute to ensure proper sizing

### Getting Help

If you encounter issues not covered here, please check the browser console for error messages and contact support with those details.

---

## Appendix: Batch Processing VTT Files

If you need to create VTT files for many lessons, consider using our VTT generator utility:

1. Place your audio files in a folder
2. Create text files with the same names containing the transcripts
3. Run the utility to generate VTT files with timing information
