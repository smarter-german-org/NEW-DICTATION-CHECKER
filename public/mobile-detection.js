// Helper functions to detect mobile devices
function isMobileDevice() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
}

// Check viewport size
function isMobileViewport() {
  return window.innerWidth <= 768;
}

// Combined check
function isMobile() {
  return isMobileDevice() || isMobileViewport();
}

// Function to check if this is a desktop user and show the test guide
function showTestingGuideIfDesktop() {
  // Only show on desktop and if we're at the root path
  if (!isMobile() && window.location.pathname === '/') {
    const desktopPath = window.location.pathname + (window.location.pathname.endsWith('/') ? '' : '/') + 'mobile-testing.html';
    
    // Check if the user wants to see the app directly
    if (!window.location.search.includes('direct=true')) {
      // Store that we've shown the guide
      localStorage.setItem('mobile_guide_shown', 'true');
      
      // Display a notice with a link to the testing guide
      const notice = document.createElement('div');
      notice.style.position = 'fixed';
      notice.style.bottom = '20px';
      notice.style.right = '20px';
      notice.style.backgroundColor = '#FF5500';
      notice.style.color = 'white';
      notice.style.padding = '10px 15px';
      notice.style.borderRadius = '5px';
      notice.style.fontFamily = 'sans-serif';
      notice.style.zIndex = '9999';
      notice.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      notice.innerHTML = `
        <p>Testing on mobile? <a href="mobile-testing.html" style="color:white;font-weight:bold;">View testing guide</a></p>
        <button id="close-notice" style="background:none;border:none;color:white;cursor:pointer;float:right;margin-top:-25px;">✕</button>
      `;
      
      document.body.appendChild(notice);
      
      // Add close functionality
      document.getElementById('close-notice').addEventListener('click', function() {
        notice.style.display = 'none';
      });
    }
  }
}

// Run the check after a slight delay to ensure DOM is ready
window.addEventListener('DOMContentLoaded', function() {
  setTimeout(showTestingGuideIfDesktop, 1500);
});

// Expose functions globally
window.mobileDetection = {
  isMobileDevice,
  isMobileViewport,
  isMobile,
  showTestingGuideIfDesktop
};
