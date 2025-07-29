import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { analyticsService } from '@/lib/analytics/analytics-service';
import { z } from 'zod';

const querySchema = z.object({
  periodType: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom']).optional().default('monthly'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  platforms: z.string().optional(),
  contentTypes: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      periodType: searchParams.get('periodType') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      platforms: searchParams.get('platforms') || undefined,
      contentTypes: searchParams.get('contentTypes') || undefined
    });

    // Calculate period based on periodType
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (params.periodType) {
      case 'daily':
        start = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'weekly':
        start = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'monthly':
        start = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarterly':
        start = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'yearly':
        start = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      case 'custom':
        start = params.startDate ? new Date(params.startDate) : new Date(now.setMonth(now.getMonth() - 1));
        end = params.endDate ? new Date(params.endDate) : new Date();
        break;
    }

    // Build filters
    const filters = {
      platforms: params.platforms?.split(',').filter(Boolean),
      contentTypes: params.contentTypes?.split(',').filter(Boolean)
    };

    const analytics = await analyticsService.getAnalytics(
      session.user.id,
      {
        start,
        end,
        type: params.periodType
      },
      filters
    );

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}