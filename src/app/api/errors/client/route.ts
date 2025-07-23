import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logger, createLogger } from '@/lib/logger';
import { withApiLogging, successResponse, validationErrorResponse } from '@/lib/api-logger';

interface ClientError {
  errorId: string;
  message: string;
  stack?: string;
  componentStack?: string;
  context?: string;
  url: string;
  userAgent: string;
  timestamp: string;
}

export const POST = withApiLogging(async (request: NextRequest) => {
  try {
    const body: ClientError = await request.json();
    
    if (!body.errorId || !body.message || !body.url) {
      return validationErrorResponse({
        errorId: !body.errorId ? ['Error ID is required'] : undefined,
        message: !body.message ? ['Error message is required'] : undefined,
        url: !body.url ? ['URL is required'] : undefined
      });
    }

    // Get session if available (client errors can happen for unauthenticated users)
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    // Create appropriate logger
    const errorLogger = userId ? createLogger({ userId }) : logger;
    
    // Log the client error with full context
    errorLogger.error('Client-side error reported', new Error(body.message), {
      action: 'client_error',
      requestId: body.errorId,
      metadata: {
        errorId: body.errorId,
        message: body.message,
        stack: body.stack,
        componentStack: body.componentStack,
        context: body.context,
        url: body.url,
        userAgent: body.userAgent,
        timestamp: body.timestamp,
        authenticated: !!userId,
        sessionEmail: session?.user?.email
      }
    });

    // Additional context-specific logging
    if (body.context) {
      switch (body.context) {
        case 'dashboard':
          errorLogger.warn('Dashboard error - user experience impacted', {
            action: 'dashboard_error',
            metadata: {
              errorId: body.errorId,
              url: body.url
            }
          });
          break;
        
        case 'ai':
          errorLogger.error('AI service error - functionality degraded', undefined, {
            action: 'ai_service_error',
            metadata: {
              errorId: body.errorId,
              url: body.url
            }
          });
          break;
        
        case 'template':
          errorLogger.warn('Template loading error', {
            action: 'template_error',
            metadata: {
              errorId: body.errorId,
              url: body.url
            }
          });
          break;
      }
    }

    // Check for critical errors that might need immediate attention
    if (body.message.toLowerCase().includes('payment') || 
        body.message.toLowerCase().includes('subscription') ||
        body.message.toLowerCase().includes('authentication')) {
      errorLogger.fatal('Critical client error detected', new Error(body.message), {
        action: 'critical_client_error',
        requestId: body.errorId,
        metadata: {
          category: 'critical',
          url: body.url,
          authenticated: !!userId
        }
      });
    }

    // In production, you might want to:
    // 1. Store errors in a dedicated error tracking table
    // 2. Send to external error monitoring service (Sentry, Bugsnag, etc.)
    // 3. Trigger alerts for critical errors
    
    return successResponse({
      errorId: body.errorId,
      received: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Failed to process client error report', error);
    return validationErrorResponse('Failed to process error report');
  }
});