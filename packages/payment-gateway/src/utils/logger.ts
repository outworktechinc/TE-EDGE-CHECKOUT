/**
 * Transaction Logging System
 * Provides comprehensive logging for payment operations
 */

import { GatewayName } from '../types';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  gateway?: GatewayName;
  data?: any;
  error?: Error;
}

export interface LoggerOptions {
  level?: LogLevel;
  maxLogs?: number;
  enableConsole?: boolean;
}

/**
 * Payment Logger
 * Centralized logging for all payment operations
 */
export class PaymentLogger {
  private logs: LogEntry[] = [];
  private logLevel: LogLevel;
  private maxLogs: number;
  private enableConsole: boolean;

  constructor(options: LoggerOptions = {}) {
    this.logLevel = options.level ?? LogLevel.INFO;
    this.maxLogs = options.maxLogs ?? 100;
    this.enableConsole = options.enableConsole ?? true;
  }

  /**
   * Set logging level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Alias for setLogLevel
   */
  setLevel(level: LogLevel): void {
    this.setLogLevel(level);
  }

  /**
   * Get current log level
   */
  getLogLevel(): LogLevel {
    return this.logLevel;
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: any, gateway?: GatewayName): void {
    this.log(LogLevel.DEBUG, message, data, gateway);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any, gateway?: GatewayName): void {
    this.log(LogLevel.INFO, message, data, gateway);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any, gateway?: GatewayName): void {
    this.log(LogLevel.WARN, message, data, gateway);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, gateway?: GatewayName): void {
    this.log(LogLevel.ERROR, message, error, gateway, error instanceof Error ? error : undefined);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    data?: any,
    gateway?: GatewayName,
    error?: Error
  ): void {
    // Check if this log level should be recorded
    if (level < this.logLevel) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      gateway,
      data: this.sanitizeData(data),
      error
    };

    // Add to logs array
    this.logs.push(entry);

    // Maintain max logs limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output
    if (this.enableConsole) {
      this.outputToConsole(entry);
    }
  }

  /**
   * Output log entry to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelStr = LogLevel[entry.level];
    const prefix = entry.gateway ? `[${entry.gateway}]` : '[Payment]';
    const timestamp = entry.timestamp.toISOString();

    const formattedMessage = `${timestamp} ${prefix} [${levelStr}] ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.data || '');
        break;
      case LogLevel.INFO:
        console.log(formattedMessage, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.error || entry.data || '');
        break;
    }
  }

  /**
   * Sanitize sensitive data before logging
   */
  private sanitizeData(data: any): any {
    if (!data) {
      return data;
    }

    // Don't log sensitive fields
    const sensitiveFields = [
      'cardNumber',
      'number',
      'cvc',
      'cvv',
      'cardCode',
      'password',
      'secret',
      'token',
      'apiKey',
      'clientKey'
    ];

    if (typeof data === 'object') {
      const sanitized: any = Array.isArray(data) ? [] : {};

      for (const key in data) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          // Mask sensitive data
          if (typeof data[key] === 'string') {
            const value = data[key] as string;
            if (key.toLowerCase().includes('card') || key.toLowerCase().includes('number')) {
              // Show last 4 digits only
              sanitized[key] = value.length > 4 ? `****${value.slice(-4)}` : '****';
            } else {
              sanitized[key] = '***REDACTED***';
            }
          } else {
            sanitized[key] = '***REDACTED***';
          }
        } else {
          sanitized[key] = this.sanitizeData(data[key]);
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Get all logs
   */
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  /**
   * Get logs for specific gateway
   */
  getLogsByGateway(gateway: GatewayName): LogEntry[] {
    return this.logs.filter(log => log.gateway === gateway);
  }

  /**
   * Get recent logs (last N entries)
   */
  getRecentLogs(count: number): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Export logs as JSON string
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Export logs as CSV
   */
  exportLogsAsCSV(): string {
    const headers = ['Timestamp', 'Level', 'Gateway', 'Message', 'Data'];
    const rows = this.logs.map(log => [
      log.timestamp.toISOString(),
      LogLevel[log.level],
      log.gateway || '',
      log.message,
      log.data ? JSON.stringify(log.data) : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  /**
   * Get log statistics
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byGateway: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byGateway: {} as Record<string, number>
    };

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;

      if (log.gateway) {
        stats.byGateway[log.gateway] = (stats.byGateway[log.gateway] || 0) + 1;
      }
    });

    return stats;
  }
}

/**
 * Global logger instance
 */
export const logger = new PaymentLogger({
  level: LogLevel.INFO,
  maxLogs: 100,
  enableConsole: true
});

/**
 * Enable debug mode
 */
export function enableDebugMode(): void {
  logger.setLogLevel(LogLevel.DEBUG);
  logger.info('Debug mode enabled');
}

/**
 * Disable logging
 */
export function disableLogging(): void {
  logger.setLogLevel(LogLevel.NONE);
}
