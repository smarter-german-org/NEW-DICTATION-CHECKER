#!/bin/bash
# Script to deploy dictation checker to GitHub Pages

# Set these variables
REPO_URL="YOUR_GITHUB_REPO_URL_HERE" # Example: https://github.com/yourusername/dictation-checker.git
USERNAME="YOUR_GITHUB_USERNAME"
REPO_NAME="dictation-checker"

# Check if the dist directory exists
if [ ! -d "dist" ]; then
    echo "Error: 'dist' directory not found. Run 'npm run build' first."
    exit 1
fi

echo "Preparing to deploy to GitHub Pages..."

# Create a temporary directory
TEMP_DIR=$(mktemp -d)
echo "Created temp directory: $TEMP_DIR"

# Copy the dist contents to the temp directory
cp -r dist/* "$TEMP_DIR"

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
git branch -M main
git push -f origin main

# Create gh-pages branch and push
git checkout -b gh-pages
git push -f origin gh-pages

echo "Deployed to GitHub Pages successfully!"
echo "Your app will be available at: https://$USERNAME.github.io/$REPO_NAME/"
echo "Note: It might take a few minutes for the changes to propagate."

# Clean up
cd ..
rm -rf "$TEMP_DIR"
