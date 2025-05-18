# Dictation Checker Integration Guide for Teachable

This guide explains how to integrate the Dictation Checker app into Teachable lessons, working around Dropbox's CORS restrictions.

## Table of Contents

1. [Overview](#overview)
2. [Setup](#setup)
3. [Creating VTT Files](#creating-vtt-files)
4. [Generating Embedding Code](#generating-embedding-code)
5. [Batch Processing](#batch-processing)
6. [Troubleshooting](#troubleshooting)
7. [Technical Details](#technical-details)

## Overview

The Dictation Checker is an interactive app allowing students to practice dictation exercises by listening to audio and typing what they hear. This integration allows:

- Hosting audio files in Dropbox
- Using VTT (WebVTT) subtitle files for the dictation text
- Embedding the app in Teachable lessons with a workaround for Dropbox CORS restrictions

## Setup

### Folder Structure in Dropbox

```
/NEW Dictation Tool/             (Main app folder)
  |- embed.html                  (App entry point)
  |- teachable-integration.js    (Integration script)
  |- mobile-detection.js         (Mobile device helper)
  |- DT-Audio Files/             (Audio file directory)
  |    |- DT-A1-Audio/           (Level-specific audio)
  |    |- DT-A2-Audio/
  |    |- DT-B1-Audio/
  |    |- DT-B2-Audio/
  |- DT-VTT Files/               (VTT subtitle directory)
       |- DT-A1-VTT/             (Level-specific VTT files)
       |- DT-A2-VTT/
       |- DT-B1-VTT/
       |- DT-B2-VTT/
```

### Setup Steps

1. Run the deployment script to set up initial folder structure:

   ```bash
   node deploy-to-teachable.js
   ```

2. Place your audio files in the appropriate level folders following the naming convention:
   - Example: `NEW-A1-Merkels-Moepse-L01.mp3` for level A1, lesson 1

## Creating VTT Files

Each audio file needs a corresponding VTT file for the dictation text.

### Automatic VTT Generation

1. Run the batch VTT generator:

   ```bash
   node batch-vtt-generator.js
   ```

   This will:
   - Scan all audio folders
   - Create corresponding VTT files (with placeholder text if source text files aren't found)
   - Maintain proper folder structure

2. Edit the generated VTT files to add proper timing and text.

### VTT File Format

```
WEBVTT

00:00:00.000 --> 00:00:05.000
This is the first sentence.

00:00:05.000 --> 00:00:10.000
This is the second sentence.

00:00:10.000 --> 00:00:15.000
This is the third sentence.
```

## Generating Embedding Code

### Using the GUI Tool

1. Open `teachable-embed-gui.html` in your browser
2. For a single lesson:
   - Fill in the URLs for embed.html, teachable-integration.js, audio file, and VTT file
   - Select the course level and lesson number
   - Click "Generate Embedding Code"
   - Copy the generated code

3. Paste the code into your Teachable lesson's HTML editor

### Manual URL Conversion

If adding URLs manually, format Dropbox URLs as follows:
1. Replace `www.dropbox.com` with `dl.dropboxusercontent.com`
2. Replace `?dl=0` with `?raw=1`

Example:
- Original: `https://www.dropbox.com/s/abc123/audio.mp3?dl=0`
- Converted: `https://dl.dropboxusercontent.com/s/abc123/audio.mp3?raw=1`

## Batch Processing

For processing multiple lessons at once:

1. Open `teachable-embed-gui.html` and go to "Batch Processing" tab
2. Click "Scan Dropbox Folders" to detect available lessons
3. Select your course level
4. Either:
   - Click on individual lessons to select them, or
   - Set a lesson range using the input fields
5. Click "Generate Batch Embedding Code"
6. Use "Export All Codes to CSV" to save the embedding codes for all lessons

## Troubleshooting

### Common Issues

1. **Audio not playing**
   - Make sure audio URL is correctly formatted with `dl.dropboxusercontent.com` and `?raw=1`
   - Verify the audio file exists in your Dropbox folder

2. **VTT file not loading**
   - Check that the VTT URL is correct
   - Verify the VTT file exists in your Dropbox folder
   - Check the VTT file format for syntax errors

3. **CORS errors in browser console**
   - Make sure the "Use proxy solution" checkbox is selected when generating embedding code
   - This approach bypasses Dropbox's embedding restrictions

## Technical Details

### How the Embedding Workaround Works

The Teachable integration works around Dropbox's embedding restrictions by:

1. Using a container div with data attributes instead of direct iframe embedding:
   ```html
   <div class="dictation-app-container" 
        data-course-id="A1" 
        data-lesson-id="L01" 
        data-audio-url="https://dl.dropboxusercontent.com/.../audio.mp3?raw=1"
        data-vtt-url="https://dl.dropboxusercontent.com/.../subtitles.vtt?raw=1">
   </div>
   ```

2. The `teachable-integration.js` script reads these attributes and loads the resources directly

3. Audio and VTT files are fetched with the proper CORS headers by adding the `?raw=1` parameter

4. The script then handles creating the dictation checker interface dynamically within the container

This approach avoids the CORS restrictions while providing the full functionality of the dictation app.

---

## Need Help?

If you encounter issues or have questions, please check:
- The documentation in the `/docs` folder 
- The troubleshooting section above
- Or contact technical support for assistance
