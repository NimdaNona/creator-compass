import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { eventService } from '@/lib/community/event-service';
import { z } from 'zod';
import { ChallengeType, ChallengeStatus } from '@/types/community';

const createChallengeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  type: z.nativeEnum(ChallengeType),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  rules: z.array(z.string()).min(1),
  prizes: z.array(z.object({
    place: z.number(),
    title: z.string(),
    description: z.string(),
    value: z.string().optional(),
    type: z.enum(['cash', 'product', 'service', 'recognition', 'other'])
  })).optional(),
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
  submissionDeadline: z.string().transform(str => new Date(str)),
  requirements: z.array(z.string()),
  judgingCriteria: z.array(z.object({
    name: z.string(),
    description: z.string(),
    weight: z.number().min(0).max(100)
  })),
  tags: z.array(z.string()).max(10)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      type: searchParams.get('type') as ChallengeType | undefined,
      status: searchParams.get('status') as ChallengeStatus | undefined,
      difficulty: searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' | undefined,
      creatorId: searchParams.get('creatorId') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      search: searchParams.get('search') || undefined
    };

    const pagination = {
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const result = await eventService.getChallenges(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get challenges:', error);
    return NextResponse.json(
      { error: 'Failed to get challenges' },
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
    const validationResult = createChallengeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Validate judging criteria weights sum to 100
    const totalWeight = validationResult.data.judgingCriteria.reduce((sum, c) => sum + c.weight, 0);
    if (totalWeight !== 100) {
      return NextResponse.json(
        { error: 'Judging criteria weights must sum to 100' },
        { status: 400 }
      );
    }

    const challenge = await eventService.createChallenge(
      session.user.id,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      challenge
    });
  } catch (error) {
    console.error('Failed to create challenge:', error);
    return NextResponse.json(
      { error: 'Failed to create challenge' },
      { status: 500 }
    );
  }
}