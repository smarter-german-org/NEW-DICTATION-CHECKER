# Dictation Checker Teachable Integration

This package contains tools to help you integrate the Dictation Checker app into Teachable lessons while working around Dropbox hosting and CORS restrictions.

## Provided Tools

1. **teachable-embed-generator.html** - A GUI tool to generate embedding code
2. **batch-vtt-generator.js** - A script to generate VTT files from your audio files
3. **enhanced-teachable-integration.js** - A simplified version of the dictation checker that works directly in Teachable

## Quick Start Guide

### Step 1: Prepare Your Files in Dropbox

Create this folder structure in your Dropbox:
```
/NEW Dictation Tool/
  |- enhanced-teachable-integration.js
  |- DT-Audio Files/
  |    |- DT-A1-Audio/
  |    |- DT-A2-Audio/
  |    |- ...
  |- DT-VTT Files/
       |- DT-A1-VTT/
       |- DT-A2-VTT/
       |- ...
```

### Step 2: Upload Files

1. Upload the `enhanced-teachable-integration.js` to your Dropbox folder
2. Upload all your audio files to the appropriate level folders
3. Create/upload VTT files or use the `batch-vtt-generator.js` to create them

### Step 3: Share Files and Generate Embedding Code

1. In Dropbox, right-click on `enhanced-teachable-integration.js` and select "Share" > "Copy link"
2. Do the same for an audio file and its corresponding VTT file
3. Open `teachable-embed-generator.html` in your web browser
4. Fill in the form with:
   - Course level (A1, A2, etc.)
   - Lesson number (e.g., L01)
   - Paste the Dropbox links you copied
5. Click "Generate Code" and copy the resulting embedding code

### Step 4: Embed in Teachable

1. In your Teachable lesson, open the HTML editor
2. Paste the generated code
3. Save and publish your lesson

## Batch Processing

To process multiple lessons at once:

1. Open `teachable-embed-generator.html` and click on the "Batch Processing" tab
2. Fill in the course level, lesson range, and URL patterns
3. Click "Generate Batch Codes"
4. Use the "Copy" button to copy individual codes or "Export All to CSV" for all codes

## Troubleshooting

If you encounter permission issues or CORS errors:

1. Make sure all your Dropbox links are publicly shared
2. Verify that links are converted to format `dl.dropboxusercontent.com` with `?raw=1` parameter
3. Try using the enhanced integration script instead of the original

If dictation checking functionality doesn't work properly:

1. Check your VTT file format (see template.vtt for proper formatting)
2. Verify that both audio and VTT URLs are accessible publicly

Need further help? Check the comprehensive guide in the `teachable-integration-guide.md` file.
