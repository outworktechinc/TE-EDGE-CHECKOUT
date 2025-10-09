"use strict";
/**
 * Transaction Logging System
 * Provides comprehensive logging for payment operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.PaymentLogger = exports.LogLevel = void 0;
exports.enableDebugMode = enableDebugMode;
exports.disableLogging = disableLogging;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
/**
 * Payment Logger
 * Centralized logging for all payment operations
 */
class PaymentLogger {
    constructor(options = {}) {
        this.logs = [];
        this.logLevel = options.level ?? LogLevel.INFO;
        this.maxLogs = options.maxLogs ?? 100;
        this.enableConsole = options.enableConsole ?? true;
    }
    /**
     * Set logging level
     */
    setLogLevel(level) {
        this.logLevel = level;
    }
    /**
     * Alias for setLogLevel
     */
    setLevel(level) {
        this.setLogLevel(level);
    }
    /**
     * Get current log level
     */
    getLogLevel() {
        return this.logLevel;
    }
    /**
     * Log debug message
     */
    debug(message, data, gateway) {
        this.log(LogLevel.DEBUG, message, data, gateway);
    }
    /**
     * Log info message
     */
    info(message, data, gateway) {
        this.log(LogLevel.INFO, message, data, gateway);
    }
    /**
     * Log warning message
     */
    warn(message, data, gateway) {
        this.log(LogLevel.WARN, message, data, gateway);
    }
    /**
     * Log error message
     */
    error(message, error, gateway) {
        this.log(LogLevel.ERROR, message, error, gateway, error instanceof Error ? error : undefined);
    }
    /**
     * Internal log method
     */
    log(level, message, data, gateway, error) {
        // Check if this log level should be recorded
        if (level < this.logLevel) {
            return;
        }
        const entry = {
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
    outputToConsole(entry) {
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
    sanitizeData(data) {
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
            const sanitized = Array.isArray(data) ? [] : {};
            for (const key in data) {
                if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                    // Mask sensitive data
                    if (typeof data[key] === 'string') {
                        const value = data[key];
                        if (key.toLowerCase().includes('card') || key.toLowerCase().includes('number')) {
                            // Show last 4 digits only
                            sanitized[key] = value.length > 4 ? `****${value.slice(-4)}` : '****';
                        }
                        else {
                            sanitized[key] = '***REDACTED***';
                        }
                    }
                    else {
                        sanitized[key] = '***REDACTED***';
                    }
                }
                else {
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
    getLogs(level) {
        if (level !== undefined) {
            return this.logs.filter(log => log.level === level);
        }
        return [...this.logs];
    }
    /**
     * Get logs for specific gateway
     */
    getLogsByGateway(gateway) {
        return this.logs.filter(log => log.gateway === gateway);
    }
    /**
     * Get recent logs (last N entries)
     */
    getRecentLogs(count) {
        return this.logs.slice(-count);
    }
    /**
     * Clear all logs
     */
    clearLogs() {
        this.logs = [];
    }
    /**
     * Export logs as JSON string
     */
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
    /**
     * Export logs as CSV
     */
    exportLogsAsCSV() {
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
    getStats() {
        const stats = {
            total: this.logs.length,
            byLevel: {},
            byGateway: {}
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
exports.PaymentLogger = PaymentLogger;
/**
 * Global logger instance
 */
exports.logger = new PaymentLogger({
    level: LogLevel.INFO,
    maxLogs: 100,
    enableConsole: true
});
/**
 * Enable debug mode
 */
function enableDebugMode() {
    exports.logger.setLogLevel(LogLevel.DEBUG);
    exports.logger.info('Debug mode enabled');
}
/**
 * Disable logging
 */
function disableLogging() {
    exports.logger.setLogLevel(LogLevel.NONE);
}
