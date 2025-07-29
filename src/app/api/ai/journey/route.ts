import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { journeyOrchestrator, InteractionType } from '@/lib/ai/journey-orchestrator';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Aggregate user context
    const context = await journeyOrchestrator.aggregateUserContext(userId);
    
    // Generate journey insights
    const insights = await journeyOrchestrator.generateJourneyInsights(context);

    // Track this interaction
    await journeyOrchestrator.trackInteraction(
      userId,
      InteractionType.GUIDANCE,
      { page: 'dashboard', action: 'load_journey_insights' },
      { insights },
      'viewed'
    );

    return NextResponse.json({
      success: true,
      journey: insights,
      context: {
        platform: context.profile?.selectedPlatform,
        niche: context.profile?.selectedNiche,
        daysActive: context.profile ? 
          Math.floor((Date.now() - new Date(context.profile.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        tasksCompleted: context.progress.stats?.totalTasksCompleted || 0,
        currentStreak: context.progress.stats?.streakDays || 0
      }
    });
  } catch (error) {
    console.error('Error fetching journey insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journey insights' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { action, data } = await request.json();

    switch (action) {
      case 'dismiss_recommendation':
        await journeyOrchestrator.trackInteraction(
          userId,
          InteractionType.SUGGESTION,
          { page: 'dashboard', action: 'dismiss_recommendation' },
          { recommendationId: data.recommendationId },
          'dismissed',
          data
        );
        break;

      case 'accept_next_step':
        await journeyOrchestrator.trackInteraction(
          userId,
          InteractionType.GUIDANCE,
          { page: 'dashboard', action: 'accept_next_step' },
          { nextStepId: data.nextStepId },
          'accepted',
          data
        );
        break;

      case 'request_guidance':
        // Generate specific guidance based on user request
        const context = await journeyOrchestrator.aggregateUserContext(userId);
        const insights = await journeyOrchestrator.generateJourneyInsights(context);
        
        await journeyOrchestrator.trackInteraction(
          userId,
          InteractionType.GUIDANCE,
          { page: data.page || 'dashboard', action: 'request_guidance' },
          { insights, requestType: data.type },
          'requested'
        );

        return NextResponse.json({
          success: true,
          guidance: insights
        });

      case 'initialize_journey':
        // Initialize journey state for new users
        const journeyState = await journeyOrchestrator.getUserJourneyState(userId);
        
        if (data.isFirstTime) {
          await prisma.userJourneyState.update({
            where: { userId },
            data: {
              journeyMetadata: {
                isFirstTime: true,
                onboardingCompletedAt: new Date(),
                welcomeShown: false,
                platform: data.platform,
                niche: data.niche
              }
            }
          });
        }

        return NextResponse.json({
          success: true,
          journeyState
        });

      case 'complete_tour':
        // Track tour completion
        await journeyOrchestrator.trackInteraction(
          userId,
          InteractionType.TUTORIAL,
          { page: 'dashboard', action: 'complete_tour' },
          { tourType: data.tourType },
          'completed'
        );
        
        return NextResponse.json({ success: true });

      case 'start_recommended_task':
        // Track when user starts a recommended task
        await journeyOrchestrator.trackInteraction(
          userId,
          InteractionType.GUIDANCE,
          { page: 'dashboard', action: 'start_recommended_task' },
          { taskId: data.taskId, taskTitle: data.taskTitle },
          'accepted'
        );
        
        return NextResponse.json({ success: true });

      case 'dismiss_tooltip':
        // Track tooltip dismissal
        await journeyOrchestrator.trackInteraction(
          userId,
          InteractionType.TUTORIAL,
          { page: data.page || 'dashboard', action: 'dismiss_tooltip' },
          { tooltipId: data.tooltipId },
          'dismissed'
        );
        
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing journey action:', error);
    return NextResponse.json(
      { error: 'Failed to process action' },
      { status: 500 }
    );
  }
}