# Dictation Checker Teachable Integration Guide

This document provides a straightforward guide for integrating the Dictation Checker app into your Teachable lessons while avoiding Dropbox CORS and embedding restrictions.

## Folder Structure in Dropbox

Create this folder structure in your Dropbox:

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

## Step 1: Prepare Your Dropbox Files

1. Upload the core app files to your Dropbox:
   - `embed.html` from `/public/embed.html`
   - `teachable-integration.js` from `/public/teachable-integration.js`
   - `mobile-detection.js` from `/public/mobile-detection.js`

2. Organize your audio and VTT files:
   - Place audio files in appropriate level folders (DT-A1-Audio, etc.)
   - Use the `batch-vtt-generator.js` script to create VTT files if needed
   - Or create VTT files manually using the template format

## Step 2: Share Files from Dropbox

For each file you need to embed (main script files, audio files, VTT files):

1. Right-click the file in Dropbox and select **Share**
2. Click **Create Link** to get a shareable link
3. Copy the link - it will be in the format `https://www.dropbox.com/s/...?dl=0`

## Step 3: Generate Embedding Code

1. Open `teachable-embed-generator.html` in your web browser (just double-click it)
2. Fill in the form:
   - Select the course level (A1, A2, B1, B2)
   - Enter the lesson number (e.g., L01)
   - Paste the Dropbox link to your `teachable-integration.js` file
   - Paste the Dropbox link to your audio file
   - Paste the Dropbox link to your VTT file
3. Click "Generate Code"
4. Copy the generated code

The tool will automatically convert your Dropbox links to the proper format that works with Teachable:
- Changes `www.dropbox.com` to `dl.dropboxusercontent.com`
- Replaces `?dl=0` with `?raw=1`

## Step 4: Embed in Teachable

1. In your Teachable lesson, open the HTML editor
2. Paste the generated code exactly as it appears
3. Save and publish the lesson
4. Test that the dictation app loads properly and works

## Understanding the Workaround

This approach works because:

1. Direct links with `?raw=1` bypass Dropbox's embedding restrictions
2. The `teachable-integration.js` script loads the resources directly without iframes
3. Everything is loaded directly in the browser, avoiding CORS issues

## VTT File Format

VTT files should follow this format:

```
WEBVTT

00:00:00.000 --> 00:00:05.000
This is the first sentence.

00:00:05.000 --> 00:00:10.000
This is the second sentence.

00:00:10.000 --> 00:00:15.000
This is the third sentence.
```

## Troubleshooting

- **Audio not playing**: Make sure your audio URL is formatted correctly with `dl.dropboxusercontent.com` and `?raw=1`
- **VTT file not loading**: Check the URL format and that the VTT file syntax is correct
- **App not appearing**: Verify that all the URLs in your embed code are accessible
- **Error message in browser console**: Look for CORS-related errors and double-check that all URLs have `?raw=1` parameter
