import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { proactiveAssistance } from '@/lib/ai/proactive-assistance';

// Get active suggestions for the current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const suggestions = await proactiveAssistance.getActiveSuggestions(session.user.id);

    return NextResponse.json({
      suggestions,
      count: suggestions.length
    });

  } catch (error) {
    console.error('Get suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

// Dismiss a suggestion
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { suggestionId } = await req.json();

    if (!suggestionId) {
      return NextResponse.json(
        { error: 'suggestionId required' },
        { status: 400 }
      );
    }

    await proactiveAssistance.dismissSuggestion(suggestionId, session.user.id);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Dismiss suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss suggestion' },
      { status: 500 }
    );
  }
}