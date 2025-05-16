/**
 * Mobile Testing Utility
 * 
 * This script can be included in the HTML for testing mobile responsiveness
 * during development.
 * 
 * It adds a small control panel to toggle between different device sizes
 * and simulate touch events.
 */

(function() {
  // Only run in development to avoid affecting production
  if (window.location.hostname !== 'localhost' && 
      !window.location.hostname.includes('127.0.0.1')) {
    return;
  }

  // Create device presets
  const devicePresets = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12/13', width: 390, height: 844 },
    { name: 'iPhone 12/13 Pro Max', width: 428, height: 926 },
    { name: 'Samsung Galaxy S20', width: 360, height: 800 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'Desktop', width: 1440, height: 900 }
  ];

  // Create control panel
  const createMobileTestPanel = () => {
    const panel = document.createElement('div');
    panel.id = 'mobile-test-panel';
    panel.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: sans-serif;
      font-size: 12px;
      z-index: 9999;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      transition: all 0.3s ease;
    `;

    // Create title
    const title = document.createElement('div');
    title.textContent = 'Mobile Testing';
    title.style.cssText = `
      font-weight: bold;
      margin-bottom: 8px;
      text-align: center;
    `;
    panel.appendChild(title);

    // Create device selector
    devicePresets.forEach(device => {
      const button = document.createElement('button');
      button.textContent = `${device.name} (${device.width}x${device.height})`;
      button.style.cssText = `
        display: block;
        width: 100%;
        margin: 5px 0;
        padding: 5px;
        background: #444;
        border: none;
        color: white;
        border-radius: 3px;
        cursor: pointer;
      `;
      button.onclick = () => {
        // Resize the window to simulate the device
        window.resizeTo(device.width, device.height);
        
        // Log to console
        console.log(`Resized to ${device.name}: ${device.width}x${device.height}`);
        
        // Refresh the page to ensure all responsive logic is applied
        window.location.reload();
      };
      panel.appendChild(button);
    });

    // Add toggle for touch simulation
    const touchToggle = document.createElement('button');
    touchToggle.textContent = 'Toggle Touch Simulation';
    touchToggle.style.cssText = `
      display: block;
      width: 100%;
      margin: 10px 0 5px;
      padding: 5px;
      background: #555;
      border: none;
      color: white;
      border-radius: 3px;
      cursor: pointer;
    `;
    touchToggle.onclick = () => {
      // Toggle a class on the body to simulate touch device
      document.body.classList.toggle('simulated-touch-device');
      
      // Update meta tag to help with detection
      let meta = document.querySelector('meta[name="touch-simulation"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'touch-simulation';
        document.head.appendChild(meta);
      }
      
      const isSimulating = document.body.classList.contains('simulated-touch-device');
      meta.content = isSimulating ? 'enabled' : 'disabled';
      
      // Log to console
      console.log(`Touch simulation ${isSimulating ? 'enabled' : 'disabled'}`);
      
      // Update button text
      touchToggle.textContent = `Touch Simulation: ${isSimulating ? 'ON' : 'OFF'}`;
    };
    panel.appendChild(touchToggle);

    // Add close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
      display: block;
      width: 100%;
      margin: 5px 0;
      padding: 5px;
      background: #666;
      border: none;
      color: white;
      border-radius: 3px;
      cursor: pointer;
    `;
    closeButton.onclick = () => {
      panel.remove();
    };
    panel.appendChild(closeButton);

    return panel;
  };

  // Add panel to the document when it's ready
  window.addEventListener('DOMContentLoaded', () => {
    const panel = createMobileTestPanel();
    document.body.appendChild(panel);
    
    // Log helpful information
    console.log('Mobile Test Panel added. Use it to resize the viewport and test responsiveness.');
    console.log('Current window size:', {
      width: window.innerWidth,
      height: window.innerHeight
    });
  });
})(); 