import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test 1: Direct import
    const dbModule = await import('@/lib/db');
    const hasDb = !!dbModule.db;
    
    // Test 2: Check if db.user exists
    const hasUser = hasDb && !!dbModule.db.user;
    
    // Test 3: Try a query
    let queryResult = null;
    if (hasUser) {
      try {
        const count = await dbModule.db.user.count();
        queryResult = { success: true, count };
      } catch (e: any) {
        queryResult = { success: false, error: e.message };
      }
    }
    
    return NextResponse.json({
      hasDb,
      hasUser,
      queryResult,
      dbKeys: hasDb ? Object.keys(dbModule.db).filter(k => !k.startsWith('_')).slice(0, 10) : []
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}