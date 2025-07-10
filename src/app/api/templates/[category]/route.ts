import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { SAMPLE_TEMPLATES } from '@/lib/template-system';

export async function GET(
  request: Request,
  { params }: { params: { category: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const platform = searchParams.get('platform');
    const niche = searchParams.get('niche');

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        profile: true,
        subscription: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isPremium = user.subscription?.status === 'active';

    // Build query filters
    const filters: any = {
      category: params.category
    };

    if (type) filters.type = type;
    if (platform || user.profile?.selectedPlatform) {
      filters.platform = platform || user.profile?.selectedPlatform;
    }
    if (niche || user.profile?.selectedNiche) {
      filters.niche = niche || user.profile?.selectedNiche;
    }

    // Get templates from database
    const dbTemplates = await prisma.generatedTemplate.findMany({
      where: {
        ...filters,
        OR: [
          { isPublic: true },
          { userId: user.id }
        ]
      },
      orderBy: [
        { rating: 'desc' },
        { uses: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50
    });

    // Combine with sample templates (for now)
    const sampleTemplatesForCategory = SAMPLE_TEMPLATES.filter(t => 
      t.category === params.category &&
      (!filters.type || t.type === filters.type) &&
      (!filters.platform || t.platform === filters.platform)
    );

    // Transform database templates to match template interface
    const templates = [
      ...sampleTemplatesForCategory,
      ...dbTemplates.map(t => ({
        id: t.id,
        category: t.category,
        type: t.type,
        title: t.title,
        description: `Created ${new Date(t.createdAt).toLocaleDateString()}`,
        content: t.content,
        variables: t.variables,
        platform: t.platform,
        niche: t.niche,
        rating: t.rating,
        uses: t.uses,
        isUserTemplate: t.userId === user.id
      }))
    ];

    // Mark premium templates
    const templatesWithAccess = templates.map(template => ({
      ...template,
      locked: !isPremium && template.type === 'advanced'
    }));

    return NextResponse.json({ 
      templates: templatesWithAccess,
      total: templatesWithAccess.length
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}