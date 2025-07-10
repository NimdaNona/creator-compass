import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const niche = searchParams.get('niche');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query filters
    const filters: any = {};
    
    if (platform || user.profile?.selectedPlatform) {
      filters.OR = [
        { platform: platform || user.profile?.selectedPlatform },
        { platform: null } // Include cross-platform milestones
      ];
    }
    
    if (niche || user.profile?.selectedNiche) {
      // For niche, we want to include both niche-specific and general milestones
      const nicheValue = niche || user.profile?.selectedNiche;
      filters.AND = [
        {
          OR: [
            { niche: nicheValue },
            { niche: null }
          ]
        }
      ];
    }

    // Get all milestones
    const milestones = await prisma.milestone.findMany({
      where: filters,
      orderBy: { orderIndex: 'asc' }
    });

    // Get user's achievements
    const achievements = await prisma.milestoneAchievement.findMany({
      where: { userId: user.id },
      include: {
        milestone: true
      }
    });

    return NextResponse.json({
      milestones,
      achievements
    });

  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json(
      { error: 'Failed to fetch milestones' },
      { status: 500 }
    );
  }
}