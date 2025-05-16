/**
 * Responsive module entry point
 * 
 * This file exports all the responsive components and utilities from a single entry point
 * to make imports cleaner in other files
 */

import MobileWrapper from './MobileWrapper';
import useResponsive from './useResponsive';
import withMobileGestures from './withMobileGestures';
import MobileGestureInput from './MobileGestureInput';
import AppIntegration from './AppIntegration';
import MobileDictationAdapter from './MobileDictationAdapter';
import './mobileStyles.css';

export {
  MobileWrapper,
  useResponsive,
  withMobileGestures,
  MobileGestureInput,
  AppIntegration,
  MobileDictationAdapter
};

// For default import
export default {
  MobileWrapper,
  useResponsive,
  withMobileGestures,
  MobileGestureInput,
  AppIntegration,
  MobileDictationAdapter
}; 