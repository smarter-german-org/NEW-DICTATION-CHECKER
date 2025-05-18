# Using the Dropbox Synced Helper

This tutorial explains how to use the `dropbox-synced-helper.js` script to generate embedding code for your Dropbox-synced audio files.

## Prerequisites

- Node.js installed on your computer
- Dropbox desktop app installed and running
- Audio files synced to your computer via Dropbox

## Step 1: Configure App Files

First, you need to provide the URLs for the dictation app files:

1. Right-click on `embed.html` in your Dropbox and choose "Copy Dropbox Link"
2. Right-click on `teachable-integration.js` in your Dropbox and choose "Copy Dropbox Link"

You'll need to paste these links when prompted by the helper script.

## Step 2: Run the Helper Script

```bash
node dropbox-synced-helper.js
```

## Step 3: Choose an Option

The script provides several options:

1. **Add a single audio file** - Process one audio file at a time
2. **Scan a directory for audio files** - Process multiple audio files in a folder
3. **Generate embedding code** - Create embedding code for previously added files
4. **Export all links to CSV** - Export your links to a CSV file
5. **Update app links** - Change the app file URLs
6. **Exit** - Quit the script

## Example Workflow

### Adding a Single File

1. Choose option 1
2. Enter the course name (e.g., "A1")
3. Enter the lesson name (e.g., "L01")
4. Enter the full path to your audio file (e.g., "/Users/yourname/Dropbox/German Course/A1-Merkels-Moepse-L01.mp3")
5. The script will try to automatically get the Dropbox link (on macOS)
6. If automatic link generation fails, paste the Dropbox link when prompted
7. Paste the Dropbox link for the VTT file
8. Choose whether to generate embedding code immediately

### Scanning a Directory

1. Choose option 2
2. Enter the path to your directory containing audio files
3. Enter the course name for all files in this directory
4. For each audio file:
   - Enter a lesson name
   - The script will try to get the Dropbox link automatically
   - Enter or paste the VTT file link

### Generating Embedding Code

1. Choose option 3
2. Select a course from the list
3. Select a specific lesson or choose "all" to generate code for all lessons
4. The code will be displayed and saved to files

## Notes

- The script stores all links in a file called `dictation-links.json`
- You can export all links to a CSV file using option 4
- On macOS, the script attempts to get Dropbox links automatically using AppleScript
- On other platforms, you'll need to manually paste the Dropbox links

## Troubleshooting

- If automatic link generation doesn't work, make sure the Dropbox desktop app is running
- If you get "File not found" errors, check that the paths are correct
- Remember to convert Dropbox links to the direct download format (the script does this automatically)
