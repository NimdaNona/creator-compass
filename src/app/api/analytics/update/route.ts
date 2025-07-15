import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendAnalyticsUpdate } from '../sse/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { type, update } = body;

    // Validate update type
    if (!['metric', 'content', 'milestone'].includes(type)) {
      return NextResponse.json({ error: 'Invalid update type' }, { status: 400 });
    }

    // Send real-time update to the user
    sendAnalyticsUpdate(user.id, {
      type,
      ...update,
      timestamp: new Date().toISOString()
    });

    // Also update database if needed
    if (type === 'content' && update.contentUpdate) {
      // For example, when a new event is published
      const { published, scheduled } = update.contentUpdate;
      
      // You could update user stats here if you have a stats table
      // await prisma.userStats.update({
      //   where: { userId: user.id },
      //   data: { publishedContent: { increment: 1 } }
      // });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending analytics update:', error);
    return NextResponse.json(
      { error: 'Failed to send analytics update' },
      { status: 500 }
    );
  }
}