# Changelog

## [Unreleased]

### Added

- **Dark Theme Implementation**
  - Added dark theme with orange accents inspired by music player design
  - Implemented dark styling for all UI components including buttons, inputs, and containers
  - Applied consistent color scheme throughout the application
  - Created custom scrollbars with orange highlight on hover
  - Added subtle gradient effects to the container frame for better visual distinction

- **Playback Controls**
  - Added playback speed control with 3 states (100%, 75%, 50%)
  - Improved the design of audio player controls to match dark theme

### Fixed

- **Text Alignment and Display**
  - Improved vertical alignment of text in both display and input boxes
  - Set consistent line-height and vertical positioning for better text display
  - Fixed vertical centering using flex layout and proper alignment properties
  - Added consistent height and vertical spacing for text containers

- **Capitalization Checking**
  - Fixed issues with the "Aa" button not properly detecting capitalization errors
  - Enhanced capitalization checking for proper nouns like "Berlin"
  - Improved detection of sentence-initial words like "Es" requiring capitalization
  - Added special handling for proper nouns in text comparison algorithms

- **Placeholder Visibility**
  - Fixed issues with placeholder text not showing when starting the dictation tool
  - Preserved proper placeholder display throughout the exercise
  - Resolved duplication of placeholder text (showing twice in some states)
  - Fixed placeholder disappearance after height adjustments

- **CSS Improvements**
  - Maintained consistent input field height (`max-height: 35px`) for better visual alignment
  - Enhanced placeholder visibility rules with stronger CSS specificity
  - Implemented fallback methods for placeholder display using both native placeholder and ::after pseudo-element
  - Added rules to prevent conflicts between native textarea placeholder and CSS-based placeholder

- **Input Field Enhancements**
  - Improved focus handling to ensure placeholder visibility on exercise start
  - Added blur/focus cycle to force browsers to correctly display placeholders
  - Fixed placeholder text styling for better readability

- **Performance Optimizations** (Previous Work)
  - Implemented debouncing (100ms delay) for feedback rendering
  - Added memoization for expensive calculations like word alignment
  - Created caching system for word alignments to avoid redundant processing
  - Used useCallback for event handlers to prevent unnecessary re-renders

- **UI Improvements** (Previous Work)
  - Removed volume slider as it wasn't needed
  - Made speed button display percentages (100%, 75%, 50%) instead of decimals
  - Fixed issues with port management for the development server

- **UX Enhancements** (Previous Work)
  - Modified feedback display to show placeholders immediately after exercise start
  - Prevented audio from auto-playing when the exercise starts
  - Ensured consistent styling between feedback area and input field

### Technical Notes

- Multiple approaches were required to ensure placeholder visibility across different browsers
- Resolved CSS conflicts that were causing visibility issues
- Fixed several edge cases in placeholder rendering when using the exercise
- Optimized CSS for text display to ensure proper vertical alignment across different browsers
