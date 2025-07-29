import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[Test DB] Starting test');
    
    // Dynamically import db to avoid Turbopack issues
    const { db } = await import('@/lib/db');
    
    // Test 1: Check db exists
    const dbExists = !!db;
    console.log('[Test DB] db exists:', dbExists);
    
    if (!db) {
      return NextResponse.json({ error: 'db is undefined' }, { status: 500 });
    }
    
    // Test 2: Check db.user exists
    const userModelExists = !!db.user;
    console.log('[Test DB] db.user exists:', userModelExists);
    
    if (!db.user) {
      return NextResponse.json({ error: 'db.user is undefined' }, { status: 500 });
    }
    
    // Test 3: Try a simple query
    let userCount = -1;
    try {
      userCount = await db.user.count();
      console.log('[Test DB] User count:', userCount);
    } catch (error: any) {
      console.error('[Test DB] Query error:', error);
      return NextResponse.json({ 
        error: 'Query failed', 
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      }, { status: 500 });
    }
    
    // Test 4: Import conversation manager
    let convManagerExists = false;
    try {
      const { conversationManager } = await import('@/lib/ai/conversation');
      convManagerExists = !!conversationManager;
      console.log('[Test DB] conversationManager exists:', convManagerExists);
      
      // Test 5: Create a test conversation
      const testConv = await conversationManager.createConversation(
        'test-user-123',
        { type: 'test' }
      );
      console.log('[Test DB] Test conversation created:', testConv.id);
      
    } catch (error: any) {
      console.error('[Test DB] Conversation error:', error);
      return NextResponse.json({ 
        error: 'Conversation test failed', 
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5)
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      dbExists,
      userModelExists,
      userCount,
      convManagerExists,
      message: 'All tests passed'
    });
    
  } catch (error: any) {
    console.error('[Test DB] Error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}