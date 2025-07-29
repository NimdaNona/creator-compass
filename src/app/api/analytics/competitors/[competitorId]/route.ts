import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { competitorTracking } from '@/lib/analytics/competitor-tracking';

interface Props {
  params: {
    competitorId: string;
  };
}

export async function DELETE(
  request: NextRequest,
  { params }: Props
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await competitorTracking.removeCompetitor(
      session.user.id,
      params.competitorId
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove competitor error:', error);
    return NextResponse.json(
      { error: 'Failed to remove competitor' },
      { status: 500 }
    );
  }
}