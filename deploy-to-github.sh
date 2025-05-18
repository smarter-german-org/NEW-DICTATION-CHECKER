#!/bin/bash
# Script to deploy dictation checker to GitHub Pages

# Set these variables
REPO_URL="https://github.com/smarter-german-org/NEW-DICTATION-CHECKER.git"
USERNAME="smarter-german-org"
REPO_NAME="NEW-DICTATION-CHECKER"

# Check if the dist directory exists
if [ ! -d "dist" ]; then
    echo "Error: 'dist' directory not found. Run 'npm run build' first."
    exit 1
fi

echo "Preparing to deploy to GitHub Pages..."

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Created temp directory: $TEMP_DIR"

# Create .nojekyll file to prevent GitHub from ignoring files that begin with an underscore
touch dist/.nojekyll

# Make sure teachable-integration.js is copied to the dist folder
if [ -f "public/teachable-integration.js" ]; then
    echo "Copying teachable-integration.js to dist/"
    cp public/teachable-integration.js dist/
fi

# Copy the dist contents to the temp directory
cp -r dist/* "$TEMP_DIR"
cp -r dist/.nojekyll "$TEMP_DIR"

# Navigate to the temp directory
cd "$TEMP_DIR" || exit

# Initialize Git
git init
git add .
git commit -m "Deploy dictation checker to GitHub Pages"

# Add GitHub as remote and force push
if [ -z "$REPO_URL" ] || [ "$REPO_URL" = "YOUR_GITHUB_REPO_URL_HERE" ]; then
    echo "Please edit the script and set your GitHub repository URL"
    exit 1
fi

git remote add origin "$REPO_URL"
git branch -M gh-pages
git push -f origin gh-pages

echo "Deployed to GitHub Pages successfully!"
echo "Your app will be available at: https://$USERNAME.github.io/$REPO_NAME/"
echo "Note: It might take a few minutes for the changes to propagate."

# Clean up
cd ..
rm -rf "$TEMP_DIR"
