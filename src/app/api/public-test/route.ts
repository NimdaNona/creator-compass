import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'This is a public test endpoint',
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  try {
    // Test dynamic import
    const { db } = await import('@/lib/db');
    
    const dbInfo = {
      dbExists: !!db,
      dbType: typeof db,
      dbUser: db ? !!db.user : false,
    };
    
    return NextResponse.json({ 
      message: 'Public POST test successful',
      dbInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 3),
    }, { status: 500 });
  }
}