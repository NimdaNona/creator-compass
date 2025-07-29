import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[Minimal Test] Route called');
  
  try {
    // Test that we can access environment variables
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    
    // Import db dynamically to avoid compile issues
    const { db } = await import('@/lib/db');
    
    console.log('[Minimal Test] DB imported:', {
      dbExists: !!db,
      dbType: typeof db,
      dbUser: db ? !!db.user : false,
    });
    
    if (!db || !db.user) {
      return NextResponse.json({ 
        error: 'Database not available',
        dbExists: !!db,
        dbType: typeof db,
      }, { status: 500 });
    }
    
    // Test database query
    const userCount = await db.user.count();
    
    return NextResponse.json({
      success: true,
      hasApiKey,
      dbWorks: true,
      userCount,
      message: 'Minimal test passed!'
    });
  } catch (error: any) {
    console.error('[Minimal Test] Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5),
    }, { status: 500 });
  }
}