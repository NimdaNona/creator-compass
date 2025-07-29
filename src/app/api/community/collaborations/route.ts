import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collaborationService } from '@/lib/community/collaboration-service';
import { z } from 'zod';
import { CollaborationType, CollaborationStatus } from '@/types/community';

const createCollaborationSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  type: z.nativeEnum(CollaborationType),
  requirements: z.array(z.object({
    type: z.enum(['subscribers', 'views', 'platform', 'niche', 'skill', 'equipment', 'availability']),
    value: z.union([z.string(), z.number()]),
    required: z.boolean()
  })),
  deliverables: z.array(z.string()),
  timeline: z.object({
    startDate: z.string().transform(str => new Date(str)),
    endDate: z.string().transform(str => new Date(str)),
    milestones: z.array(z.object({
      title: z.string(),
      description: z.string(),
      dueDate: z.string().transform(str => new Date(str)),
      assignedTo: z.array(z.string()).optional()
    }))
  }),
  tags: z.array(z.string()).max(10)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get('type') as CollaborationType | undefined,
      status: searchParams.get('status') as CollaborationStatus | undefined,
      creatorId: searchParams.get('creatorId') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      search: searchParams.get('search') || undefined
    };

    const pagination = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const result = await collaborationService.getCollaborations(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get collaborations:', error);
    return NextResponse.json(
      { error: 'Failed to get collaborations' },
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
    const validationResult = createCollaborationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const collaboration = await collaborationService.createCollaboration(
      session.user.id,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      collaboration
    });
  } catch (error) {
    console.error('Failed to create collaboration:', error);
    return NextResponse.json(
      { error: 'Failed to create collaboration' },
      { status: 500 }
    );
  }
}