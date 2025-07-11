import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/ideas/saved - Get all saved ideas for the user
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Build where clause
    const where: any = {
      userId: user.id,
      status: 'saved' // Only get saved ideas, not drafts
    };

    if (platform && platform !== 'all') {
      where.platform = platform;
    }

    if (status === 'implemented') {
      where.implemented = true;
    } else if (status === 'pending') {
      where.implemented = false;
    }

    if (category && category !== 'all') {
      where.category = category;
    }

    const ideas = await prisma.contentIdea.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        description: true,
        hook: true,
        contentType: true,
        category: true,
        platform: true,
        tags: true,
        implemented: true,
        createdAt: true,
        metadata: true,
        notes: true
      }
    });

    // Transform ideas to match frontend expectations
    const transformedIdeas = ideas.map(idea => ({
      id: idea.id,
      title: idea.title,
      description: idea.description || '',
      hook: idea.hook || '',
      contentType: idea.contentType,
      category: idea.category,
      platform: idea.platform,
      keywords: idea.tags,
      savedAt: idea.createdAt,
      implemented: idea.implemented,
      notes: idea.notes,
      estimatedEngagement: (idea.metadata as any)?.estimatedEngagement || 'medium',
      difficulty: (idea.metadata as any)?.difficulty || 'medium',
      format: (idea.metadata as any)?.format || 'General'
    }));

    return NextResponse.json({ ideas: transformedIdeas });

  } catch (error) {
    console.error('Error fetching saved ideas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved ideas' },
      { status: 500 }
    );
  }
}