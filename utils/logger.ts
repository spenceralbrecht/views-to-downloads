/**
 * Logger utility for Views to Downloads using debug library
 * 
 * Usage:
 * - Import the logger: import { createLogger } from '@/utils/logger'
 * - Create a namespaced logger: const log = createLogger('module-name')
 * - Use it: log.debug('message'), log.info('message'), etc.
 * 
 * Environment configuration:
 * - Development: Only shows info, warn, error by default
 * - Production: Set DEBUG=app:* in Vercel environment variables to enable all logs
 *   or DEBUG=app:module-name:* to enable logs for specific modules
 */

import debug from 'debug';

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Creates a logger instance for a specific module
 * @param module Name of the module using the logger
 * @returns Logger object with methods for different log levels
 */
export function createLogger(module: string) {
  // Format the module name for consistent logging
  const namespace = `app:${module}`;
  
  // Create debug instances for each log level
  const debugLogger = debug(`${namespace}:debug`);
  const infoLogger = debug(`${namespace}:info`);
  const warnLogger = debug(`${namespace}:warn`);
  const errorLogger = debug(`${namespace}:error`);
  
  // Set colors for better visibility
  debugLogger.color = '#8a8a8a';
  infoLogger.color = '#0070f3';
  warnLogger.color = '#f5a623';
  errorLogger.color = '#ee0000';
  
  // Enable info, warn, and error logs by default
  if (process.env.NODE_ENV !== 'production') {
    debug.enable(`app:*:info,app:*:warn,app:*:error`);
  }
  
  // Return the logger object
  return {
    debug: (...args: any[]) => debugLogger(`🔍 %s`, ...args),
    info: (...args: any[]) => infoLogger(`ℹ️ %s`, ...args),
    warn: (...args: any[]) => warnLogger(`⚠️ %s`, ...args),
    error: (...args: any[]) => errorLogger(`❌ %s`, ...args)
  };
}

// Export a default logger for quick access
export const logger = createLogger('app');
