import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// This endpoint helps diagnose environment variable issues in production
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow admin users to access this endpoint
    if (session.user.email !== 'chasecclifton@yahoo.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check various ways environment variables might be accessed
    const diagnostics = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      runtimeInfo: {
        nodeVersion: process.version,
        platform: process.platform,
        isVercel: !!process.env.VERCEL,
        vercelEnv: process.env.VERCEL_ENV,
      },
      envChecks: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        openAIKeyPrefix: process.env.OPENAI_API_KEY?.substring(0, 7) || 'NOT_SET',
        // Check if it's properly formatted
        isValidFormat: process.env.OPENAI_API_KEY?.startsWith('sk-') || false,
      },
      // List all env vars that contain certain keywords (excluding sensitive data)
      availableKeys: Object.keys(process.env)
        .filter(key => {
          const lowerKey = key.toLowerCase();
          return (
            lowerKey.includes('openai') ||
            lowerKey.includes('api') ||
            lowerKey.includes('vercel') ||
            lowerKey.includes('node')
          );
        })
        .filter(key => !key.includes('SECRET') && !key.includes('PASSWORD'))
        .sort(),
      // Test dynamic import
      dynamicImportTest: 'pending',
    };

    // Test if we can dynamically access the config
    try {
      const { getOpenAIApiKey } = await import('@/lib/ai/config');
      const apiKey = getOpenAIApiKey();
      diagnostics.dynamicImportTest = apiKey ? 'success' : 'failed';
    } catch (error) {
      diagnostics.dynamicImportTest = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}