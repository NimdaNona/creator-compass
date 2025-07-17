import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Test session
    const session = await getServerSession(authOptions);
    
    // Test environment
    const envCheck = {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      keyLength: process.env.OPENAI_API_KEY?.length || 0,
      keyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7),
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
    };

    // Test OpenAI initialization
    let openAITest = { status: 'not tested' };
    try {
      const { createOpenAIClient } = await import('@/lib/ai/openai-client');
      const client = createOpenAIClient();
      
      // Test API call
      const completion = await client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Say hello' }],
        max_tokens: 10,
      });
      
      openAITest = {
        status: 'success',
        response: completion.choices[0]?.message?.content || 'No response',
      };
    } catch (error) {
      openAITest = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
      };
    }

    // Test conversation manager
    let conversationTest = { status: 'not tested' };
    try {
      const { conversationManager } = await import('@/lib/ai/conversation');
      
      // Try to create a conversation
      if (session?.user?.email) {
        const { prisma } = await import('@/lib/db');
        const user = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        });
        
        if (user) {
          const conversation = await conversationManager.createConversation(user.id, {
            type: 'test',
          });
          
          conversationTest = {
            status: 'success',
            conversationId: conversation.id,
          };
          
          // Clean up
          await prisma.aIConversation.delete({
            where: { id: conversation.id },
          });
        } else {
          conversationTest = { status: 'error', error: 'User not found' };
        }
      } else {
        conversationTest = { status: 'error', error: 'No session' };
      }
    } catch (error) {
      conversationTest = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined,
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        email: session?.user?.email,
      },
      environment: envCheck,
      openAI: openAITest,
      conversation: conversationTest,
    });
  } catch (error) {
    console.error('Debug chat error:', error);
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}