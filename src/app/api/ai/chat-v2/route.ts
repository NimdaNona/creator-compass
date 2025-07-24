import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationManager } from '@/lib/ai/conversation-v2';
import { z } from 'zod';
import { checkFeatureLimit, incrementFeatureUsage } from '@/app/api/middleware/subscription-check';

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
    const body = await request.json();
    const { conversationId, message, includeKnowledge, context } = chatRequestSchema.parse(body);

    // Allow unauthenticated access for onboarding flow
    const isOnboarding = context?.type === 'onboarding';
    
    const session = await getServerSession(authOptions);
    if (!isOnboarding && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Dynamically import db to avoid Turbopack issues
    const { db } = await import('@/lib/db');
    
    // Log environment check for debugging
    console.log('[Chat API v2] Processing request', {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      isOnboarding,
      dbExists: !!db,
      dbType: typeof db,
      dbHasUser: db ? !!db.user : false,
    });

    // Get user ID from database or use anonymous ID for onboarding
    let userId: string;
    
    if (isOnboarding) {
      // Use a temporary anonymous user ID for onboarding
      userId = 'onboarding-' + Math.random().toString(36).substr(2, 9);
    } else {
      if (!db || !db.user) {
        console.error('[Chat API v2] Database not properly initialized:', {
          dbExists: !!db,
          dbType: typeof db,
          dbKeys: db ? Object.keys(db).slice(0, 10) : [],
        });
        throw new Error('Database connection not available');
      }
      
      const user = await db.user.findUnique({
        where: { email: session!.user.email! },
        select: { id: true, subscription: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userId = user.id;
      
      // Check subscription limits
      const isFreeTier = !user.subscription || user.subscription.plan === 'free';
      const featureCheck = await checkFeatureLimit(user.id, 'ai', isFreeTier);
      if (!featureCheck.allowed) {
        return NextResponse.json(
          { 
            error: featureCheck.error || 'You have reached your monthly AI message limit',
            limit: featureCheck.limit,
            used: featureCheck.used,
            requiresUpgrade: true,
            currentPlan: user.subscription?.plan || 'free'
          },
          { status: 403 }
        );
      }
    }

    // Create or get conversation
    let convId = conversationId;
    if (!convId && !isOnboarding) {
      const conversation = await conversationManager.createConversation(userId);
      convId = conversation.id;
    }

    // Process the message
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('[Chat API v2] Starting stream processing');
          
          const sendData = (data: any) => {
            const text = `data: ${JSON.stringify(data)}\n\n`;
            controller.enqueue(encoder.encode(text));
          };

          // Send conversation ID if new
          if (!conversationId && convId) {
            console.log('[Chat API v2] Sending conversation ID:', convId);
            sendData({ conversationId: convId });
          }

          console.log('[Chat API v2] Processing message with conversationManager');
          
          // Get response stream
          const responseStream = await conversationManager.processMessage(
            isOnboarding ? null : convId!,
            message,
            {
              userId,
              includeKnowledge,
              context,
              onChunk: (chunk) => {
                console.log('[Chat API v2] Sending chunk:', chunk.length, 'chars');
                sendData({ content: chunk });
              },
            }
          );

          console.log('[Chat API v2] Response stream type:', typeof responseStream);
          
          // If response is already a string (non-streaming), send it
          if (typeof responseStream === 'string') {
            console.log('[Chat API v2] Sending non-streaming response:', responseStream.length, 'chars');
            sendData({ content: responseStream });
          } else {
            // Handle async generator
            console.log('[Chat API v2] Processing async generator');
            for await (const chunk of responseStream) {
              // Chunks are already sent via onChunk callback
            }
          }

          // Track usage for authenticated users
          if (!isOnboarding && session?.user?.email) {
            await incrementFeatureUsage(userId, 'ai');
          }

          // Send done signal
          console.log('[Chat API v2] Sending done signal');
          sendData({ done: true });
          controller.close();
        } catch (error: any) {
          console.error('[Chat API v2] Stream error:', error);
          console.error('[Chat API v2] Error stack:', error.stack);
          const errorData = { 
            error: error.message || 'Failed to process message',
            details: error.stack?.split('\n').slice(0, 3).join('\n')
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('[Chat API v2] Error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: error.stack?.split('\n').slice(0, 3).join('\n')
      },
      { status: 500 }
    );
  }
}

// GET endpoint for retrieving conversation history
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId');

  if (!conversationId) {
    return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
  }

  try {
    // Dynamically import db
    const { db } = await import('@/lib/db');
    
    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conversation = await conversationManager.getConversation(conversationId, user.id);
    return NextResponse.json(conversation);
  } catch (error: any) {
    console.error('[Chat API v2] GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get conversation' },
      { status: 500 }
    );
  }
}