import React, { useState } from 'react';
import './App.css';
import DictationTool from './components/DictationTool';
import { ResponsiveProvider } from './responsive/ResponsiveContext';
import { MobileWrapper } from './components/mobile/MobileWrapper';

function App() {
  // Default exercise ID - in the future this would be passed from Teachable
  const defaultExerciseId = 1;
  const [selectedExerciseId, setSelectedExerciseId] = useState(defaultExerciseId);
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);

  return (
    <ResponsiveProvider>
      <div className="app">
        <main className="app-content">
          <MobileWrapper 
            exerciseId={selectedExerciseId} 
            onCancel={() => {
              console.log("Cancel handler from App component");
              // Add your app-level cancel logic here
              // For example, show the exercise selection screen
              setShowExerciseSelection(true);
            }}
          />
        </main>
      </div>
    </ResponsiveProvider>
  );
}

export default App;