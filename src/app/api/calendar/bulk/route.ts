import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { trackUsage } from '@/lib/usage';
import { addDays, setHours, setMinutes } from 'date-fns';

// Schema for bulk event creation
const bulkEventSchema = z.object({
  events: z.array(z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    platform: z.string(),
    contentType: z.string(),
    status: z.enum(['idea', 'draft', 'ready', 'scheduled', 'published']),
    scheduledDate: z.string().datetime(),
    tags: z.array(z.string()).optional(),
    duration: z.number().optional(),
    color: z.string().optional()
  })),
  seriesId: z.string().optional(),
  schedule: z.object({
    startDate: z.string().datetime(),
    frequency: z.enum(['daily', 'weekly', 'biweekly', 'monthly']),
    count: z.number().min(1).max(52), // Max 1 year of content
    timeOfDay: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/) // HH:MM format
  }).optional()
});

// POST /api/calendar/bulk - Create multiple events or series
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has access to bulk scheduling (premium feature)
    const isActive = user.subscription?.status === 'active';
    if (!isActive) {
      return NextResponse.json(
        { 
          error: 'Bulk scheduling is a premium feature',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = bulkEventSchema.parse(body);

    // Track usage
    const usageCheck = await trackUsage(user.id, 'exports', true); // Using exports as proxy for bulk operations
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: 'Bulk operation limit reached',
          upgradeRequired: true
        },
        { status: 403 }
      );
    }

    let eventsToCreate = validatedData.events;

    // If schedule is provided, generate recurring events
    if (validatedData.schedule) {
      const { startDate, frequency, count, timeOfDay } = validatedData.schedule;
      const [hours, minutes] = timeOfDay.split(':').map(Number);
      eventsToCreate = [];

      // Get the first event as template
      const template = validatedData.events[0];
      let currentDate = new Date(startDate);
      currentDate = setHours(setMinutes(currentDate, minutes), hours);

      for (let i = 0; i < count; i++) {
        eventsToCreate.push({
          ...template,
          title: `${template.title} #${i + 1}`,
          scheduledDate: currentDate.toISOString()
        });

        // Calculate next date based on frequency
        switch (frequency) {
          case 'daily':
            currentDate = addDays(currentDate, 1);
            break;
          case 'weekly':
            currentDate = addDays(currentDate, 7);
            break;
          case 'biweekly':
            currentDate = addDays(currentDate, 14);
            break;
          case 'monthly':
            currentDate = new Date(currentDate);
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
        }
      }
    }

    // Create series if needed
    let seriesId = validatedData.seriesId;
    if (!seriesId && validatedData.schedule && eventsToCreate.length > 1) {
      const series = await prisma.contentSeries.create({
        data: {
          userId: user.id,
          name: validatedData.events[0].title + ' Series',
          platform: validatedData.events[0].platform,
          frequency: validatedData.schedule.frequency,
          defaultTime: validatedData.schedule.timeOfDay,
          isActive: true
        }
      });
      seriesId = series.id;
    }

    // Create all events in a transaction
    const events = await prisma.$transaction(
      eventsToCreate.map(eventData => 
        prisma.calendarEvent.create({
          data: {
            userId: user.id,
            title: eventData.title,
            description: eventData.description,
            platform: eventData.platform,
            contentType: eventData.contentType,
            status: eventData.status,
            scheduledDate: new Date(eventData.scheduledDate),
            tags: eventData.tags || [],
            duration: eventData.duration,
            color: eventData.color,
            seriesId
          }
        })
      )
    );

    return NextResponse.json({ 
      events,
      count: events.length,
      seriesId
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating bulk calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar events' },
      { status: 500 }
    );
  }
}