import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { dailyChallenges } from '@/lib/gamification/daily-challenges';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get or generate daily challenges
    let challenges = await dailyChallenges.getActiveChallenges(userId);
    
    if (challenges.length === 0) {
      // Generate new challenges if none exist
      challenges = await dailyChallenges.generateDailyChallenges(userId);
    }

    // Check progress for each challenge
    const challengesWithProgress = await Promise.all(
      challenges.map(async (challenge) => {
        const progress = await dailyChallenges.getChallengeProgress(userId, challenge.id);
        
        return {
          ...challenge,
          metadata: {
            progress: progress.percentage,
            status: progress.isCompleted ? 'completed' : 'active',
            completedAt: progress.completedAt,
            claimedAt: progress.claimedAt
          }
        };
      })
    );

    return NextResponse.json({
      challenges: challengesWithProgress
    });
  } catch (error) {
    console.error('Failed to fetch challenges:', error);
    return NextResponse.json(
      { error: 'Failed to fetch challenges' },
      { status: 500 }
    );
  }
}