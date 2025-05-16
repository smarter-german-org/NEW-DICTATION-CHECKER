import React, { useEffect } from 'react';
import './App.css';
import { AppIntegration } from './responsive';
import './responsive/mobileStyles.css';

function App() {
  // Default exercise ID - in the future this would be passed from Teachable
  const defaultExerciseId = 1;

  return (
    <div className="app">
      <main className="app-content">
        <AppIntegration exerciseId={defaultExerciseId} />
      </main>
    </div>
  );
}

export default App; 