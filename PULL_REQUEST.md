# Update Teachable Embed Generator

## Changes
1. Updated the default integration script URL in the Teachable embed generator to point to GitHub Pages
2. Updated the descriptions and placeholders to clarify that the GitHub Pages URL should be used

## Testing
- Created a test HTML file (`teachable-test.html`) to simulate Teachable integration
- Verified that the integration script's auto-detection and fallback to GitHub Pages work correctly

## Benefits
- Users will now have the correct GitHub Pages integration URL pre-filled by default
- This ensures the modern React UI will be used instead of the simplified version
- Clear instructions provided in the UI to prefer the GitHub Pages URL unless a custom deployment exists

## Next Steps
Once merged, users should:
1. Test the integration in actual Teachable courses using the new embed code
2. Verify that audio plays correctly in the React UI
3. Verify that the dictation functionality works as expected
