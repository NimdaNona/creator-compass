import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { communityService } from '@/lib/community/community-service';
import { z } from 'zod';

const createReplySchema = z.object({
  content: z.string().min(1).max(5000),
  parentReplyId: z.string().optional()
});

export async function GET(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    
    const pagination = {
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0')
    };

    const result = await communityService.getReplies(params.postId, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get replies:', error);
    return NextResponse.json(
      { error: 'Failed to get replies' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { postId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createReplySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const reply = await communityService.createReply(
      params.postId,
      session.user.id,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error('Failed to create reply:', error);
    return NextResponse.json(
      { error: 'Failed to create reply' },
      { status: 500 }
    );
  }
}