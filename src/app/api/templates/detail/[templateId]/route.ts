import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SAMPLE_TEMPLATES } from '@/lib/template-system';

export async function GET(
  request: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First check database
    const dbTemplate = await prisma.generatedTemplate.findUnique({
      where: { id: params.templateId }
    });

    if (dbTemplate) {
      return NextResponse.json({
        template: {
          id: dbTemplate.id,
          category: dbTemplate.category,
          type: dbTemplate.type,
          title: dbTemplate.title,
          description: `Created ${new Date(dbTemplate.createdAt).toLocaleDateString()}`,
          content: dbTemplate.content,
          variables: dbTemplate.variables,
          platform: dbTemplate.platform,
          niche: dbTemplate.niche
        }
      });
    }

    // Check sample templates
    const sampleTemplate = SAMPLE_TEMPLATES.find(t => t.id === params.templateId);
    
    if (sampleTemplate) {
      return NextResponse.json({ template: sampleTemplate });
    }

    return NextResponse.json({ error: 'Template not found' }, { status: 404 });

  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}