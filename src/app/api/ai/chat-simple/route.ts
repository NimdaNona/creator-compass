import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { conversationManager } from '@/lib/ai/conversation';
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
    console.log('[Simple Chat API] Request received');
    
    const body = await request.json();
    const { conversationId, message, includeKnowledge, context } = chatRequestSchema.parse(body);

    // Allow unauthenticated access for onboarding flow
    const isOnboarding = context?.type === 'onboarding';
    
    const session = await getServerSession(authOptions);
    if (!isOnboarding && !session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user ID from database or use anonymous ID for onboarding
    let userId: string;
    
    if (isOnboarding) {
      userId = 'onboarding-' + Math.random().toString(36).substr(2, 9);
    } else {
      // Dynamically import db to avoid Turbopack issues
      const { db } = await import('@/lib/db');
      
      // Test database connection
      console.log('[Simple Chat API] Testing database connection:', {
        dbExists: !!db,
        dbType: typeof db,
        dbUserExists: db ? !!db.user : false,
      });
      
      if (!db || !db.user) {
        return NextResponse.json({ 
          error: 'Database connection not available',
          details: {
            dbExists: !!db,
            dbType: typeof db,
          }
        }, { status: 500 });
      }
      
      const user = await db.user.findUnique({
        where: { email: session!.user.email! },
        select: { id: true },
      });

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      userId = user.id;
    }

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      console.log('[Simple Chat API] Creating new conversation for user:', userId);
      const newConversation = await conversationManager.createConversation(userId, context);
      convId = newConversation.id;
      console.log('[Simple Chat API] Created conversation:', convId);
    }

    // Process message without streaming for simplicity
    console.log('[Simple Chat API] Processing message for conversation:', convId);
    
    // Verify conversation exists before processing
    const verifyConv = await conversationManager.getConversation(convId);
    console.log('[Simple Chat API] Conversation verification:', {
      conversationId: convId,
      exists: !!verifyConv,
      userId: verifyConv?.userId
    });
    
    const response = await conversationManager.processUserMessage(
      convId,
      message,
      { includeKnowledge, stream: false }
    ) as string;
    
    console.log('[Simple Chat API] Response generated successfully');

    return NextResponse.json({ 
      success: true,
      conversationId: convId,
      message: response,
    });
  } catch (error: any) {
    console.error('[Simple Chat API] Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error?.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}