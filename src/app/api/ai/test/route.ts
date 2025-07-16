import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/ai/openai-service';

export async function GET(request: NextRequest) {
  try {
    // Test if OpenAI client can be initialized
    const client = getOpenAIClient();
    
    // Test with a simple completion
    const completion = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Say "AI integration is working!" if you can respond.',
        },
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content || 'No response';

    return NextResponse.json({
      success: true,
      message: 'AI service is configured correctly',
      response,
      model: completion.model,
    });
  } catch (error: any) {
    console.error('AI test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      hint: error.message?.includes('API key') 
        ? 'Please set OPENAI_API_KEY in your .env.local file' 
        : 'Check console for details',
    }, { status: 500 });
  }
}