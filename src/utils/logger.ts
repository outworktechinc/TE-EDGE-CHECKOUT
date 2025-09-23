/**
 * Universal Payment Logger
 * Standardized logging across the package
 */

import { Logger } from '../core/types';
import { sanitizeErrorForLogging } from '../core/errors';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  gateway?: string;
  metadata?: any;
}

/**
 * Payment Logger Implementation
 */
export class PaymentLogger implements Logger {
  private level: LogLevel;
  private enabledInProduction: boolean;

  constructor(level: LogLevel = 'info', enabledInProduction: boolean = false) {
    this.level = level;
    this.enabledInProduction = enabledInProduction;
  }

  private shouldLog(level: LogLevel): boolean {
    // Don't log in production unless explicitly enabled
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !this.enabledInProduction) {
      return false;
    }

    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    const currentLevelIndex = levels.indexOf(this.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex <= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [PAYMENTS] [${level.toUpperCase()}]`;

    if (meta) {
      return `${prefix} ${message} ${JSON.stringify(this.sanitizeMeta(meta), null, 2)}`;
    }

    return `${prefix} ${message}`;
  }

  private sanitizeMeta(meta: any): any {
    if (!meta) return meta;

    // Remove sensitive information
    const sanitized = { ...meta };

    // Common sensitive fields to remove/mask
    const sensitiveFields = [
      'cardNumber', 'cvv', 'cvc', 'ssn', 'password', 'token', 'key', 'secret',
      'apiKey', 'clientSecret', 'privateKey', 'authToken'
    ];

    const sanitizeObject = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) return obj;

      const result: any = {};

      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        if (sensitiveFields.some(field => lowerKey.includes(field.toLowerCase()))) {
          result[key] = '***REDACTED***';
        } else if (typeof value === 'object') {
          result[key] = sanitizeObject(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return sanitizeObject(sanitized);
  }

  error(message: string, meta?: any): void {
    if (!this.shouldLog('error')) return;

    const formattedMessage = this.formatMessage('error', message, meta);
    console.error(formattedMessage);

    // Send to external logging service if configured
    this.sendToExternalLogger('error', message, meta);
  }

  warn(message: string, meta?: any): void {
    if (!this.shouldLog('warn')) return;

    const formattedMessage = this.formatMessage('warn', message, meta);
    console.warn(formattedMessage);

    this.sendToExternalLogger('warn', message, meta);
  }

  info(message: string, meta?: any): void {
    if (!this.shouldLog('info')) return;

    const formattedMessage = this.formatMessage('info', message, meta);
    console.info(formattedMessage);

    this.sendToExternalLogger('info', message, meta);
  }

  debug(message: string, meta?: any): void {
    if (!this.shouldLog('debug')) return;

    const formattedMessage = this.formatMessage('debug', message, meta);
    console.debug(formattedMessage);

    this.sendToExternalLogger('debug', message, meta);
  }

  private sendToExternalLogger(level: LogLevel, message: string, meta?: any): void {
    // Hook for external logging services (e.g., Sentry, LogRocket, etc.)
    // This can be configured by the consuming application

    if (typeof window !== 'undefined' && (window as any).__PAYMENT_LOGGER_HOOK__) {
      try {
        (window as any).__PAYMENT_LOGGER_HOOK__({
          level,
          message,
          meta: this.sanitizeMeta(meta),
          timestamp: new Date(),
          source: 'universal-payments'
        });
      } catch (error) {
        // Silently fail if external logger throws
      }
    }
  }
}

/**
 * Default logger instance
 */
export const logger = new PaymentLogger(
  (process.env.NODE_ENV === 'development' ? 'debug' : 'error') as LogLevel,
  false
);

/**
 * Create a scoped logger for specific gateways
 */
export function createGatewayLogger(gateway: string, level?: LogLevel): Logger {
  const gatewayLogger = new PaymentLogger(level || logger.level);

  return {
    error: (message: string, meta?: any) => gatewayLogger.error(message, { gateway, ...meta }),
    warn: (message: string, meta?: any) => gatewayLogger.warn(message, { gateway, ...meta }),
    info: (message: string, meta?: any) => gatewayLogger.info(message, { gateway, ...meta }),
    debug: (message: string, meta?: any) => gatewayLogger.debug(message, { gateway, ...meta })
  };
}