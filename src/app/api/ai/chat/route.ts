console.log('[Chat Route] File loaded - checking imports...');

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationManager } from '@/lib/ai/conversation';
import { z } from 'zod';
import { checkFeatureLimit, incrementFeatureUsage } from '@/app/api/middleware/subscription-check';

console.log('[Chat Route] All imports completed successfully');

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
    
    // Log environment check for debugging
    console.log('[Chat API] Processing request', {
      hasApiKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      isOnboarding,
    });

    // Get user ID from database or use anonymous ID for onboarding
    let userId: string;
    
    if (isOnboarding) {
      // Use a temporary anonymous user ID for onboarding
      userId = 'onboarding-' + Math.random().toString(36).substr(2, 9);
    } else {
      try {
        console.log('[Chat API] Before db check');
        // Dynamically import db to avoid Turbopack issues
        const { db } = await import('@/lib/db');
        
        console.log('[Chat API] Before user query');
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
      } catch (error: any) {
        console.error('[Chat API] Error getting user from database:', error);
        throw error;
      }
    }

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      console.log('[Chat API] Creating new conversation for user:', userId);
      try {
        const newConversation = await conversationManager.createConversation(userId, context);
        convId = newConversation.id;
        console.log('[Chat API] Created conversation:', convId);
      } catch (createError: any) {
        console.error('[Chat API] Error creating conversation:', createError);
        console.error('[Chat API] Create error stack:', createError.stack);
        throw createError;
      }
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
        console.log('[Chat API] Starting stream processing');
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

        console.log('[Chat API] Before processUserMessage');
        let responseStream: AsyncGenerator<string>;
        try {
          responseStream = await conversationManager.processUserMessage(
            convId,
            message,
            { includeKnowledge, stream: true }
          ) as AsyncGenerator<string>;
          console.log('[Chat API] After processUserMessage');
        } catch (pmError: any) {
          console.error('[Chat API] processUserMessage error:', pmError);
          console.error('[Chat API] processUserMessage stack:', pmError.stack);
          throw pmError;
        }

        let hasContent = false;
        for await (const chunk of responseStream) {
          if (isTimedOut) break;
          hasContent = true;
          await writer.write(encoder.encode(`data: ${JSON.stringify({ content: chunk })}\n\n`));
        }

        if (!isTimedOut) {
          // Clear timeout if we completed successfully
          if (timeoutId) clearTimeout(timeoutId);
          
          // Increment AI usage for authenticated users
          if (!isOnboarding && hasContent) {
            await incrementFeatureUsage(userId, 'ai');
          }
          
          // Ensure we send done signal
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            done: true, 
            conversationId: convId,
            hasContent 
          })}\n\n`));
        }
      } catch (error: any) {
        console.error('[Chat API] Stream processing error:', error);
        console.error('[Chat API] Error type:', typeof error);
        console.error('[Chat API] Error name:', error?.name);
        console.error('[Chat API] Error message:', error?.message);
        console.error('[Chat API] Error stack:', error?.stack);
        
        if (!isTimedOut) {
          try {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              error: 'Processing error',
              message: error instanceof Error ? error.message : 'An unexpected error occurred',
              errorType: error?.name || 'Unknown',
              errorStack: error?.stack?.split('\n').slice(0, 3).join('\n')
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
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error('[Chat API] Error details:', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
        hasApiKey: !!process.env.OPENAI_API_KEY,
      });
      
      // Return more specific error messages
      if (error.message.includes('OpenAI') || error.message.includes('API key')) {
        return NextResponse.json({ 
          error: 'AI service configuration error', 
          details: 'The AI service is not properly configured. Please check server logs.'
        }, { status: 500 });
      }
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET functionality moved to separate route file to avoid Turbopack parsing issues