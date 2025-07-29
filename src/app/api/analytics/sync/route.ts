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

    const analyticsSyncService = new AnalyticsSyncService();
    const analytics = await analyticsSyncService.syncAllPlatforms(session.user.id);

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error syncing analytics:', error);
    return NextResponse.json(
      { error: 'Failed to sync analytics' },
      { status: 500 }
    );
  }
}