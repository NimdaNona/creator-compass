import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a new instance directly
const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('[Test Direct] Creating new PrismaClient...');
    
    // Test direct Prisma usage
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      userCount,
      prismaExists: !!prisma,
      userModelExists: !!prisma.user,
    });
  } catch (error: any) {
    console.error('[Test Direct] Error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}