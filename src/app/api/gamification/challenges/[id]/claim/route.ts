import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dailyChallenges } from '@/lib/gamification/daily-challenges';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const challengeId = params.id;

    // Claim the challenge rewards
    const result = await dailyChallenges.claimChallenge(userId, challengeId);

    if (!result) {
      return NextResponse.json(
        { error: 'Challenge cannot be claimed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      xpAwarded: result.xpAwarded,
      badgesUnlocked: result.badgesUnlocked,
      message: 'Challenge rewards claimed successfully!'
    });
  } catch (error) {
    console.error('Failed to claim challenge:', error);
    return NextResponse.json(
      { error: 'Failed to claim challenge' },
      { status: 500 }
    );
  }
}