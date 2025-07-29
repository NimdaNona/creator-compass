import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scriptWriter } from '@/lib/ai/script-writer';
import { z } from 'zod';

const optimizeScriptSchema = z.object({
  optimizationType: z.enum(['engagement', 'retention', 'conversion'])
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = optimizeScriptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Optimize script
    const optimizedScript = await scriptWriter.optimizeScript(
      params.id,
      validationResult.data.optimizationType
    );

    return NextResponse.json({
      success: true,
      script: optimizedScript,
      optimizedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to optimize script:', error);
    return NextResponse.json(
      { error: 'Failed to optimize script' },
      { status: 500 }
    );
  }
}