import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { leaderboards } from '@/lib/gamification/leaderboards';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any || 'xp';
    const timeframe = searchParams.get('timeframe') as any || 'weekly';
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get leaderboard data
    const leaderboard = await leaderboards.getLeaderboard(
      type,
      timeframe,
      limit,
      session.user.id
    );

    // Get user's positions across all leaderboards
    const userPositions = await leaderboards.getUserLeaderboardPositions(session.user.id);

    return NextResponse.json({
      leaderboard,
      userPositions
    });
  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}