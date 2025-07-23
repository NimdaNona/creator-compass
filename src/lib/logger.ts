import { headers } from 'next/headers';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

// Log context interface
interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  action?: string;
  metadata?: Record<string, any>;
  error?: Error | unknown;
  stackTrace?: string;
}

// Structured log entry
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  environment: string;
  version?: string;
}

class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatLogEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    // Extract error details if present
    if (context.error) {
      const error = context.error as any;
      context.stackTrace = error.stack || 'No stack trace available';
      
      // Add error-specific metadata
      if (!context.metadata) context.metadata = {};
      context.metadata.errorName = error.name || 'UnknownError';
      context.metadata.errorMessage = error.message || 'No error message';
      
      // Extract additional error properties
      if (error.code) context.metadata.errorCode = error.code;
      if (error.statusCode) context.metadata.statusCode = error.statusCode;
      if (error.response) {
        context.metadata.responseStatus = error.response.status;
        context.metadata.responseData = error.response.data;
      }
    }

    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      environment: process.env.NODE_ENV || 'unknown',
      version: process.env.NEXT_PUBLIC_APP_VERSION
    };
  }

  private output(entry: LogEntry): void {
    // In production, use structured JSON logging for better Vercel log parsing
    if (!this.isDevelopment) {
      console.log(JSON.stringify(entry));
      return;
    }

    // In development, use colored console output
    const colors = {
      [LogLevel.DEBUG]: '\x1b[36m', // Cyan
      [LogLevel.INFO]: '\x1b[32m',  // Green
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.FATAL]: '\x1b[35m'  // Magenta
    };

    const color = colors[entry.level];
    const reset = '\x1b[0m';

    console.log(`${color}[${entry.level}]${reset} ${entry.timestamp} - ${entry.message}`);
    
    if (Object.keys(entry.context).length > 0) {
      console.log('Context:', JSON.stringify(entry.context, null, 2));
    }
  }

  // Public logging methods
  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.output(this.formatLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.output(this.formatLogEntry(LogLevel.INFO, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.output(this.formatLogEntry(LogLevel.WARN, message, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const fullContext = { ...context, error };
      this.output(this.formatLogEntry(LogLevel.ERROR, message, fullContext));
    }
  }

  fatal(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog(LogLevel.FATAL)) {
      const fullContext = { ...context, error };
      this.output(this.formatLogEntry(LogLevel.FATAL, message, fullContext));
      
      // In production, you might want to send this to an external service
      if (!this.isDevelopment) {
        // TODO: Send to error tracking service (e.g., Sentry)
      }
    }
  }

  // API-specific logging helpers
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API Request: ${method} ${path}`, {
      ...context,
      action: 'api_request',
      metadata: {
        ...context?.metadata,
        method,
        path,
        timestamp: Date.now()
      }
    });
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number, context?: LogContext): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;

    this[level === LogLevel.ERROR ? 'error' : level === LogLevel.WARN ? 'warn' : 'info'](
      `API Response: ${method} ${path} - ${statusCode} (${duration}ms)`,
      {
        ...context,
        action: 'api_response',
        metadata: {
          ...context?.metadata,
          method,
          path,
          statusCode,
          duration,
          timestamp: Date.now()
        }
      }
    );
  }

  // Database operation logging
  dbQuery(operation: string, table: string, duration: number, context?: LogContext): void {
    this.debug(`DB Query: ${operation} on ${table} (${duration}ms)`, {
      ...context,
      action: 'db_query',
      metadata: {
        ...context?.metadata,
        operation,
        table,
        duration,
        timestamp: Date.now()
      }
    });
  }

  dbError(operation: string, table: string, error: Error, context?: LogContext): void {
    this.error(`DB Error: ${operation} on ${table}`, error, {
      ...context,
      action: 'db_error',
      metadata: {
        ...context?.metadata,
        operation,
        table,
        timestamp: Date.now()
      }
    });
  }

  // Authentication logging
  authEvent(event: string, userId?: string, success: boolean = true, context?: LogContext): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this[level === LogLevel.INFO ? 'info' : 'warn'](
      `Auth Event: ${event} - ${success ? 'Success' : 'Failed'}`,
      {
        ...context,
        userId,
        action: 'auth_event',
        metadata: {
          ...context?.metadata,
          event,
          success,
          timestamp: Date.now()
        }
      }
    );
  }

  // Subscription/payment logging
  paymentEvent(event: string, userId: string, amount?: number, context?: LogContext): void {
    this.info(`Payment Event: ${event}`, {
      ...context,
      userId,
      action: 'payment_event',
      metadata: {
        ...context?.metadata,
        event,
        amount,
        currency: 'USD',
        timestamp: Date.now()
      }
    });
  }

  // Performance logging
  performance(operation: string, duration: number, context?: LogContext): void {
    const level = duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG;
    this[level === LogLevel.WARN ? 'warn' : 'debug'](
      `Performance: ${operation} took ${duration}ms`,
      {
        ...context,
        action: 'performance',
        metadata: {
          ...context?.metadata,
          operation,
          duration,
          timestamp: Date.now()
        }
      }
    );
  }

  // Feature usage logging
  featureUsage(feature: string, userId: string, context?: LogContext): void {
    this.info(`Feature Usage: ${feature}`, {
      ...context,
      userId,
      action: 'feature_usage',
      metadata: {
        ...context?.metadata,
        feature,
        timestamp: Date.now()
      }
    });
  }

  // Request context helper
  async getRequestContext(request: Request): Promise<LogContext> {
    try {
      const headersList = await headers();
      const requestId = headersList.get('x-request-id') || 
                       headersList.get('x-vercel-id') || 
                       crypto.randomUUID();
      
      const userAgent = headersList.get('user-agent') || 'unknown';
      const ip = headersList.get('x-forwarded-for') || 
                 headersList.get('x-real-ip') || 
                 'unknown';

      return {
        requestId,
        metadata: {
          userAgent,
          ip,
          url: request.url,
          method: request.method,
          referer: headersList.get('referer'),
          origin: headersList.get('origin')
        }
      };
    } catch (error) {
      return {
        requestId: crypto.randomUUID(),
        metadata: {
          error: 'Failed to extract request context'
        }
      };
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export helper to measure async operations
export async function measureAsync<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.performance(operation, duration, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${operation} failed after ${duration}ms`, error, context);
    throw error;
  }
}

// Export helper for creating child loggers with context
export function createLogger(defaultContext: LogContext) {
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...defaultContext, ...context }),
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...defaultContext, ...context }),
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { ...defaultContext, ...context }),
    error: (message: string, error?: Error | unknown, context?: LogContext) => 
      logger.error(message, error, { ...defaultContext, ...context }),
    fatal: (message: string, error?: Error | unknown, context?: LogContext) => 
      logger.fatal(message, error, { ...defaultContext, ...context })
  };
}