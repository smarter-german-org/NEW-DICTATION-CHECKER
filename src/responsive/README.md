# Mobile Responsiveness Module

This module provides a structured approach to adding mobile responsiveness to the Dictation Checker application without modifying the existing component code.

## Contents

- `useResponsive.js` - A custom React hook that detects device type and screen size
- `mobileStyles.css` - Mobile-specific CSS with media queries for different screen sizes
- `MobileWrapper.jsx` - A wrapper component that applies mobile optimizations
- `index.js` - Main entry point for importing all responsive components
- `integrationExample.js` - Examples of how to use the responsive components
- `AppIntegration.jsx` - Example of how to integrate at the App level

## How to Use

### 1. Basic Integration

For the simplest integration, just wrap your component with the `MobileWrapper`:

```jsx
import { MobileWrapper } from 'src/responsive';

// In your render method or component:
<MobileWrapper>
  <YourExistingComponent />
</MobileWrapper>
```

### 2. App-Level Integration

To apply mobile responsiveness throughout the application, add these imports to your `App.jsx`:

```jsx
import { MobileWrapper } from './responsive';
import './responsive/mobileStyles.css';

// Then in your App component:
return (
  <div className="app">
    <MobileWrapper>
      <DictationTool exerciseId={1} />
    </MobileWrapper>
  </div>
);
```

### 3. Component-Level Responsive Logic

For more fine-grained control, use the `useResponsive` hook directly in your components:

```jsx
import { useResponsive } from 'src/responsive';

const YourComponent = () => {
  const { isMobile, isTablet, isTouch } = useResponsive();
  
  return (
    <div className={isMobile ? 'mobile-view' : 'desktop-view'}>
      {isMobile ? (
        <SimplifiedMobileUI />
      ) : (
        <FullFeaturedDesktopUI />
      )}
    </div>
  );
};
```

## MobileWrapper Props

The `MobileWrapper` component accepts the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | string | `''` | Additional CSS classes to add to the wrapper |
| `enableTouch` | boolean | `true` | Enable touch-specific optimizations |
| `stackOnMobile` | boolean | `true` | Stack children vertically on mobile |
| `fullWidthOnMobile` | boolean | `true` | Make children full width on mobile |
| `hideOnMobile` | boolean | `false` | Hide the wrapped content on mobile devices |
| `touchTargets` | boolean | `false` | Increase size of buttons for better touch targets |

## CSS Classes

The `mobileStyles.css` file provides several utility classes:

- `.mobile-container` - Basic mobile container styling
- `.mobile-stack` - Stack children vertically
- `.mobile-full-width` - Make element take full width
- `.mobile-hidden` - Hide element on mobile
- `.mobile-touch-target` - Increase touch target size
- `.tablet-container` - Basic tablet container styling
- `.tablet-two-columns` - Two-column layout for tablets

## Breakpoints

The responsive breakpoints used in this module are:

- **Extra Small Phones**: <= 374px
- **Mobile Phones**: 375px - 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px - 1024px
- **Large Desktop**: > 1024px

The module also includes specific optimizations for:
- **Landscape orientation** on phones
- **Touch devices** (detected via feature detection)

## Integration with Dictation Checker

This module is designed to work with the existing Dictation Checker components without requiring changes to their core functionality. 

The mobile styles target the existing component class names (e.g., `.dictation-tool`, `.dictation-feedback`) via media queries, ensuring they adapt to different screen sizes while maintaining their current behavior.

## Touch Device Optimizations

For touch devices (mobile and tablets), the module automatically applies:

- Increased button sizes for better tap targets
- Touch-friendly scrolling with momentum
- Active state animations and color feedback for touch interactions
- Adjustments to prevent zooming on input fields (iOS)

## iPhone-Specific Optimizations

Based on testing with iPhone 13 and similar devices, the following optimizations have been added:

1. **Control Spacing**: Increased margin between audio control buttons for easier tapping
2. **Progress Bar**: Made the audio progress bar taller (8px) for easier manipulation
3. **Button Feedback**: Enhanced visual feedback on button presses with subtle color changes
4. **Text Size**: Enlarged dictation text for better readability
5. **Landscape Mode**: Added special layout for landscape orientation to maximize screen usage
6. **Very Small Screens**: Added breakpoint for devices under 375px with simplified interface

## Testing Tools

The module includes testing utilities to help with development:

- `responsiveTest.js` - A script that logs responsive information to the console
- `mobile-test.js` - A testing panel for simulating different devices 