# Dictation Checker

A beautiful and interactive tool for practicing dictation skills. Listen to audio clips and type what you hear to improve your listening and typing skills. Designed to be integrated with Teachable.

## Features

- Beautiful audio player with intuitive controls
- Dictation exercises with different difficulty levels
- Real-time word-by-word comparison of your input with the expected text
- Visual feedback on correct and incorrect words
- Mistake counter to track your progress
- Ready for Teachable integration

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

The DictationTool component is designed to receive an `exerciseId` prop that determines which exercise to display:

```jsx
<DictationTool exerciseId={1} />
```

For Teachable integration, this ID can be passed from your Teachable course to load specific exercises.

## Adding Custom Dictation Exercises

To add your own dictation exercises, modify the `SAMPLE_EXERCISES` array in `src/components/DictationTool.jsx`. Each exercise should have the following structure:

```javascript
{
  id: 4, // Unique ID to be passed from Teachable
  title: "Your Exercise Title",
  audio: "/path/to/audio/file.mp3", // Place audio files in the public/audio directory
  text: "The exact text of the dictation exercise",
  level: "Beginner" // Difficulty level
}
```

## License

This project is open source and available under the [MIT License](LICENSE). 