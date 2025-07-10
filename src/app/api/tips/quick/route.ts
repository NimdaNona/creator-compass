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
    const limit = parseInt(searchParams.get('limit') || '5');
    const category = searchParams.get('category');

    // Get user profile for platform/niche filtering
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { profile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query filters
    const filters: any = {
      isActive: true
    };

    if (category) {
      filters.category = category;
    }

    if (user.profile?.selectedPlatform) {
      filters.OR = [
        { platform: user.profile.selectedPlatform },
        { platform: null } // Include general tips
      ];
    }

    // Get random tips
    const tipCount = await prisma.quickTip.count({ where: filters });
    const skip = Math.max(0, Math.floor(Math.random() * tipCount) - limit);

    const tips = await prisma.quickTip.findMany({
      where: filters,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // If we don't have enough tips, provide some defaults
    if (tips.length === 0) {
      const defaultTips = [
        {
          id: 'default1',
          title: 'Post Consistently',
          content: 'Consistency is more important than perfection. Set a realistic schedule and stick to it.',
          category: 'growth',
          difficulty: 'beginner',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: 'default2',
          title: 'Engage Early',
          content: 'Reply to comments within the first hour to boost engagement and build community.',
          category: 'engagement',
          difficulty: 'beginner',
          isActive: true,
          createdAt: new Date()
        },
        {
          id: 'default3',
          title: 'Study Analytics',
          content: 'Check your analytics weekly to understand what content resonates with your audience.',
          category: 'analytics',
          difficulty: 'intermediate',
          isActive: true,
          createdAt: new Date()
        }
      ];

      return NextResponse.json({ tips: defaultTips });
    }

    return NextResponse.json({ tips });

  } catch (error) {
    console.error('Error fetching quick tips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tips' },
      { status: 500 }
    );
  }
}