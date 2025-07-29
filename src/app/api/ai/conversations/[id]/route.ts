import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationMemory } from '@/lib/ai/conversation-memory';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversationMemory.findFirst({
      where: {
        conversationId,
        userId: session.user.id
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    const context = await conversationMemory.getConversationContext(conversationId);

    if (!context) {
      return NextResponse.json(
        { error: 'Failed to load conversation context' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      messages: context.messages,
      summary: context.summary,
      keyInsights: context.keyInsights,
      topicTags: context.topicTags
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversationId = params.id;

    // Delete the conversation if it belongs to the user
    const result = await prisma.conversationMemory.deleteMany({
      where: {
        conversationId,
        userId: session.user.id
      }
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}