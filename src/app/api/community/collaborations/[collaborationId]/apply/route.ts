import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { collaborationService } from '@/lib/community/collaboration-service';
import { z } from 'zod';

const applySchema = z.object({
  message: z.string().min(10).max(1000),
  portfolio: z.array(z.string().url()).optional()
});

export async function POST(
  request: Request,
  { params }: { params: { collaborationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = applySchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const application = await collaborationService.applyToCollaboration(
      params.collaborationId,
      session.user.id,
      validationResult.data
    );

    return NextResponse.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Failed to apply to collaboration:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to apply' },
      { status: 500 }
    );
  }
}