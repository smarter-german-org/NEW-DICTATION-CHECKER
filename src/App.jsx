import React, { useState } from 'react';
import './App.css';
import DictationTool from './components/DictationTool';

function App() {
  // Default exercise ID - in the future this would be passed from Teachable
  const defaultExerciseId = 1;

  return (
    <div className="app">
      <main className="app-content">
        <DictationTool exerciseId={defaultExerciseId} />
      </main>
      
      <footer>
        <p>© {new Date().getFullYear()} Dictation Checker</p>
      </footer>
    </div>
  );
}

export default App; 