import { NextRequest, NextResponse } from 'next/server';

// Debug version to isolate the issue
export async function POST(request: NextRequest) {
  try {
    console.log('[Debug Route] Starting...');
    
    // Test 1: Check environment
    console.log('[Debug Route] Environment:', {
      nodeEnv: process.env.NODE_ENV,
      hasApiKey: !!process.env.OPENAI_API_KEY,
      hasDbUrl: !!process.env.DATABASE_URL,
    });
    
    // Test 2: Try importing db module
    console.log('[Debug Route] Importing db module...');
    const dbModule = await import('@/lib/db');
    console.log('[Debug Route] db module keys:', Object.keys(dbModule));
    
    // Test 3: Check db object
    const { db } = dbModule;
    console.log('[Debug Route] db exists:', !!db);
    console.log('[Debug Route] db type:', typeof db);
    
    if (db) {
      console.log('[Debug Route] db properties:', Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$')));
      console.log('[Debug Route] db.user exists:', !!db.user);
    }
    
    // Test 4: Try a simple query
    if (db?.user) {
      console.log('[Debug Route] Attempting user count...');
      const count = await db.user.count();
      console.log('[Debug Route] User count:', count);
      
      return NextResponse.json({
        success: true,
        dbExists: true,
        userModelExists: true,
        userCount: count,
      });
    }
    
    return NextResponse.json({
      success: false,
      dbExists: !!db,
      userModelExists: false,
      error: 'Database models not available',
    });
    
  } catch (error: any) {
    console.error('[Debug Route] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}