import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { userContextService } from '@/lib/ai/user-context';
import { z } from 'zod';

const onboardingCompleteSchema = z.object({
  conversationId: z.string(),
  responses: z.object({
    creatorLevel: z.string().optional(),
    preferredPlatforms: z.array(z.string()).optional(),
    contentNiche: z.string().optional(),
    equipment: z.string().optional(),
    goals: z.string().optional(),
    challenges: z.string().optional(),
    timeCommitment: z.string().optional(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, responses } = onboardingCompleteSchema.parse(body);

    console.log('[Onboarding Complete] Processing:', {
      email: session.user.email,
      conversationId,
      responses,
    });

    // Get user from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user context with onboarding data
    await userContextService.updateUserContextFromOnboarding(user.id, responses);

    // Also save the conversation to database
    if (conversationId && !conversationId.startsWith('onboarding-')) {
      await db.aiConversation.upsert({
        where: { id: conversationId },
        update: {
          userId: user.id,
          context: {
            type: 'onboarding',
            completed: true,
            responses,
          },
          updatedAt: new Date(),
        },
        create: {
          id: conversationId,
          userId: user.id,
          messages: [],
          context: {
            type: 'onboarding',
            completed: true,
            responses,
          },
        },
      });
    }

    console.log('[Onboarding Complete] Successfully saved onboarding data');

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      userId: user.id,
    });
  } catch (error) {
    console.error('[Onboarding Complete] Error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}