const { exec } = require('child_process');

// Kill any existing Vite processes
exec('pkill -f vite', (error) => {
  if (error) {
    console.log('No existing Vite processes found');
  } else {
    console.log('Killed all Vite processes');
  }
  
  // Start the development server
  const vite = exec('npm run dev');
  
  vite.stdout.on('data', (data) => {
    console.log(data);
  });
  
  vite.stderr.on('data', (data) => {
    console.error(data);
  });
}); 