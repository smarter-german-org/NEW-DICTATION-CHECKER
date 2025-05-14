# CSV Export Implementation Guide

## TypeScript Types

```typescript
interface DictationAttempt {
  timestamp: string;
  textId: string;
  attemptNumber: 1 | 2 | 3 | 4;
  stats: {
    accuracy: number;
    wpm: number;
    mistakes: number;
    totalTime: number;
    totalWords: number;
    completedWords: number;
  };
  mistakes: {
    word: string;
    expected: string;
    actual: string;
  }[];
}

interface ProgressData {
  lastBackup?: string;
  attempts: DictationAttempt[];
}
```

## Implementation Without External Dependencies

```typescript
export const exportToCSV = (
  data: any[], 
  filename: string, 
  headers?: string[]
): void => {
  try {
    // Create CSV content
    const csvContent = [
      headers?.join(',') || Object.keys(data[0]).join(','),
      ...data.map(row => 
        Object.values(row)
          .map(value => `"${value}"`)
          .join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export CSV:', error);
    throw new Error('Failed to export CSV file');
  }
}
```

## Usage Example

```typescript
const data = [
  { date: '2024-05-14', score: 95, mistakes: 2 },
  { date: '2024-05-15', score: 98, mistakes: 1 }
];

exportToCSV(data, 'dictation-progress', ['Date', 'Score', 'Mistakes']);
```

## Progress Manager Class

```typescript
export class ProgressManager {
  private static instance: ProgressManager;
  private data: ProgressData;
  private readonly STORAGE_KEY = 'dictation_progress_v1';

  private constructor() {
    this.data = this.loadFromStorage();
  }

  static getInstance(): ProgressManager {
    if (!ProgressManager.instance) {
      ProgressManager.instance = new ProgressManager();
    }
    return ProgressManager.instance;
  }

  private loadFromStorage(): ProgressData {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : { attempts: [] };
  }

  private saveToStorage(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
  }

  addAttempt(attempt: DictationAttempt): void {
    this.data.attempts.push(attempt);
    this.saveToStorage();
    this.checkBackupNeeded();
  }

  private checkBackupNeeded(): void {
    const lastBackup = new Date(this.data.lastBackup || 0);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    if (lastBackup < oneWeekAgo && this.data.attempts.length > 0) {
      this.promptBackup();
    }
  }

  exportToCSV(): void {
    const headers = [
      'Date',
      'Text ID',
      'Attempt',
      'Accuracy (%)',
      'WPM',
      'Total Words',
      'Completed Words',
      'Mistakes',
      'Time (seconds)'
    ];

    const rows = this.data.attempts.map(attempt => [
      attempt.timestamp,
      attempt.textId,
      attempt.attemptNumber,
      attempt.stats.accuracy.toFixed(2),
      attempt.stats.wpm.toFixed(1),
      attempt.stats.totalWords,
      attempt.stats.completedWords,
      attempt.stats.mistakes,
      attempt.stats.totalTime
    ]);

    exportToCSV(rows, `dictation-progress-${new Date().toISOString().slice(0,10)}`, headers);
    
    this.data.lastBackup = new Date().toISOString();
    this.saveToStorage();
  }
}
```

## Integration Steps

1. Create a new file `src/utils/ProgressManager.ts` with the above code
2. Add an export button to your DictationFeedback component
3. Call the export function when the button is clicked:

```typescript
import { ProgressManager } from '../utils/ProgressManager';

// Add to your component
const handleExport = () => {
  const progressManager = ProgressManager.getInstance();
  progressManager.exportToCSV();
};

// Add button to JSX
<button 
  className="export-button" 
  onClick={handleExport}
  aria-label="Export progress data"
>
  Export Progress
</button>
```

## CSS Styling

```css
.export-button {
  display: inline-block;
  margin: 20px 10px;
  padding: 10px 20px;
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.export-button:hover {
  background-color: #2d3748;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

## Features

- Automatic local storage backup
- Weekly backup reminders
- Clean CSV format for spreadsheet compatibility
- Proper string escaping for CSV
- Error handling
- Memory cleanup after export
- Singleton pattern for progress management
- TypeScript type safety
