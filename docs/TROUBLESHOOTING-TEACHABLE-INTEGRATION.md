# Fixing Dictation Checker Integration in Teachable

This guide will help you troubleshoot and fix the integration of your dictation checker tool in Teachable.

## Identified Issues

The main issue appears to be that the integration script URL is missing or malformed in your embed code. The browser shows this error:

```
Laden fehlgeschlagen für das <script> mit der Quelle "https://courses.smartergerman.com/courses/a1-beginners-german-free/lectures/teachable-integration.js"
```

This indicates that the browser is trying to load the script from the current page's path rather than from your Dropbox URL.

## Step 1: Prepare Your Integration Script

1. Make sure your `teachable-integration.js` file is properly prepared:

   - The file should be ES5-compatible (no const/let, arrow functions, or template literals)
   - All script tags in the code should be escaped with `<\/script>` instead of `</script>`

2. Choose which version to use:
   - Standard version: `/Users/denkmuskel/NEW-DICTATION CHECKER/public/teachable-integration.js`
   - Enhanced version: `/Users/denkmuskel/NEW-DICTATION CHECKER/public/enhanced-teachable-integration.js`

## Step 2: Upload to a Reliable Host

Dropbox can sometimes cause CORS issues with JavaScript files. Consider these options:

### Option A: Dropbox (with proper sharing)

1. Upload your integration script to Dropbox
2. Make sure it's **publicly shared**
3. Get a sharing link that looks like: `https://www.dropbox.com/s/abcdef123456/teachable-integration.js?dl=0`

### Option B: GitHub Pages (recommended for better reliability)

1. Create a GitHub repository for your integration script
2. Upload the script file
3. Enable GitHub Pages in the repository settings
4. Use the GitHub Pages URL: `https://yourusername.github.io/repo-name/teachable-integration.js`

## Step 3: Test Your Integration Script

Use the integration tester tool I've created:

1. Open http://localhost:8080/integration-tester.html
2. Test your script URL to make sure it loads correctly
3. Test your audio and VTT URLs
4. Generate a test embed code

## Step 4: Update Your Embed Code Generator

1. Update the default URL in your embed generator:

```html
<input type="text" id="integration-url" 
    value="https://www.dropbox.com/s/your-actual-shared-file-id/teachable-integration.js?dl=0"
    placeholder="https://www.dropbox.com/.../teachable-integration.js">
```

2. Make sure you're using the same URL consistently

## Step 5: Generate New Embed Code

1. Open http://localhost:8080/teachable-embed-generator-clean.html
2. Generate new embed code with your properly shared script URL
3. Check that the generated code has a proper `<script>` tag with a complete URL:

```html
<script src="https://dl.dropboxusercontent.com/s/your-file-id/teachable-integration.js?raw=1"></script>
```

## Step 6: Update Your Teachable Course

1. Go to your Teachable course
2. Find the lesson where you want to add the dictation checker
3. Switch to HTML mode in the editor
4. Paste the newly generated embed code
5. Save and publish the changes

## Troubleshooting

If you continue to have issues:

1. Check browser console for specific errors
2. Use the integration tester to verify your URLs are working
3. Try hosting your script on GitHub Pages instead of Dropbox
4. Verify that your VTT file format is correct

## Additional Resources

- See the `docs/FIXING-TEACHABLE-EMBED-ISSUE.md` for more detailed guidance
- Review the `TEACHABLE-INTEGRATION-README.md` for integration setup
