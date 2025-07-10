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
    const phase = searchParams.get('phase');
    const week = searchParams.get('week');
    const day = searchParams.get('day');

    // Get user data and profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        subscription: true,
        taskCompletions: {
          select: {
            taskId: true,
            completedAt: true,
            quality: true,
            timeSpent: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build query filters
    const filters: any = {};
    
    if (platform || user.profile?.selectedPlatform) {
      filters.platform = platform || user.profile?.selectedPlatform;
    }
    
    if (niche || user.profile?.selectedNiche) {
      filters.niche = niche || user.profile?.selectedNiche;
    }
    
    if (phase) {
      filters.phase = parseInt(phase);
    }
    
    if (week) {
      filters.week = parseInt(week);
    }

    // Get tasks with completion status
    const tasks = await prisma.dailyTask.findMany({
      where: filters,
      orderBy: [
        { phase: 'asc' },
        { week: 'asc' },
        { orderIndex: 'asc' }
      ],
      take: 50 // Limit to prevent overwhelming response
    });

    // Map tasks with completion status
    const completedTaskIds = new Set(user.taskCompletions.map(tc => tc.taskId));
    const taskCompletionMap = new Map(
      user.taskCompletions.map(tc => [tc.taskId, tc])
    );

    const enhancedTasks = tasks.map(task => ({
      ...task,
      completed: completedTaskIds.has(task.id),
      completion: taskCompletionMap.get(task.id) || null,
      // For free users, lock advanced tasks
      locked: !user.subscription || user.subscription.status !== 'active' 
        ? task.phase > 1 || (task.phase === 1 && task.week > 4)
        : false
    }));

    // Get today's specific tasks based on user progress
    const currentPhase = user.profile?.currentPhase || 1;
    const currentWeek = user.profile?.currentWeek || 1;
    const startDate = user.profile?.startDate || new Date();
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const currentDay = (daysSinceStart % 7) + 1; // 1-7

    const todaysTasks = enhancedTasks.filter(task => {
      // Match current progress
      if (task.phase !== currentPhase || task.week !== currentWeek) {
        return false;
      }
      
      // Match day range
      const dayRangeMatch = task.dayRange.match(/Day\s+(\d+)(?:-(\d+))?/);
      if (dayRangeMatch) {
        const startDay = parseInt(dayRangeMatch[1]);
        const endDay = dayRangeMatch[2] ? parseInt(dayRangeMatch[2]) : startDay;
        return currentDay >= startDay && currentDay <= endDay;
      }
      
      return false;
    });

    // Calculate progress metrics
    const totalTasks = enhancedTasks.length;
    const completedTasks = enhancedTasks.filter(t => t.completed).length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Get upcoming tasks preview
    const upcomingTasks = enhancedTasks.filter(task => {
      return !task.completed && (
        task.phase > currentPhase || 
        (task.phase === currentPhase && task.week > currentWeek)
      );
    }).slice(0, 5);

    return NextResponse.json({
      tasks: enhancedTasks,
      todaysTasks,
      upcomingTasks,
      progress: {
        total: totalTasks,
        completed: completedTasks,
        percentage: progressPercentage,
        currentPhase,
        currentWeek,
        currentDay
      },
      filters: {
        platform: filters.platform,
        niche: filters.niche,
        phase: filters.phase,
        week: filters.week
      }
    });

  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}