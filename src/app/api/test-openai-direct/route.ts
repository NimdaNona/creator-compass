import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Direct test of OpenAI without our wrapper
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || session.user.email !== 'chasecclifton@yahoo.com') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Step 1: Check environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    const diagnostics: any = {
      step1_envCheck: {
        hasKey: !!apiKey,
        keyLength: apiKey?.length || 0,
        keyPrefix: apiKey?.substring(0, 7) || 'NOT_SET',
      }
    };

    if (!apiKey) {
      return NextResponse.json({ 
        error: 'OPENAI_API_KEY not found in environment',
        diagnostics 
      }, { status: 500 });
    }

    // Step 2: Try direct OpenAI import
    try {
      const OpenAI = (await import('openai')).default;
      diagnostics.step2_import = 'success';
      
      // Step 3: Try to create client
      try {
        const client = new OpenAI({ apiKey });
        diagnostics.step3_clientCreation = 'success';
        
        // Step 4: Try a simple API call
        try {
          const completion = await client.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Say hello' }],
            max_tokens: 10,
          });
          
          diagnostics.step4_apiCall = {
            status: 'success',
            response: completion.choices[0]?.message?.content || 'No response',
            model: completion.model,
          };
        } catch (apiError: any) {
          diagnostics.step4_apiCall = {
            status: 'failed',
            error: apiError.message,
            type: apiError.constructor.name,
            statusCode: apiError.status,
          };
        }
      } catch (clientError: any) {
        diagnostics.step3_clientCreation = {
          status: 'failed',
          error: clientError.message,
          type: clientError.constructor.name,
        };
      }
    } catch (importError: any) {
      diagnostics.step2_import = {
        status: 'failed',
        error: importError.message,
        type: importError.constructor.name,
      };
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      diagnostics,
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}