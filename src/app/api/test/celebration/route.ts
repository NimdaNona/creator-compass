import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Test endpoint to trigger a celebration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Trigger a test celebration
    const celebrationResponse = await fetch(new URL('/api/celebrations', request.url).toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': request.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        type: 'test',
        title: '🎉 Test Celebration!',
        message: 'This is a test celebration to verify the system is working correctly.',
        icon: '🎉',
        color: '#8B5CF6',
        animation: 'confetti',
        duration: 5000
      })
    });

    if (!celebrationResponse.ok) {
      throw new Error('Failed to create celebration');
    }

    const data = await celebrationResponse.json();

    return NextResponse.json({ 
      success: true, 
      message: 'Test celebration triggered!',
      celebration: data.celebration
    });

  } catch (error) {
    console.error('Error triggering test celebration:', error);
    return NextResponse.json(
      { error: 'Failed to trigger test celebration' },
      { status: 500 }
    );
  }
}