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
  // Function disabled - no longer showing the testing guide button
  return;
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
