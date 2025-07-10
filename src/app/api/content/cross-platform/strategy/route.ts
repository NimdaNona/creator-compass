import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { crossPlatformSync } from '@/lib/cross-platform-sync';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contentId, contentType } = body;

    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'Content ID and type are required' },
        { status: 400 }
      );
    }

    // Generate cross-platform strategy
    const strategy = await crossPlatformSync.generateCrossPlatformStrategy(
      contentId,
      contentType
    );

    return NextResponse.json(strategy);

  } catch (error) {
    console.error('Error generating strategy:', error);
    return NextResponse.json(
      { error: 'Failed to generate strategy' },
      { status: 500 }
    );
  }
}