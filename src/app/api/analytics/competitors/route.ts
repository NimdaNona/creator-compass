import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competitorTracking } from '@/lib/analytics/competitor-tracking';
import { z } from 'zod';

const competitorSchema = z.object({
  name: z.string().min(1),
  platform: z.string().min(1),
  profileUrl: z.string().url(),
  tags: z.array(z.string()).optional()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const competitors = await competitorTracking.getCompetitors(session.user.id);

    return NextResponse.json(competitors);
  } catch (error) {
    console.error('Get competitors error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch competitors' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = competitorSchema.parse(body);

    const competitor = await competitorTracking.addCompetitor(
      session.user.id,
      data
    );

    return NextResponse.json(competitor);
  } catch (error) {
    console.error('Add competitor error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to add competitor' },
      { status: 500 }
    );
  }
}