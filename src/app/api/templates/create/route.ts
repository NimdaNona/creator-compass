import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { trackUsage } from '@/lib/usage';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      type,
      platform,
      niche,
      content,
      variables,
      isPublic = false,
    } = body;

    // Validate required fields
    if (!title || !category || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check usage limits for custom templates
    const usage = await trackUsage(user.id, 'templates');
    if (!usage.allowed) {
      return NextResponse.json(
        { 
          error: 'Template creation limit reached',
          limit: usage.limit,
          used: usage.used,
          resetAt: usage.resetAt
        },
        { status: 403 }
      );
    }

    // Create template
    const template = await prisma.generatedTemplate.create({
      data: {
        userId: user.id,
        category,
        type,
        title,
        content,
        variables: variables || [],
        platform: platform || 'all',
        niche: niche || 'general',
        isPublic,
        rating: 0,
        uses: 0,
      },
    });

    // Update usage
    await trackUsage(user.id, 'templates', true);

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        category: template.category,
        type: template.type,
        title: template.title,
        description,
        content: template.content,
        variables: template.variables,
        platform: template.platform,
        niche: template.niche,
      },
    });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}