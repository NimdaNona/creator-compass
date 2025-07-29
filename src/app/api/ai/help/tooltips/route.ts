import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { journeyOrchestrator } from '@/lib/ai/journey-orchestrator';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HelpTooltip {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon?: string;
  actionText?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get user context
    const context = await journeyOrchestrator.aggregateUserContext(userId);
    const journeyState = await journeyOrchestrator.getUserJourneyState(userId);
    
    // Get page from query params
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || 'dashboard';
    
    // Generate contextual tooltips based on user state
    const tooltips = await generateContextualTooltips(context, journeyState, page);
    
    return NextResponse.json({ tooltips });
  } catch (error) {
    console.error('Error generating tooltips:', error);
    return NextResponse.json(
      { error: 'Failed to generate tooltips' },
      { status: 500 }
    );
  }
}

async function generateContextualTooltips(
  context: any,
  journeyState: any,
  page: string
): Promise<HelpTooltip[]> {
  const tooltips: HelpTooltip[] = [];
  
  // Dashboard-specific tooltips
  if (page === 'dashboard') {
    // New user tooltips
    if (context.progress.stats?.totalTasksCompleted < 5) {
      tooltips.push({
        id: 'start-first-task',
        target: '[data-today-tasks]',
        title: 'Start with Today\'s Tasks',
        content: 'Your daily tasks are personalized based on your journey stage. Complete them to build momentum!',
        position: 'left',
        priority: 'high',
        actionText: 'View Tasks',
        actionUrl: '#tasks'
      });
    }
    
    // Streak reminder
    if (context.progress.stats?.streakDays === 0) {
      tooltips.push({
        id: 'build-streak',
        target: '.progress-stats',
        title: 'Build Your Streak',
        content: 'Consistency is key! Complete at least one task today to start building your streak.',
        position: 'bottom',
        priority: 'medium'
      });
    }
    
    // Calendar reminder for users with low planning
    const hasScheduledContent = await prisma.contentCalendar.count({
      where: { 
        userId,
        scheduledFor: {
          gte: new Date()
        }
      }
    });
    
    if (hasScheduledContent === 0 && context.progress.stats?.totalTasksCompleted > 10) {
      tooltips.push({
        id: 'use-calendar',
        target: '[data-calendar-tab]',
        title: 'Plan Your Content',
        content: 'Use the calendar to schedule your content in advance. Successful creators plan ahead!',
        position: 'top',
        priority: 'medium',
        actionText: 'Open Calendar'
      });
    }
    
    // AI Journey Guide highlight for returning users
    if (journeyState.currentStage !== 'discovery') {
      tooltips.push({
        id: 'check-journey-guide',
        target: '.ai-journey-guide',
        title: 'Your Personalized Roadmap',
        content: 'The AI Journey Guide updates daily with personalized recommendations based on your progress.',
        position: 'bottom',
        priority: 'low'
      });
    }
  }
  
  // Template page tooltips
  if (page === 'templates') {
    if (context.progress.stats?.totalTasksCompleted < 20) {
      tooltips.push({
        id: 'first-template',
        target: '.template-grid',
        title: 'Try a Template',
        content: 'Templates are pre-made content frameworks that save you hours of planning. Start with a simple one!',
        position: 'top',
        priority: 'high',
        actionText: 'Browse Templates'
      });
    }
  }
  
  // Analytics page tooltips
  if (page === 'analytics') {
    tooltips.push({
      id: 'understand-metrics',
      target: '.metrics-overview',
      title: 'Understanding Your Metrics',
      content: 'Focus on engagement rate and audience retention - these predict long-term growth better than view counts.',
      position: 'right',
      priority: 'medium'
    });
  }
  
  // Add stage-specific tooltips
  switch (journeyState.currentStage) {
    case 'discovery':
      if (!context.profile?.bio) {
        tooltips.push({
          id: 'complete-profile',
          target: '.user-menu',
          title: 'Complete Your Profile',
          content: 'A complete profile helps us give you better recommendations.',
          position: 'bottom',
          priority: 'high',
          actionText: 'Go to Profile',
          actionUrl: '/settings/profile'
        });
      }
      break;
      
    case 'foundation':
      tooltips.push({
        id: 'foundation-tips',
        target: '.quick-actions',
        title: 'Building Your Foundation',
        content: 'Focus on consistency over perfection. Aim to complete 3 tasks daily to build strong habits.',
        position: 'left',
        priority: 'medium'
      });
      break;
      
    case 'growth':
      tooltips.push({
        id: 'growth-optimization',
        target: '.ai-insights',
        title: 'Time to Optimize',
        content: 'Check your AI insights regularly to understand what content resonates with your audience.',
        position: 'left',
        priority: 'medium'
      });
      break;
  }
  
  return tooltips;
}