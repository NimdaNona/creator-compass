import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const chatRequestSchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(1000),
  includeKnowledge: z.boolean().optional().default(true),
  context: z.object({
    type: z.string(),
    step: z.string().optional(),
    responses: z.record(z.any()).optional(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Debug Validation] Raw body:', JSON.stringify(body, null, 2));
    
    // Try to parse and show any validation errors
    try {
      const parsed = chatRequestSchema.parse(body);
      console.log('[Debug Validation] Parsed successfully:', parsed);
      return NextResponse.json({ 
        success: true, 
        parsed,
        message: 'Validation passed' 
      });
    } catch (zodError) {
      if (zodError instanceof z.ZodError) {
        console.error('[Debug Validation] Zod validation failed:', zodError.errors);
        return NextResponse.json({ 
          success: false,
          errors: zodError.errors,
          body,
          message: 'Validation failed' 
        }, { status: 400 });
      }
      throw zodError;
    }
  } catch (error) {
    console.error('[Debug Validation] Error:', error);
    return NextResponse.json({ 
      error: 'Failed to process request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}