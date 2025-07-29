import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { rewards } from '@/lib/gamification/rewards';

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
    const rewardId = params.id;

    // Claim the reward
    const success = await rewards.claimReward(userId, rewardId);

    if (!success) {
      return NextResponse.json(
        { error: 'Reward cannot be claimed' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reward claimed successfully!'
    });
  } catch (error) {
    console.error('Failed to claim reward:', error);
    return NextResponse.json(
      { error: 'Failed to claim reward' },
      { status: 500 }
    );
  }
}