import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competitorTracking } from '@/lib/analytics/competitor-tracking';
import { z } from 'zod';

const compareSchema = z.object({
  followers: z.number(),
  engagementRate: z.number(),
  contentFrequency: z.number(),
  contentQuality: z.number()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const metrics = compareSchema.parse(body);

    const comparison = await competitorTracking.compareWithCompetitors(
      session.user.id,
      metrics
    );

    return NextResponse.json(comparison);
  } catch (error) {
    console.error('Compare competitors error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to compare with competitors' },
      { status: 500 }
    );
  }
}