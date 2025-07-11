import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/ideas/[id]/implement - Mark an idea as implemented
export async function PUT(
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

    // Check if idea exists and belongs to user
    const idea = await prisma.contentIdea.findFirst({
      where: {
        id: params.id,
        userId: user.id
      }
    });

    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }

    // Mark the idea as implemented
    const updatedIdea = await prisma.contentIdea.update({
      where: {
        id: params.id
      },
      data: {
        implemented: true,
        implementedAt: new Date()
      }
    });

    return NextResponse.json({ idea: updatedIdea });

  } catch (error) {
    console.error('Error marking idea as implemented:', error);
    return NextResponse.json(
      { error: 'Failed to update idea' },
      { status: 500 }
    );
  }
}