import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { xpSystem } from '@/lib/gamification/xp-system';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { actionId, metadata } = body;

    if (!actionId) {
      return NextResponse.json(
        { error: 'Action ID is required' },
        { status: 400 }
      );
    }

    // Award XP for the action
    const xpGain = await xpSystem.awardXP(userId, actionId, metadata);

    if (!xpGain) {
      return NextResponse.json(
        { error: 'XP action not available or daily limit reached' },
        { status: 400 }
      );
    }

    // Get updated level data
    const levelData = await xpSystem.getUserLevel(userId);

    return NextResponse.json({
      success: true,
      xpAwarded: xpGain.xpAwarded,
      totalXP: xpGain.totalXP,
      levelUp: xpGain.levelUp,
      newLevel: xpGain.newLevel,
      currentLevel: levelData
    });
  } catch (error) {
    console.error('Failed to track XP action:', error);
    return NextResponse.json(
      { error: 'Failed to track XP action' },
      { status: 500 }
    );
  }
}