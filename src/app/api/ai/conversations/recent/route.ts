import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationMemory } from '@/lib/ai/conversation-memory';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '5');

    const conversations = await conversationMemory.getRecentConversations(
      session.user.id,
      limit
    );

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => ({
      id: conv.conversationId,
      summary: conv.summary || 'New conversation',
      lastActive: conv.lastActiveAt,
      topicTags: conv.topicTags || []
    }));

    return NextResponse.json(formattedConversations);

  } catch (error) {
    console.error('Get recent conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to get recent conversations' },
      { status: 500 }
    );
  }
}