# Mobile Implementation for Dictation Checker

This directory contains the mobile-specific implementation of the Dictation Checker application.

## Architecture

The mobile implementation consists of:

1. **Responsive Detection**
   - `ResponsiveContext.jsx` - Context provider that detects mobile devices using CSS media queries
   - `mobile-detection.js` - Client-side detection of mobile devices and viewport sizes

2. **Mobile Components**
   - `MobileWrapper.jsx` - Entry point that conditionally renders either mobile or desktop UI
   - `MobileDictationTool.jsx` - Mobile-specific version of the dictation tool
   - `MobileAudioPlayer.jsx` - Simplified audio player with essential controls
   - `MobileStartButton.jsx` - Mobile-optimized start button
   - `MobileGestureHandler.jsx` - Swipe gesture detection for navigation

3. **Mobile Styling**
   - `MobileAudioPlayer.css` - Styling for the audio player
   - `MobileDictationTool.css` - Styling for the dictation tool
   - `MobileFeedback.css` - Mobile-specific styles for the feedback screen
   - `MobileInputArea.css` - Touch-optimized input area styling
   - `MobileStartButton.css` - Styling for the start button

## Features

1. **Simplified Controls**
   - Only essential buttons: play/pause, speed control, and cancel (X)
   - No keyboard shortcuts panel

2. **Touch Optimization**
   - Larger touch targets
   - Touch-friendly input area
   - Mobile viewport meta tags

3. **Gesture Navigation**
   - Swipe left: Go to next sentence
   - Swipe right: Go to previous sentence
   - Swipe up: Repeat current sentence
   - Swipe down: Cycle through playback speeds

4. **Testing Tools**
   - `mobile-testing.html` - Guide for testing on mobile devices
   - Local network access via Vite config (`host: '0.0.0.0'`)

## How to Test

1. Start the development server: `npm run dev`
2. Access the testing guide at `http://localhost:5173/mobile-testing.html`
3. Connect a mobile device to the same network and use the displayed URL
4. Or, resize your browser window to trigger mobile responsive mode (width <= 768px)

## Implementation Notes

- The mobile implementation minimizes UI elements while maintaining core functionality
- All modifications conditionally apply only to mobile devices, preserving the desktop experience
- Swipe gestures supplement button controls for more natural mobile interaction
