/**
 * Responsive module entry point
 * 
 * This file exports all the responsive components and utilities from a single entry point
 * to make imports cleaner in other files
 */

import MobileWrapper from './MobileWrapper';
import useResponsive from './useResponsive';
import './mobileStyles.css';

export {
  MobileWrapper,
  useResponsive
};

// For default import
export default {
  MobileWrapper,
  useResponsive
}; 