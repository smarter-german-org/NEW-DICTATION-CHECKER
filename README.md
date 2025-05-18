# Dictation Checker

A beautiful and interactive tool for practicing dictation skills. Listen to audio clips and type what you hear to improve your listening and typing skills. Specially designed for integration with Teachable courses.

## Features

- Beautiful audio player with intuitive controls
- Dictation exercises with different difficulty levels
- Real-time word-by-word comparison of your input with the expected text
- Visual feedback on correct and incorrect words
- Mistake counter to track your progress
- Mobile-responsive design for all devices
- Complete Teachable integration system for multiple courses
- Support for VTT files to define dictation content and timing

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   or
   ```
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Integration with Teachable

This app has been specifically designed for integration with Teachable courses, allowing you to add dictation exercises to any lesson.

### Quick Teachable Integration Steps

1. Build the app for deployment:
   ```
   ./build-embedded.sh
   ```

2. Upload the `dist` folder to your WordPress site at `wp-content/uploads/dictation-app/`

3. Add this code to your Teachable lesson (HTML editor):
   ```html
   <div class="dictation-app-container" 
        data-course-id="1" 
        data-lesson-id="3" 
        data-audio-url="https://yoursite.com/wp-content/uploads/dictation-app/courses/course1/lesson3/audio.mp3"
        data-vtt-url="https://yoursite.com/wp-content/uploads/dictation-app/courses/course1/lesson3/audio.vtt">
   </div>
   
   <script src="https://yoursite.com/wp-content/uploads/dictation-app/teachable-integration.js"></script>
   ```

### Generate Teachable Code

Use the included utility to generate the exact code for each lesson:

```
node generate-teachable-code.js
```

### Complete Integration Guide

For detailed instructions on setting up all your courses and lessons, see the [Teachable Integration Guide](docs/TEACHABLE-INTEGRATION.md).

## Adding Custom Dictation Exercises

For local development, you can add exercises by modifying the `SAMPLE_EXERCISES` array in `src/components/DictationTool.jsx`:

```javascript
{
  id: 4,
  title: "Your Exercise Title",
  audio: "/path/to/audio/file.mp3",
  sentences: [
    { id: 0, text: "First sentence.", startTime: 0, endTime: 3.5 },
    { id: 1, text: "Second sentence.", startTime: 4, endTime: 7.2 },
  ]
}
```

For Teachable integration, use VTT files to define your dictation content and timing.

## License

This project is open source and available under the [MIT License](LICENSE). 