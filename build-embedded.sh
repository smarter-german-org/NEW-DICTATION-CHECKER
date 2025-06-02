#!/bin/bash
# filepath: build-embedded.sh

# Exit on error
set -e

echo "====================================="
echo "Building Dictation Checker for embedding"
echo "====================================="

# Build the main application
echo "Building main application..."
npm run build

# Create embedded version directory
echo "Creating embedded version..."
EMBED_DIR="dist-embedded"
mkdir -p $EMBED_DIR

# Copy the main build
echo "Copying build files..."
cp -r dist/* $EMBED_DIR/

# Copy integration scripts
echo "Copying integration scripts..."
cp teachable-integration.js $EMBED_DIR/
cp enhanced-teachable-integration.js $EMBED_DIR/

# Copy mobile detection script to ensure it's available
echo "Copying mobile detection script..."
cp mobile-detection.js $EMBED_DIR/

# Copy embed generator and related files
echo "Copying embedding tools..."
cp teachable-embed-generator-clean.html $EMBED_DIR/teachable-embed-generator.html
cp embed.html $EMBED_DIR/

# Fix paths in HTML files
echo "Fixing paths in HTML files..."
sed -i.bak 's|/assets/|./assets/|g' $EMBED_DIR/index.html
sed -i.bak 's|/mobile-detection.js|./mobile-detection.js|g' $EMBED_DIR/index.html
sed -i.bak 's|/src/main.jsx|./src/main.jsx|g' $EMBED_DIR/index.html
rm $EMBED_DIR/*.bak

# Create a simple README with instructions
echo "Creating README..."
cat > $EMBED_DIR/README.txt << 'EOL'
Dictation Checker - Embedded Version

How to use:
1. Upload all files to your hosting service (GitHub Pages, Dropbox, etc.)
2. Open teachable-embed-generator.html in your browser
3. Generate embed codes for your Teachable lessons
4. Paste the generated code into your Teachable lessons

Important:
- Make sure all URLs are accessible from Teachable
- For Dropbox hosting, the generator will automatically convert URLs to the proper format
- Audio files should be in MP3 format
- Transcript files should be in VTT format
- If using GitHub Pages, set up proper MIME types for .js files in your repo

GitHub Pages Deployment:
If you're using GitHub Pages and seeing MIME type errors:
1. Create a .nojekyll file in the repository root to prevent Jekyll processing
2. Ensure your repository is correctly configured for GitHub Pages
3. Check that the base URL paths in your HTML files match your repo structure
EOL

echo "====================================="
echo "Build complete! Files are in: $EMBED_DIR"
echo "====================================="
echo "Next steps:"
echo "1. Upload the contents of the $EMBED_DIR directory to your hosting provider"
echo "2. If using GitHub Pages, create a .nojekyll file in your repository"
echo "3. Use the teachable-embed-generator.html tool to create embed codes"
echo "====================================="