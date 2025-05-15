import { spawn } from 'child_process';
import path from 'path';

function startServer() {
  console.log('Starting Vite development server...');
  
  const vite = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });

  vite.on('close', (code) => {
    console.log(`Vite server exited with code ${code}`);
    console.log('Restarting server in 2 seconds...');
    setTimeout(startServer, 2000);
  });

  vite.on('error', (err) => {
    console.error('Failed to start Vite server:', err);
    console.log('Retrying in 2 seconds...');
    setTimeout(startServer, 2000);
  });
}

// Start the server
startServer();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nGracefully shutting down...');
  process.exit();
}); 