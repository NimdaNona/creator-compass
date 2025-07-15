import { NextRequest, NextResponse } from 'next/server';
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
  seriesId: z.string().optional()
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

// PATCH /api/calendar/events/[id] - Update event
export async function PATCH(
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
    const updatedData: any = { ...validatedData };
    if (validatedData.scheduledDate) {
      updatedData.scheduledDate = new Date(validatedData.scheduledDate);
    }

    const event = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: updatedData,
      include: {
        series: true
      }
    });

    // Send real-time analytics update if status changed
    if (validatedData.status && validatedData.status !== existingEvent.status) {
      try {
        const contentUpdate: any = {};
        
        // Decrement old status count
        if (existingEvent.status === 'published') contentUpdate.published = -1;
        else if (existingEvent.status === 'scheduled') contentUpdate.scheduled = -1;
        else if (existingEvent.status === 'draft') contentUpdate.draft = -1;
        else if (existingEvent.status === 'idea') contentUpdate.ideas = -1;
        
        // Increment new status count
        if (validatedData.status === 'published') contentUpdate.published = (contentUpdate.published || 0) + 1;
        else if (validatedData.status === 'scheduled') contentUpdate.scheduled = (contentUpdate.scheduled || 0) + 1;
        else if (validatedData.status === 'draft') contentUpdate.draft = (contentUpdate.draft || 0) + 1;
        else if (validatedData.status === 'idea') contentUpdate.ideas = (contentUpdate.ideas || 0) + 1;

        await fetch(new URL('/api/analytics/update', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            type: 'content',
            update: { contentUpdate }
          })
        });
      } catch (error) {
        console.error('Failed to send analytics update:', error);
      }
    }

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
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete event
    await prisma.calendarEvent.delete({
      where: { id: params.id }
    });

    // Send real-time analytics update
    if (event.status === 'published' || event.status === 'scheduled') {
      try {
        const contentUpdate: any = {};
        if (event.status === 'published') contentUpdate.published = -1;
        else if (event.status === 'scheduled') contentUpdate.scheduled = -1;

        await fetch(new URL('/api/analytics/update', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('cookie') || ''
          },
          body: JSON.stringify({
            type: 'content',
            update: { contentUpdate }
          })
        });
      } catch (error) {
        console.error('Failed to send analytics update:', error);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to delete calendar event' },
      { status: 500 }
    );
  }
}