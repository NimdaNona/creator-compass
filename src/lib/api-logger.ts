import { NextRequest, NextResponse } from 'next/server';
import { logger, measureAsync } from './logger';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// API response wrapper with logging
export function apiResponse<T>(
  data: T | null,
  error: string | null = null,
  statusCode: number = 200,
  metadata?: Record<string, any>
): NextResponse {
  const response = {
    success: !error,
    data,
    error,
    timestamp: new Date().toISOString(),
    ...metadata
  };

  // Log the response
  if (error) {
    logger.error(`API Error Response: ${error}`, undefined, {
      metadata: { statusCode, ...metadata }
    });
  }

  return NextResponse.json(response, { status: statusCode });
}

// Success response helper
export function successResponse<T>(data: T, metadata?: Record<string, any>): NextResponse {
  return apiResponse(data, null, 200, metadata);
}

// Error response helpers
export function errorResponse(
  error: string, 
  statusCode: number = 400, 
  metadata?: Record<string, any>
): NextResponse {
  return apiResponse(null, error, statusCode, metadata);
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse(message, 403);
}

export function notFoundResponse(message: string = 'Not found'): NextResponse {
  return errorResponse(message, 404);
}

export function serverErrorResponse(
  error: Error | unknown,
  message: string = 'Internal server error'
): NextResponse {
  // Log the full error internally
  logger.error('Server Error', error, {
    action: 'server_error',
    metadata: {
      errorDetails: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : { error: String(error) }
    }
  });

  // Return generic message to client
  return errorResponse(message, 500);
}

// Validation error response
export function validationErrorResponse(
  errors: Record<string, string[]> | string,
  message: string = 'Validation error'
): NextResponse {
  return apiResponse(
    null,
    message,
    422,
    { validationErrors: errors }
  );
}

// Rate limit response
export function rateLimitResponse(
  retryAfter: number,
  limit: number,
  remaining: number
): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Rate limit exceeded',
      timestamp: new Date().toISOString()
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
        'Retry-After': retryAfter.toString()
      }
    }
  );
}

// API route wrapper with automatic logging and error handling
export function withApiLogging<T extends any[], R>(
  handler: (req: NextRequest, ...args: T) => Promise<NextResponse<R>>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    const start = Date.now();
    const requestContext = await logger.getRequestContext(req);
    
    try {
      // Get session info if available
      const session = await getServerSession(authOptions).catch(() => null);
      if (session?.user) {
        requestContext.userId = session.user.id;
        requestContext.sessionId = session.sessionId;
      }

      // Log the incoming request
      logger.apiRequest(req.method, new URL(req.url).pathname, requestContext);

      // Execute the handler
      const response = await handler(req, ...args);
      
      // Log the response
      const duration = Date.now() - start;
      logger.apiResponse(
        req.method,
        new URL(req.url).pathname,
        response.status,
        duration,
        requestContext
      );

      return response;
    } catch (error) {
      const duration = Date.now() - start;
      
      // Log the error
      logger.error(
        `API Handler Error: ${req.method} ${new URL(req.url).pathname}`,
        error,
        {
          ...requestContext,
          metadata: {
            ...requestContext.metadata,
            duration
          }
        }
      );

      // Return appropriate error response
      if (error instanceof Error) {
        if (error.message.includes('Unauthorized')) {
          return unauthorizedResponse();
        }
        if (error.message.includes('Forbidden')) {
          return forbiddenResponse();
        }
        if (error.message.includes('Not found')) {
          return notFoundResponse();
        }
      }

      return serverErrorResponse(error);
    }
  };
}

// Database operation wrapper with logging
export async function withDbLogging<T>(
  operation: string,
  table: string,
  fn: () => Promise<T>,
  context?: any
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    logger.dbQuery(operation, table, duration, { metadata: context });
    
    return result;
  } catch (error) {
    logger.dbError(operation, table, error as Error, { metadata: context });
    throw error;
  }
}

// Transaction wrapper with logging
export async function withTransactionLogging<T>(
  transactionName: string,
  fn: () => Promise<T>,
  context?: any
): Promise<T> {
  logger.info(`Transaction Started: ${transactionName}`, {
    action: 'transaction_start',
    metadata: context
  });

  try {
    const result = await measureAsync(`Transaction: ${transactionName}`, fn, {
      action: 'transaction',
      metadata: context
    });

    logger.info(`Transaction Completed: ${transactionName}`, {
      action: 'transaction_complete',
      metadata: context
    });

    return result;
  } catch (error) {
    logger.error(`Transaction Failed: ${transactionName}`, error, {
      action: 'transaction_failed',
      metadata: context
    });
    throw error;
  }
}

// External API call wrapper with logging
export async function withExternalApiLogging<T>(
  serviceName: string,
  endpoint: string,
  fn: () => Promise<T>,
  context?: any
): Promise<T> {
  const start = Date.now();
  
  logger.info(`External API Call: ${serviceName} - ${endpoint}`, {
    action: 'external_api_request',
    metadata: { serviceName, endpoint, ...context }
  });

  try {
    const result = await fn();
    const duration = Date.now() - start;
    
    logger.info(`External API Success: ${serviceName} - ${endpoint} (${duration}ms)`, {
      action: 'external_api_success',
      metadata: { serviceName, endpoint, duration, ...context }
    });
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    logger.error(
      `External API Failed: ${serviceName} - ${endpoint} (${duration}ms)`,
      error,
      {
        action: 'external_api_error',
        metadata: { serviceName, endpoint, duration, ...context }
      }
    );
    
    throw error;
  }
}

// Performance monitoring wrapper
export function withPerformanceLogging<T extends any[], R>(
  operationName: string,
  warningThreshold: number = 1000
) {
  return (fn: (...args: T) => Promise<R>) => {
    return async (...args: T): Promise<R> => {
      const start = Date.now();
      
      try {
        const result = await fn(...args);
        const duration = Date.now() - start;
        
        if (duration > warningThreshold) {
          logger.warn(`Slow Operation: ${operationName} took ${duration}ms`, {
            action: 'slow_operation',
            metadata: { operation: operationName, duration, threshold: warningThreshold }
          });
        } else {
          logger.debug(`Operation: ${operationName} completed in ${duration}ms`, {
            action: 'operation_complete',
            metadata: { operation: operationName, duration }
          });
        }
        
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error(`Operation Failed: ${operationName} after ${duration}ms`, error, {
          action: 'operation_failed',
          metadata: { operation: operationName, duration }
        });
        throw error;
      }
    };
  };
}