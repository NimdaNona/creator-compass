import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Test inline db creation
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      success: true,
      userCount,
      message: 'Direct Prisma works!'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      message: 'Direct Prisma failed'
    }, { status: 500 });
  }
}