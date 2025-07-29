import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { mentorshipService } from '@/lib/community/mentorship-service';
import { z } from 'zod';
import { MentorshipStyle } from '@/types/community';

const createProfileSchema = z.object({
  role: z.enum(['mentor', 'mentee', 'both']),
  expertise: z.array(z.string()).min(1).max(20),
  interests: z.array(z.string()).min(1).max(20),
  availability: z.object({
    hoursPerWeek: z.number().min(1).max(40),
    preferredDays: z.array(z.string()),
    preferredTimes: z.array(z.string()),
    sessionDuration: z.number().min(15).max(120),
    communicationMethods: z.array(z.enum(['video', 'voice', 'chat', 'email']))
  }),
  experience: z.string().min(10).max(1000),
  bio: z.string().min(20).max(2000),
  goals: z.array(z.string()).min(1).max(10),
  preferredMentorshipStyle: z.nativeEnum(MentorshipStyle),
  languages: z.array(z.string()).min(1),
  timezone: z.string()
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await mentorshipService.createOrUpdateProfile(
      session.user.id,
      {} as any // This would fetch the existing profile
    );

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Failed to get mentorship profile:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
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
    const validationResult = createProfileSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const profile = await mentorshipService.createOrUpdateProfile(
      session.user.id,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Failed to create/update mentorship profile:', error);
    return NextResponse.json(
      { error: 'Failed to create/update profile' },
      { status: 500 }
    );
  }
}