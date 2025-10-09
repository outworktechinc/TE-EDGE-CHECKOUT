/**
 * Transaction Logging System
 * Provides comprehensive logging for payment operations
 */
import { GatewayName } from '../types';
export declare enum LogLevel {
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
export declare class PaymentLogger {
    private logs;
    private logLevel;
    private maxLogs;
    private enableConsole;
    constructor(options?: LoggerOptions);
    /**
     * Set logging level
     */
    setLogLevel(level: LogLevel): void;
    /**
     * Alias for setLogLevel
     */
    setLevel(level: LogLevel): void;
    /**
     * Get current log level
     */
    getLogLevel(): LogLevel;
    /**
     * Log debug message
     */
    debug(message: string, data?: any, gateway?: GatewayName): void;
    /**
     * Log info message
     */
    info(message: string, data?: any, gateway?: GatewayName): void;
    /**
     * Log warning message
     */
    warn(message: string, data?: any, gateway?: GatewayName): void;
    /**
     * Log error message
     */
    error(message: string, error?: Error | any, gateway?: GatewayName): void;
    /**
     * Internal log method
     */
    private log;
    /**
     * Output log entry to console
     */
    private outputToConsole;
    /**
     * Sanitize sensitive data before logging
     */
    private sanitizeData;
    /**
     * Get all logs
     */
    getLogs(level?: LogLevel): LogEntry[];
    /**
     * Get logs for specific gateway
     */
    getLogsByGateway(gateway: GatewayName): LogEntry[];
    /**
     * Get recent logs (last N entries)
     */
    getRecentLogs(count: number): LogEntry[];
    /**
     * Clear all logs
     */
    clearLogs(): void;
    /**
     * Export logs as JSON string
     */
    exportLogs(): string;
    /**
     * Export logs as CSV
     */
    exportLogsAsCSV(): string;
    /**
     * Get log statistics
     */
    getStats(): {
        total: number;
        byLevel: Record<string, number>;
        byGateway: Record<string, number>;
    };
}
/**
 * Global logger instance
 */
export declare const logger: PaymentLogger;
/**
 * Enable debug mode
 */
export declare function enableDebugMode(): void;
/**
 * Disable logging
 */
export declare function disableLogging(): void;
//# sourceMappingURL=logger.d.ts.map