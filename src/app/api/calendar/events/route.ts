import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { validatePlatformSwitch } from '@/lib/platform-validation';

// Schema for creating/updating events
const eventSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  platform: z.string(),
  contentType: z.string(),
  status: z.enum(['idea', 'draft', 'ready', 'scheduled', 'published']),
  scheduledDate: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  duration: z.number().optional(),
  color: z.string().optional(),
  seriesId: z.string().optional()
});

// GET /api/calendar/events - Get calendar events
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'month';
    const dateParam = searchParams.get('date');
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');

    // Calculate date range based on view
    const baseDate = dateParam ? new Date(dateParam) : new Date();
    let startDate: Date;
    let endDate: Date;

    if (view === 'month') {
      const monthStart = startOfMonth(baseDate);
      const monthEnd = endOfMonth(baseDate);
      startDate = startOfWeek(monthStart);
      endDate = endOfWeek(monthEnd);
    } else if (view === 'week') {
      startDate = startOfWeek(baseDate);
      endDate = endOfWeek(baseDate);
    } else {
      // List view - get next 30 days
      startDate = new Date();
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
    }

    // Build where clause
    const where: any = {
      userId: user.id,
      scheduledDate: {
        gte: startDate,
        lte: endDate
      }
    };

    if (platform) {
      where.platform = platform;
    }

    if (status) {
      where.status = status;
    }

    // Fetch events
    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        series: true
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    });

    return NextResponse.json({ events });

  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar events' },
      { status: 500 }
    );
  }
}

// POST /api/calendar/events - Create new event
export async function POST(request: Request) {
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

    const body = await request.json();
    
    // Validate request body
    const validatedData = eventSchema.parse(body);

    // Validate platform selection
    const platformValidation = await validatePlatformSwitch(user.id, validatedData.platform);
    
    if (!platformValidation.allowed) {
      return NextResponse.json({ 
        error: platformValidation.error, 
        requiresUpgrade: platformValidation.requiresUpgrade,
        currentPlatform: platformValidation.currentPlatform,
        subscription: platformValidation.subscription
      }, { status: 403 });
    }

    // Create event
    const event = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        title: validatedData.title,
        description: validatedData.description,
        platform: validatedData.platform,
        contentType: validatedData.contentType,
        status: validatedData.status,
        scheduledDate: new Date(validatedData.scheduledDate),
        tags: validatedData.tags || [],
        duration: validatedData.duration,
        color: validatedData.color,
        seriesId: validatedData.seriesId
      },
      include: {
        series: true
      }
    });

    // Send real-time analytics update if event is published
    if (validatedData.status === 'published') {
      try {
        await fetch(new URL('/api/analytics/update', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            type: 'content',
            update: {
              contentUpdate: {
                published: 1
              }
            }
          })
        });
      } catch (error) {
        console.error('Failed to send analytics update:', error);
      }
    }

    return NextResponse.json({ event }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}