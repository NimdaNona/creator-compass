import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationManager } from '@/lib/ai/conversation';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(1000),
  includeKnowledge: z.boolean().optional().default(true),
  context: z.object({
    type: z.string(),
    step: z.string().optional(),
    responses: z.record(z.any()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, message, includeKnowledge, context } = chatRequestSchema.parse(body);

    // Get user ID from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      const newConversation = await conversationManager.createConversation(user.id, context);
      convId = newConversation.id;
    }

    // Create a streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process message in background with timeout
    (async () => {
      let timeoutId: NodeJS.Timeout | null = null;
      let isTimedOut = false;

      try {
        // Set a 30-second timeout for the entire response
        timeoutId = setTimeout(async () => {
          isTimedOut = true;
          console.error('Response timeout after 30 seconds');
          try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              error: 'Response timeout', 
              timeout: true,
              message: 'The AI is taking longer than expected. Please try again.'
            })}\n\n`));
            await writer.close();
          } catch (e) {
            // Writer might already be closed
          }
        }, 30000);

        const responseStream = await conversationManager.processUserMessage(
          convId,
          message,
          { includeKnowledge, stream: true }
        ) as AsyncGenerator<string>;

        let hasContent = false;
        for await (const chunk of responseStream) {
          if (isTimedOut) break;
          hasContent = true;
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }

        if (!isTimedOut) {
          // Clear timeout if we completed successfully
          if (timeoutId) clearTimeout(timeoutId);
          
          // Ensure we send done signal
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            done: true, 
            conversationId: convId,
            hasContent 
          })}\n\n`));
        }
      } catch (error) {
        console.error('Stream processing error:', error);
        if (!isTimedOut) {
          try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              error: 'Processing error',
              message: error instanceof Error ? error.message : 'An unexpected error occurred'
            })}\n\n`));
          } catch (e) {
            // Writer might already be closed
          }
        }
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        try {
          await writer.close();
        } catch (e) {
          // Writer might already be closed
        }
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get conversation history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    // Get user ID from database
    const user = await prisma.user.findUnique({
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