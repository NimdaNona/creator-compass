import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RecommendationEngine, getUserContext } from '@/lib/recommendation-engine';
import { prisma } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const refresh = searchParams.get('refresh') === 'true';

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
        error: 'Please complete your profile to get recommendations' 
      }, { status: 400 });
    }

    // Check for cached recommendations if not refreshing
    if (!refresh) {
      const cached = await prisma.contentRecommendation.findMany({
        where: {
          userId: user.id,
          shown: false,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { score: 'desc' },
        take: limit
      });

      if (cached.length >= limit) {
        // Fetch full content for cached recommendations
        const recommendations = await Promise.all(
          cached.map(async (rec) => {
            let content = null;
            
            switch (rec.contentType) {
              case 'task':
                content = await prisma.dailyTask.findUnique({
                  where: { id: rec.contentId }
                });
                break;
              case 'template':
                content = await prisma.generatedTemplate.findUnique({
                  where: { id: rec.contentId }
                });
                break;
              case 'tip':
                content = await prisma.quickTip.findUnique({
                  where: { id: rec.contentId }
                });
                break;
              case 'milestone':
                content = await prisma.milestone.findUnique({
                  where: { id: rec.contentId }
                });
                break;
            }

            return {
              id: rec.id,
              type: rec.contentType,
              content,
              score: rec.score,
              reason: rec.reason
            };
          })
        );

        return NextResponse.json({ 
          recommendations: recommendations.filter(r => r.content !== null),
          cached: true 
        });
      }
    }

    // Generate fresh recommendations
    const engine = new RecommendationEngine(userContext);
    const recommendations = await engine.generateRecommendations(limit * 2); // Generate extra for variety
    
    // Save recommendations for caching
    await engine.saveRecommendations(recommendations);

    // Get subscription status to filter premium content
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: user.id }
    });

    const isPremium = subscription?.status === 'active';

    // Filter and limit recommendations
    const filteredRecommendations = recommendations
      .map(rec => {
        // Add premium lock for certain content types
        const locked = !isPremium && (
          (rec.content.type === 'template' && rec.content.metadata?.category === 'advanced') ||
          (rec.content.type === 'task' && rec.content.metadata?.phase > 1)
        );

        return {
          ...rec,
          locked
        };
      })
      .slice(0, limit);

    // Track that these were shown
    const recommendationIds = filteredRecommendations.map(r => r.content.id);
    await prisma.contentRecommendation.updateMany({
      where: {
        userId: user.id,
        contentId: { in: recommendationIds }
      },
      data: { shown: true }
    });

    return NextResponse.json({ 
      recommendations: filteredRecommendations,
      cached: false
    });

  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}