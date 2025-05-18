import React, { useState, useEffect } from 'react';
import './App.css';
import DictationTool from './components/DictationTool';
import { ResponsiveProvider } from './responsive/ResponsiveContext';
import { MobileWrapper } from './components/mobile/MobileWrapper';
import { getEmbeddedResources, loadDictationFromVtt } from './utils/embeddedLoader';
import { debug } from './utils/debug';

function App() {
  // Default exercise ID - in the future this would be passed from Teachable
  const defaultExerciseId = 1;
  const [selectedExerciseId, setSelectedExerciseId] = useState(defaultExerciseId);
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [embeddedExercise, setEmbeddedExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Check if we're in embedded mode and load resources
  useEffect(() => {
    const resources = getEmbeddedResources();
    
    if (resources.isEmbedded) {
      setIsLoading(true);
      
      loadDictationFromVtt(resources.vttUrl)
        .then(exercise => {
          debug('EMBEDDED_EXERCISE', exercise);
          setEmbeddedExercise(exercise);
          setError(null);
        })
        .catch(err => {
          console.error('Error loading embedded exercise:', err);
          setError('Failed to load dictation exercise. Please check your connection and try again.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  return (
    <ResponsiveProvider>
      <div className="app">
        <main className="app-content">
          {isLoading ? (
            <div className="loading">Loading dictation exercise...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <MobileWrapper 
              exerciseId={selectedExerciseId}
              embeddedExercise={embeddedExercise}
              onCancel={() => {
                console.log("Cancel handler from App component");
                // Add your app-level cancel logic here
                // For example, show the exercise selection screen
                setShowExerciseSelection(true);
              }}
            />
          )}
        </main>
      </div>
    </ResponsiveProvider>
  );
}

export default App;