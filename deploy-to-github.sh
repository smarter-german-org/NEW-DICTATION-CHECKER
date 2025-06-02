#!/bin/bash
# This script deploys the dist-embedded directory to GitHub Pages

echo "Deploying to GitHub Pages..."
cd dist-embedded

# Initialize Git repository
git init
git checkout -b gh-pages

# Add all files
git add .
git commit -m "Deploy dictation checker to GitHub Pages"

# Push to GitHub Pages
git remote add origin https://github.com/smarter-german-org/NEW-DICTATION-CHECKER.git
git push -f origin gh-pages

echo "Deployment complete!"