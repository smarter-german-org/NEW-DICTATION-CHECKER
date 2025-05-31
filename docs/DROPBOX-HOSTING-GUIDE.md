# Hosting Dictation App Content on Dropbox

## Overview

This guide explains how to host your dictation app and content files on Dropbox, which is ideal for:
- Handling large audio files (over 1GB total)
- Avoiding GitHub's repository size limits
- Easy file management without git knowledge

## Quick Start Guide for Existing Files

If you already have audio files in Dropbox and just need to integrate them:

1. Use our simplified tools to convert Dropbox links:
   ```bash
   # Convert a single URL
   node format-dropbox-url.js "your-dropbox-link"
   
   # Process multiple lessons at once
   node format-dictation-batch.js
   ```

2. See the [Audio Links Template](./AUDIO-LINKS-TEMPLATE.md) for organizing your links

## Step 1: Prepare Your Files

### App Files
1. Build the embedded version of the app:
```bash
# From the project root directory
npm run build:embedded
```

2. Create a folder in your Dropbox called `dictation-app`
3. Copy all files from the `dist` directory to your `dictation-app` folder in Dropbox

### Content Files
1. Create a folder structure for your content (use our script or do it manually):
```
dictation-app/
├── content/
│   ├── course1/
│   │   ├── audio/
│   │   │   ├── lesson1.mp3
│   │   │   ├── lesson2.mp3
│   │   │   └── ...
│   │   └── vtt/
│   │       ├── lesson1.vtt
│   │       ├── lesson2.vtt
│   │       └── ...
│   ├── course2/
│   │   └── ...
```

2. Upload your audio (MP3) and subtitle (VTT) files to their respective folders

## Step 2: Get Shareable Links

### For the App Files
1. Right-click on `embed.html` in your Dropbox
2. Choose "Copy Link" or "Share" → "Copy Link"
3. Convert the link from `https://www.dropbox.com/...?dl=0` to `https://dl.dropboxusercontent.com/...?raw=1`
   - Replace `www.dropbox.com` with `dl.dropboxusercontent.com`
   - Replace `?dl=0` with `?raw=1`
   
4. Also get the link for `teachable-integration.js` in the same way

### For Each Audio and VTT File
1. Right-click on each file
2. Choose "Copy Link" or "Share" → "Copy Link"
3. Apply the same URL transformations as above

## Step 3: Generate Embedding Code

1. Run the code generator script:
```bash
node generate-teachable-code.js
```

2. When prompted, select `dropbox` as the hosting platform
3. Provide the full URLs (after converting them as explained above) for:
   - The embedded app (`embed.html`)
   - The integration script (`teachable-integration.js`)
   - Each audio file
   - Each VTT file

4. Copy the generated HTML code into your Teachable lesson

## Testing

Before deploying to Teachable:
1. Create a simple HTML file locally with your generated code
2. Open it in a browser to verify everything loads correctly
3. Test the dictation functionality

## Important Notes

1. **Direct Links Expiration**: Dropbox shared links might expire after a long period of inactivity. Check them periodically.

2. **URL Conversion**: Always remember to convert Dropbox URLs by:
   ```
   www.dropbox.com → dl.dropboxusercontent.com
   ?dl=0 → ?raw=1
   ```

3. **Privacy**: By default, anyone with the link can access your files. If you need more privacy:
   - Set up a Dropbox Business account
   - Look into password-protecting your shared links
   - Consider other hosting options like AWS S3 with restricted access

4. **Content Updates**: When updating audio or VTT files, simply replace them in your Dropbox folder. The links will remain the same.

## Troubleshooting

- **CORS Issues**: If you encounter Cross-Origin Resource Sharing (CORS) errors, you may need a different hosting solution like AWS S3.
- **Loading Problems**: Ensure your URLs have been properly converted to the direct download format.
- **Mobile Issues**: Test thoroughly on mobile devices as some mobile browsers handle Dropbox links differently.

## Alternative Methods

If you encounter limitations with direct Dropbox links, consider:

1. Using the [Dropbox API](https://www.dropbox.com/developers) to create a small server that delivers your files
2. Setting up an AWS S3 bucket with proper CORS configuration
3. Using a CDN service that integrates with Dropbox

## Working with Existing Dropbox Files

If you already have audio files in Dropbox and don't want to reorganize them:

### Method 1: Automated Helper for Synced Files (Recommended)

If your Dropbox files are synced to your computer, use our synced files helper:

```bash
node dropbox-synced-helper.js
```

This tool can:
- Generate links for files that are synced locally
- Scan directories of audio files
- Generate embedding code for individual or all lessons
- Export all links to CSV for backup

### Method 2: Simple URL Converter

Use the simple URL converter to quickly get direct download links:

```bash
node format-dropbox-url.js "https://www.dropbox.com/path/to/your/file.mp3?dl=0"
```

### Method 3: Batch Processing

1. Create a CSV file listing your courses and lessons with their Dropbox URLs
2. Use the batch formatter to generate all embedding codes at once:

```bash
node format-dictation-batch.js
```

3. Input the path to your CSV file when prompted

### Method 4: Track Links in a Document

Use the provided template file to keep track of your Dropbox links:
- [Audio Links Template](./AUDIO-LINKS-TEMPLATE.md)

This makes it easier to update links if they expire or change.
