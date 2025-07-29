import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mentorshipService } from '@/lib/community/mentorship-service';
import { z } from 'zod';
import { MentorshipStyle } from '@/types/community';

const findMatchesSchema = z.object({
  expertise: z.array(z.string()).optional(),
  style: z.nativeEnum(MentorshipStyle).optional(),
  language: z.string().optional(),
  timezone: z.string().optional()
});

const requestMatchSchema = z.object({
  targetUserId: z.string(),
  goals: z.array(z.string()).min(1).max(5),
  duration: z.object({
    commitment: z.string(),
    end: z.string().transform(str => new Date(str)).optional()
  }),
  message: z.string().min(10).max(1000)
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    const preferences = {
      expertise: searchParams.get('expertise')?.split(',').filter(Boolean),
      style: searchParams.get('style') as MentorshipStyle | undefined,
      language: searchParams.get('language') || undefined,
      timezone: searchParams.get('timezone') || undefined
    };

    const result = await mentorshipService.findMatches(
      session.user.id,
      preferences
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to find matches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to find matches' },
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
    const validationResult = requestMatchSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const match = await mentorshipService.requestMatch(
      session.user.id,
      validationResult.data.targetUserId,
      {
        goals: validationResult.data.goals,
        duration: validationResult.data.duration,
        message: validationResult.data.message
      }
    );

    return NextResponse.json({
      success: true,
      match
    });
  } catch (error) {
    console.error('Failed to request match:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request match' },
      { status: 500 }
    );
  }
}