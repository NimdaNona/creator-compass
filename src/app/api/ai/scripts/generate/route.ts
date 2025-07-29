import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scriptWriter } from '@/lib/ai/script-writer';
import { z } from 'zod';

const generateScriptSchema = z.object({
  platform: z.enum(['youtube', 'tiktok', 'twitch']),
  topic: z.string().min(1),
  duration: z.number().min(15).max(14400), // 15 seconds to 4 hours
  style: z.enum(['casual', 'professional', 'energetic', 'educational', 'inspirational']),
  outline: z.array(z.string()).optional(),
  targetAudience: z.string().optional(),
  includeHooks: z.boolean().optional().default(true),
  includeCTA: z.boolean().optional().default(true),
  keywords: z.array(z.string()).optional(),
  tone: z.string().optional(),
  references: z.array(z.string()).optional()
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = generateScriptSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const params = {
      ...validationResult.data,
      userId: session.user.id
    };

    // Generate script
    const script = await scriptWriter.generateScript(params);

    return NextResponse.json({
      success: true,
      script,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to generate script:', error);
    return NextResponse.json(
      { error: 'Failed to generate script' },
      { status: 500 }
    );
  }
}