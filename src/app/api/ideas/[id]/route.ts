import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// DELETE /api/ideas/[id] - Delete a saved idea
export async function DELETE(
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

    // Delete the idea
    await prisma.contentIdea.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting idea:', error);
    return NextResponse.json(
      { error: 'Failed to delete idea' },
      { status: 500 }
    );
  }
}

// PATCH /api/ideas/[id] - Update an idea
export async function PATCH(
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

    const body = await request.json();

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

    // Update the idea
    const updatedIdea = await prisma.contentIdea.update({
      where: {
        id: params.id
      },
      data: {
        ...body,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ idea: updatedIdea });

  } catch (error) {
    console.error('Error updating idea:', error);
    return NextResponse.json(
      { error: 'Failed to update idea' },
      { status: 500 }
    );
  }
}