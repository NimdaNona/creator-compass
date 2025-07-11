import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema for creating notifications
const createNotificationSchema = z.object({
  type: z.enum([
    'milestone_achieved',
    'milestone_upcoming',
    'streak_achieved',
    'streak_warning',
    'streak_lost',
    'daily_task_reminder',
    'content_schedule',
    'feature_announcement',
    'platform_update',
    'achievement_unlocked',
    'level_up',
    'trial_ending',
    'subscription_renewed',
    'payment_failed'
  ]),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  icon: z.string().optional(),
  color: z.string().optional(),
  animation: z.string().optional(),
  duration: z.number().optional(),
  metadata: z.record(z.any()).optional()
});

// GET /api/notifications - List user notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(unreadOnly && { isRead: false })
    };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.notification.count({ where })
    ]);

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create notification (internal use)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createNotificationSchema.parse(body);

    // Default icon and color based on type
    const defaults = getNotificationDefaults(validatedData.type);

    const notification = await prisma.notification.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        title: validatedData.title,
        message: validatedData.message,
        icon: validatedData.icon || defaults.icon,
        color: validatedData.color || defaults.color,
        animation: validatedData.animation || defaults.animation,
        duration: validatedData.duration || 5000
      }
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}

// Helper function to get default notification styling
function getNotificationDefaults(type: string) {
  const defaults: Record<string, { icon: string; color: string; animation: string }> = {
    milestone_achieved: {
      icon: '🎯',
      color: 'green',
      animation: 'bounce'
    },
    milestone_upcoming: {
      icon: '📅',
      color: 'blue',
      animation: 'slide'
    },
    streak_achieved: {
      icon: '🔥',
      color: 'orange',
      animation: 'bounce'
    },
    streak_warning: {
      icon: '⚠️',
      color: 'yellow',
      animation: 'pulse'
    },
    streak_lost: {
      icon: '💔',
      color: 'red',
      animation: 'shake'
    },
    daily_task_reminder: {
      icon: '📝',
      color: 'blue',
      animation: 'slide'
    },
    content_schedule: {
      icon: '📅',
      color: 'purple',
      animation: 'slide'
    },
    feature_announcement: {
      icon: '🎉',
      color: 'purple',
      animation: 'bounce'
    },
    platform_update: {
      icon: '📢',
      color: 'blue',
      animation: 'slide'
    },
    achievement_unlocked: {
      icon: '🏆',
      color: 'gold',
      animation: 'bounce'
    },
    level_up: {
      icon: '⚡',
      color: 'purple',
      animation: 'bounce'
    },
    trial_ending: {
      icon: '⏰',
      color: 'yellow',
      animation: 'pulse'
    },
    subscription_renewed: {
      icon: '✅',
      color: 'green',
      animation: 'slide'
    },
    payment_failed: {
      icon: '❌',
      color: 'red',
      animation: 'shake'
    }
  };

  return defaults[type] || { icon: '📬', color: 'gray', animation: 'slide' };
}