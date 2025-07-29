import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competitorTracking } from '@/lib/analytics/competitor-tracking';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentGaps = await competitorTracking.findContentGaps(session.user.id);

    return NextResponse.json(contentGaps);
  } catch (error) {
    console.error('Content gaps analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze content gaps' },
      { status: 500 }
    );
  }
}