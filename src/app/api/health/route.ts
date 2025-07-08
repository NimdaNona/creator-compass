import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ratelimiters, rateLimit } from '@/lib/ratelimit';

export async function GET(request: NextRequest) {
  // Apply rate limiting for public endpoints
  const rateLimitResponse = await rateLimit(request, ratelimiters?.public || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    // Check database connection
    await db.user.findFirst({
      select: { id: true },
      take: 1,
    });

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        application: 'running',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          application: 'running',
        },
        error: 'Database connection failed',
      },
      { status: 503 }
    );
  }
}