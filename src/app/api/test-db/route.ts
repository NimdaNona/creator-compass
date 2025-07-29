import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    console.log('[Test DB] Starting database test...');
    
    // Test 1: Check if db exists
    const dbExists = !!db;
    console.log('[Test DB] db exists:', dbExists);
    
    // Test 2: Check if db.user exists
    const userModelExists = !!db?.user;
    console.log('[Test DB] db.user exists:', userModelExists);
    
    // Test 3: Try to count users
    let userCount = -1;
    if (db?.user?.count) {
      userCount = await db.user.count();
      console.log('[Test DB] User count:', userCount);
    }
    
    // Test 4: Try to find a user
    let testUser = null;
    if (db?.user?.findFirst) {
      testUser = await db.user.findFirst();
      console.log('[Test DB] Found test user:', !!testUser);
    }
    
    return NextResponse.json({
      success: true,
      tests: {
        dbExists,
        userModelExists,
        userCount,
        hasTestUser: !!testUser,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Test DB] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}