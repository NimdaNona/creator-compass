import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const limit = parseInt(searchParams.get('limit') || '50');
    const interactionType = searchParams.get('type');
    const startDate = searchParams.get('startDate');

    // Build query filters
    const where: any = { userId };
    
    if (interactionType) {
      where.interactionType = interactionType;
    }
    
    if (startDate) {
      where.createdAt = {
        gte: new Date(startDate)
      };
    }

    // Fetch interactions
    const interactions = await prisma.aIInteraction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        interactionType: true,
        context: true,
        interaction: true,
        userResponse: true,
        impact: true,
        createdAt: true
      }
    });

    // Get interaction summary
    const summary = await prisma.aIInteraction.groupBy({
      by: ['interactionType'],
      where: { userId },
      _count: {
        interactionType: true
      }
    });

    return NextResponse.json({
      interactions,
      summary: summary.reduce((acc, item) => ({
        ...acc,
        [item.interactionType]: item._count.interactionType
      }), {}),
      total: interactions.length
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}