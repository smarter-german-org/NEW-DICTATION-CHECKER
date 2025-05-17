import React from 'react';
import './App.css';
import DictationTool from './components/DictationTool';
import { ResponsiveProvider } from './responsive/ResponsiveContext';
import { MobileWrapper } from './components/mobile/MobileWrapper';

function App() {
  // Default exercise ID - in the future this would be passed from Teachable
  const defaultExerciseId = 1;
  
  return (
    <ResponsiveProvider>
      <div className="app">
        <main className="app-content">
          <MobileWrapper exerciseId={defaultExerciseId} />
        </main>
      </div>
    </ResponsiveProvider>
  );
}

export default App; 