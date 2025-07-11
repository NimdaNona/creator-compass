import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

// Schema for updating events
const updateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  platform: z.string().optional(),
  contentType: z.string().optional(),
  status: z.enum(['idea', 'draft', 'ready', 'scheduled', 'published']).optional(),
  scheduledDate: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
  duration: z.number().optional(),
  color: z.string().optional(),
  seriesId: z.string().nullable().optional()
});

// GET /api/calendar/events/[id] - Get single event
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: params.id,
        userId: user.id
      },
      include: {
        series: true
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ event });

  } catch (error) {
    console.error('Error fetching calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar event' },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/events/[id] - Update event
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    const validatedData = updateEventSchema.parse(body);

    // Check if event exists and belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Update event
    const updatedData: any = {};
    if (validatedData.title !== undefined) updatedData.title = validatedData.title;
    if (validatedData.description !== undefined) updatedData.description = validatedData.description;
    if (validatedData.platform !== undefined) updatedData.platform = validatedData.platform;
    if (validatedData.contentType !== undefined) updatedData.contentType = validatedData.contentType;
    if (validatedData.status !== undefined) updatedData.status = validatedData.status;
    if (validatedData.scheduledDate !== undefined) updatedData.scheduledDate = new Date(validatedData.scheduledDate);
    if (validatedData.tags !== undefined) updatedData.tags = validatedData.tags;
    if (validatedData.duration !== undefined) updatedData.duration = validatedData.duration;
    if (validatedData.color !== undefined) updatedData.color = validatedData.color;
    if (validatedData.seriesId !== undefined) updatedData.seriesId = validatedData.seriesId;

    const event = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: updatedData,
      include: {
        series: true
      }
    });

    return NextResponse.json({ event });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar event' },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[id] - Delete event
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if event exists and belongs to user
    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete event
    await prisma.calendarEvent.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}