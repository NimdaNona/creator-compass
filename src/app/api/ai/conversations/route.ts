import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationManager } from '@/lib/ai/conversation';

// Get conversation history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    // Dynamically import db to avoid Turbopack issues
    const { db } = await import('@/lib/db');
    
    // Get user ID from database
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (conversationId) {
      // Get specific conversation
      const conversation = await conversationManager.getConversation(conversationId);
      
      if (!conversation || conversation.userId !== user.id) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      return NextResponse.json({ conversation });
    } else {
      // Get user's conversations
      const conversations = await conversationManager.getUserConversations(user.id);
      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('Get conversations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}