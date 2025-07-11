import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema for notification preferences
const notificationPreferencesSchema = z.object({
  dailyReminders: z.boolean().optional(),
  milestoneAlerts: z.boolean().optional(),
  streakNotifications: z.boolean().optional(),
  featureAnnouncements: z.boolean().optional(),
  subscriptionAlerts: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  reminderTime: z.string().optional(), // HH:MM format
  quietHoursStart: z.string().optional(), // HH:MM format
  quietHoursEnd: z.string().optional() // HH:MM format
});

// GET /api/notifications/preferences - Get notification preferences
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with preferences
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        notificationPreferences: true
      }
    });

    // Default preferences if none exist
    const defaultPreferences = {
      dailyReminders: true,
      milestoneAlerts: true,
      streakNotifications: true,
      featureAnnouncements: true,
      subscriptionAlerts: true,
      emailNotifications: true,
      pushNotifications: false,
      reminderTime: '09:00',
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };

    const preferences = user?.notificationPreferences || defaultPreferences;

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications/preferences - Update notification preferences
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = notificationPreferencesSchema.parse(body);

    // Update user preferences
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationPreferences: validatedData as any
      },
      select: {
        notificationPreferences: true
      }
    });

    return NextResponse.json(updated.notificationPreferences);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}