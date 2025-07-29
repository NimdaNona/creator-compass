import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnalyticsSyncService } from '@/lib/services/analytics-sync-service';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, compareStartDate, compareEndDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const analyticsSyncService = new AnalyticsSyncService();
    const comparison = await analyticsSyncService.getAnalyticsComparison(
      session.user.id,
      new Date(startDate),
      new Date(endDate),
      compareStartDate ? new Date(compareStartDate) : undefined,
      compareEndDate ? new Date(compareEndDate) : undefined
    );

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Error getting analytics comparison:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics comparison' },
      { status: 500 }
    );
  }
}