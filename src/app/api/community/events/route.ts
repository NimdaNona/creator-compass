import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eventService } from '@/lib/community/event-service';
import { z } from 'zod';
import { EventType, EventStatus } from '@/types/community';

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  type: z.nativeEnum(EventType),
  startTime: z.string().transform(str => new Date(str)),
  endTime: z.string().transform(str => new Date(str)),
  timezone: z.string(),
  location: z.object({
    type: z.enum(['online', 'in_person', 'hybrid']),
    platform: z.string().optional(),
    url: z.string().url().optional(),
    address: z.string().optional()
  }),
  capacity: z.number().min(1).optional(),
  tags: z.array(z.string()).max(10),
  requirements: z.array(z.string()).optional(),
  agenda: z.array(z.object({
    time: z.string(),
    title: z.string(),
    description: z.string(),
    speaker: z.string().optional()
  })).optional(),
  coHosts: z.array(z.string()).optional()
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get('type') as EventType | undefined,
      status: searchParams.get('status') as EventStatus | undefined,
      hostId: searchParams.get('hostId') || undefined,
      startAfter: searchParams.get('startAfter') ? new Date(searchParams.get('startAfter')!) : undefined,
      endBefore: searchParams.get('endBefore') ? new Date(searchParams.get('endBefore')!) : undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      search: searchParams.get('search') || undefined
    };

    const pagination = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const result = await eventService.getEvents(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get events:', error);
    return NextResponse.json(
      { error: 'Failed to get events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createEventSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const event = await eventService.createEvent(
      session.user.id,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}