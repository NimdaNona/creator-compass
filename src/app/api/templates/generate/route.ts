import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TemplateEngine } from '@/lib/template-system';
import { trackUsage } from '@/lib/usage';
import { withSubscription, checkFeatureLimit, incrementFeatureUsage } from '@/app/api/middleware/subscription-check';

export const POST = withSubscription(async (request: Request, subscriptionCheck) => {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { templateId, values, save = false } = body;

    if (!templateId || !values) {
      return NextResponse.json(
        { error: 'Template ID and values are required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check feature limits using new middleware
    const featureCheck = await checkFeatureLimit(user.id, 'templates', subscriptionCheck.isFreeTier);
    if (!featureCheck.allowed) {
      return NextResponse.json(
        { 
          error: featureCheck.error,
          limit: featureCheck.limit,
          used: featureCheck.used,
          requiresUpgrade: true,
          currentPlan: subscriptionCheck.subscription?.plan || 'free'
        },
        { status: 403 }
      );
    }

    // Get template (either from DB or sample templates)
    let template = null;
    
    // First check database
    const dbTemplate = await prisma.generatedTemplate.findUnique({
      where: { id: templateId }
    });

    if (dbTemplate) {
      template = {
        id: dbTemplate.id,
        category: dbTemplate.category,
        type: dbTemplate.type,
        title: dbTemplate.title,
        content: dbTemplate.content as any,
        variables: dbTemplate.variables as any,
        platform: dbTemplate.platform,
        niche: dbTemplate.niche
      };
    } else {
      // Check sample templates
      const { SAMPLE_TEMPLATES } = await import('@/lib/template-system');
      template = SAMPLE_TEMPLATES.find(t => t.id === templateId);
    }

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Validate variables
    const validation = TemplateEngine.validateVariables(
      template.variables || [],
      values
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Invalid template values', errors: validation.errors },
        { status: 400 }
      );
    }

    // Process template
    const processed = TemplateEngine.processTemplate(
      typeof template.content === 'string' ? template.content : JSON.stringify(template.content),
      values
    );

    // Update usage using new middleware
    await incrementFeatureUsage(user.id, 'templates');

    // Save to user's library if requested
    let savedTemplate = null;
    if (save) {
      savedTemplate = await prisma.generatedTemplate.create({
        data: {
          userId: user.id,
          category: template.category,
          type: template.type,
          title: `${template.title} (Custom)`,
          content: processed,
          variables: values,
          platform: template.platform,
          niche: template.niche
        }
      });
    }

    // Update template usage count if from database
    if (dbTemplate) {
      await prisma.generatedTemplate.update({
        where: { id: dbTemplate.id },
        data: { uses: { increment: 1 } }
      });
    }

    return NextResponse.json({
      success: true,
      preview: processed,
      template: {
        ...template,
        content: processed
      },
      savedId: savedTemplate?.id
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    );
  }
}, 'free', 'Template generation');