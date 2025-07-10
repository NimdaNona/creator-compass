import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RecommendationEngine, getUserContext } from '@/lib/recommendation-engine';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, contentType, action, duration } = body;

    if (!contentId || !contentType || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['viewed', 'completed', 'shared', 'saved', 'dismissed', 'clicked'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user context
    const userContext = await getUserContext(user.id);
    
    if (!userContext) {
      return NextResponse.json({ 
        error: 'User context not found' 
      }, { status: 400 });
    }

    // Track engagement
    const engine = new RecommendationEngine(userContext);
    await engine.trackEngagement(contentId, contentType, action);

    // Additional tracking for specific actions
    if (action === 'completed' && contentType === 'task') {
      // This is handled by the task completion endpoint
      // But we can track it here for recommendation purposes
    }

    if (action === 'saved' && contentType === 'template') {
      // Track template saves
      await prisma.generatedTemplate.update({
        where: { id: contentId },
        data: { uses: { increment: 1 } }
      });
    }

    // Update recommendation engagement status
    if (['completed', 'saved', 'shared'].includes(action)) {
      await prisma.contentRecommendation.updateMany({
        where: {
          userId: user.id,
          contentId
        },
        data: { engaged: true }
      });
    } else if (action === 'dismissed') {
      await prisma.contentRecommendation.updateMany({
        where: {
          userId: user.id,
          contentId
        },
        data: { dismissed: true }
      });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Feedback recorded'
    });

  } catch (error) {
    console.error('Error recording recommendation feedback:', error);
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}