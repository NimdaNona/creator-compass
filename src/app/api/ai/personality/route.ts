import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiPersonality } from '@/lib/ai/personality-service';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await aiPersonality.getPersonalityProfile(session.user.id);
    
    return NextResponse.json({
      type: profile.type,
      traits: profile.traits,
      adaptations: profile.adaptations
    });

  } catch (error) {
    console.error('Get personality error:', error);
    return NextResponse.json(
      { error: 'Failed to get personality profile' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { personalityType, adaptations } = await req.json();

    // Update personality if type is provided
    if (personalityType) {
      await aiPersonality.transitionPersonality(session.user.id, personalityType);
    }

    // Update adaptations if provided
    if (adaptations) {
      const current = await aiPersonality.getOrCreatePersonality(session.user.id);
      await prisma.aIPersonality.update({
        where: { userId: session.user.id },
        data: { adaptations }
      });
    }

    const profile = await aiPersonality.getPersonalityProfile(session.user.id);
    
    return NextResponse.json({
      type: profile.type,
      traits: profile.traits,
      adaptations: profile.adaptations
    });

  } catch (error) {
    console.error('Update personality error:', error);
    return NextResponse.json(
      { error: 'Failed to update personality profile' },
      { status: 500 }
    );
  }
}