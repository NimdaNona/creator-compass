import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scriptWriter } from '@/lib/ai/script-writer';
import { z } from 'zod';

const exportScriptSchema = z.object({
  format: z.enum(['text', 'pdf', 'teleprompter'])
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'text';

    // Validate format
    const validationResult = exportScriptSchema.safeParse({ format });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid export format' },
        { status: 400 }
      );
    }

    // Export script
    const exported = await scriptWriter.exportScript(
      params.id,
      validationResult.data.format
    );

    // Return appropriate response based on format
    if (validationResult.data.format === 'text' || validationResult.data.format === 'teleprompter') {
      return new NextResponse(exported as string, {
        headers: {
          'Content-Type': 'text/plain',
          'Content-Disposition': `attachment; filename="script-${params.id}.txt"`
        }
      });
    }

    // For PDF (not implemented yet)
    return NextResponse.json(
      { error: 'PDF export not yet implemented' },
      { status: 501 }
    );
  } catch (error) {
    console.error('Failed to export script:', error);
    return NextResponse.json(
      { error: 'Failed to export script' },
      { status: 500 }
    );
  }
}