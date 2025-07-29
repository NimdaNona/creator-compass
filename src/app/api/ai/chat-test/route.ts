import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[Chat Test] Starting...');
  
  try {
    // Dynamically import db to avoid Turbopack issues
    const { db } = await import('@/lib/db');
    
    // Log db state
    console.log('[Chat Test] db imported:', !!db);
    console.log('[Chat Test] db type:', typeof db);
    console.log('[Chat Test] db.user exists:', db ? !!db.user : false);
    
    if (!db) {
      return NextResponse.json({ error: 'Database not imported' }, { status: 500 });
    }
    
    if (!db.user) {
      return NextResponse.json({ error: 'db.user is undefined' }, { status: 500 });
    }
    
    // Try a simple query
    const userCount = await db.user.count();
    
    return NextResponse.json({
      success: true,
      userCount,
      dbImported: !!db,
      dbUserExists: !!db.user,
    });
  } catch (error: any) {
    console.error('[Chat Test] Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}