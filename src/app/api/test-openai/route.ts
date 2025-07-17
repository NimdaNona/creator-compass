import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    const keyInfo = {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      prefix: apiKey ? apiKey.substring(0, 7) : 'NOT SET',
      format: apiKey ? (apiKey.startsWith('sk-') ? 'Valid format' : 'Invalid format') : 'N/A'
    };

    // Test OpenAI client initialization
    let clientStatus = 'Not tested';
    let clientError = null;
    
    try {
      const { getOpenAIClient } = await import('@/lib/ai/openai-service');
      const client = getOpenAIClient();
      clientStatus = 'Initialized successfully';
      
      // Try a simple API call
      try {
        const OpenAI = await import('openai');
        const testClient = new OpenAI.default({ apiKey });
        const completion = await testClient.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Say hello' }],
          max_tokens: 10
        });
        clientStatus = 'API call successful';
      } catch (apiError: any) {
        clientStatus = 'Client created but API call failed';
        clientError = apiError.message;
      }
    } catch (error: any) {
      clientStatus = 'Failed to initialize';
      clientError = error.message;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      openai: {
        keyInfo,
        clientStatus,
        clientError
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}