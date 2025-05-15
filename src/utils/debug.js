/**
 * Debug utility for conditional logging
 */

export const DEBUG_MODE = process.env.NODE_ENV !== 'production';

/**
 * Conditionally log messages based on environment
 * @param {string} tag - Category tag for the log
 * @param {...any} args - Arguments to log
 */
export function debug(tag, ...args) {
  if (DEBUG_MODE) {
    console.log(`[${tag}]`, ...args);
  }
}

/**
 * Log errors regardless of environment
 * @param {string} tag - Category tag for the error
 * @param {...any} args - Arguments to log
 */
export function error(tag, ...args) {
  console.error(`[${tag}]`, ...args);
} 