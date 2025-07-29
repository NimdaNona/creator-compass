import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { proactiveAssistance } from '@/lib/ai/proactive-assistance';

// This endpoint should be called by a cron job or background worker
export async function POST(req: NextRequest) {
  try {
    // Verify this is an internal request (you might want to add proper auth)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active users
    const activeUsers = await prisma.user.findMany({
      where: {
        emailVerified: { not: null },
        deletedAt: null
      },
      select: { id: true }
    });

    const results = {
      processed: 0,
      suggestions: 0,
      errors: []
    };

    // Check triggers for each active user
    for (const user of activeUsers) {
      try {
        const suggestions = await proactiveAssistance.checkTriggers(user.id);
        results.processed++;
        results.suggestions += suggestions.length;
      } catch (error) {
        results.errors.push({
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Check triggers error:', error);
    return NextResponse.json(
      { error: 'Failed to check triggers' },
      { status: 500 }
    );
  }
}

// Manual trigger for a specific user (for testing)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const suggestions = await proactiveAssistance.checkTriggers(userId);

    return NextResponse.json({
      success: true,
      userId,
      suggestions
    });

  } catch (error) {
    console.error('Check triggers error:', error);
    return NextResponse.json(
      { error: 'Failed to check triggers' },
      { status: 500 }
    );
  }
}