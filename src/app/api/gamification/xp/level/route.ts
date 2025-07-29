import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { xpSystem } from '@/lib/gamification/xp-system';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get user level data
    const levelData = await xpSystem.getUserLevel(userId);
    
    // Get today's XP
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayXP = await prisma.xPTransaction.aggregate({
      where: {
        userId,
        createdAt: { gte: today }
      },
      _sum: { totalXP: true }
    });

    // Get available XP actions
    const availableActions = await xpSystem.getAvailableXPActions(userId);

    return NextResponse.json({
      level: levelData.level,
      title: levelData.title,
      currentXP: levelData.currentXP,
      requiredXP: levelData.requiredXP,
      nextLevelXP: levelData.nextLevelXP,
      progress: levelData.progress,
      badge: levelData.badge,
      todayXP: todayXP._sum.totalXP || 0,
      availableActions
    });
  } catch (error) {
    console.error('Failed to fetch level data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch level data' },
      { status: 500 }
    );
  }
}