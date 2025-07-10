import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Update achievement shared status
    const achievement = await prisma.milestoneAchievement.update({
      where: {
        id: params.id,
        userId: user.id // Ensure user owns this achievement
      },
      data: {
        shared: true
      }
    });

    return NextResponse.json({ success: true, achievement });

  } catch (error) {
    console.error('Error sharing milestone:', error);
    return NextResponse.json(
      { error: 'Failed to share milestone' },
      { status: 500 }
    );
  }
}