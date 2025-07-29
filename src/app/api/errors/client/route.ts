import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const errorData = await req.json();

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error Report:', errorData);
    }

    // Store error in database for production
    if (process.env.NODE_ENV === 'production') {
      await prisma.errorLog.create({
        data: {
          userId: session?.user?.id,
          message: errorData.message,
          stack: errorData.stack,
          componentStack: errorData.componentStack,
          errorType: errorData.errorType || 'client',
          errorBoundary: errorData.errorBoundary,
          url: errorData.url,
          userAgent: errorData.userAgent,
          metadata: {
            timestamp: errorData.timestamp,
            ...errorData.metadata,
          },
        },
      });

      // Send to external error tracking service if configured
      if (process.env.SENTRY_DSN || process.env.BUGSNAG_API_KEY) {
        // Integrate with error tracking service
        // This would be implemented based on your chosen service
      }
    }

    // Always return success to avoid blocking the client
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to log client error:', error);
    // Still return success to avoid blocking the client
    return NextResponse.json({ success: true });
  }
}