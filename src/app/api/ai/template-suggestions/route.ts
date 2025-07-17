import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { chatCompletionStream } from '@/lib/ai/openai';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const templateSuggestionsSchema = z.object({
  userLevel: z.string().optional(),
  platform: z.string().optional(),
  niche: z.string().optional(),
  includetrends: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userLevel, platform, niche, includetrends } = templateSuggestionsSchema.parse(body);

    // Get user data and recent templates
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
        templateUses: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            template: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get available templates
    const templates = await prisma.template.findMany({
      where: {
        ...(platform && { platform }),
        ...(niche && { tags: { has: niche } }),
      },
      orderBy: { uses: 'desc' },
      take: 50,
    });

    // Build context for AI
    const userContext = {
      level: userLevel || user.profile?.creatorLevel || 'beginner',
      platform: platform || user.profile?.primaryPlatform || 'youtube',
      niche: niche || user.profile?.niche || 'general',
      recentTemplates: user.templateUses.map(tu => tu.template?.title).filter(Boolean),
      goals: user.profile?.goals || [],
    };

    const systemPrompt = `You are an AI assistant for Creator Compass, specializing in content template recommendations.

User Context:
- Creator Level: ${userContext.level}
- Platform: ${userContext.platform}
- Niche: ${userContext.niche}
- Recent Templates Used: ${userContext.recentTemplates.join(', ') || 'None'}
- Goals: ${userContext.goals.join(', ') || 'General growth'}

Available Templates:
${templates.map(t => `- ${t.title} (${t.category}, ${t.type}) - ${t.description}`).join('\n')}

Your task is to suggest personalized templates based on:
1. User's experience level and platform
2. Current content trends in their niche
3. Templates they haven't used recently
4. Templates that align with their goals

For each suggestion, provide:
- Relevance score (0-100)
- Reason why it's recommended
- Estimated time to complete
- Potential reach/impact
- Difficulty level

Also identify 3-5 trending topics in their niche with associated template types.

Respond with a JSON object containing:
{
  "suggestions": [array of template suggestions],
  "trending": [array of trending topics]
}`;

    const userPrompt = `Generate personalized template suggestions for this creator. Focus on templates that will help them grow and improve their content quality. Include trending topics if requested: ${includetrends}`;

    // Create streaming response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Process AI response
    (async () => {
      try {
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          { role: 'user' as const, content: userPrompt },
        ];

        const aiStream = await chatCompletionStream(messages);
        let fullResponse = '';

        for await (const chunk of aiStream) {
          if (chunk.content) {
            fullResponse += chunk.content;
          }
        }

        // Parse AI response
        try {
          const parsed = JSON.parse(fullResponse);
          
          // Map AI suggestions to template IDs
          const suggestions = parsed.suggestions?.map((s: any) => {
            const matchingTemplate = templates.find(t => 
              t.title.toLowerCase().includes(s.title?.toLowerCase() || '') ||
              s.title?.toLowerCase().includes(t.title.toLowerCase())
            );

            return {
              id: matchingTemplate?.id || `ai-${Date.now()}-${Math.random()}`,
              title: s.title || matchingTemplate?.title || 'Custom Template',
              description: s.description || matchingTemplate?.description || '',
              category: matchingTemplate?.category || 'custom',
              type: matchingTemplate?.type || 'general',
              platform: userContext.platform,
              relevanceScore: s.relevanceScore || 80,
              trendingScore: s.trendingScore,
              reason: s.reason || 'Recommended for your content style',
              estimatedTime: s.estimatedTime || '30 mins',
              potentialReach: s.potentialReach || 'Medium',
              difficulty: s.difficulty || 'intermediate',
              aiGenerated: !matchingTemplate,
            };
          }) || [];

          // Send suggestions
          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            suggestions: suggestions.slice(0, 10) 
          })}\n\n`));

          // Send trending topics if requested
          if (includetrends && parsed.trending) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ 
              trending: parsed.trending.slice(0, 5) 
            })}\n\n`));
          }

        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          // Fallback to template-based suggestions
          const fallbackSuggestions = templates.slice(0, 5).map(t => ({
            id: t.id,
            title: t.title,
            description: t.description || '',
            category: t.category,
            type: t.type,
            platform: t.platform,
            relevanceScore: Math.floor(Math.random() * 30) + 70,
            reason: 'Popular in your niche',
            estimatedTime: '30 mins',
            potentialReach: 'Medium',
            difficulty: 'intermediate' as const,
          }));

          await writer.write(encoder.encode(`data: ${JSON.stringify({ 
            suggestions: fallbackSuggestions 
          })}\n\n`));
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      } catch (error) {
        console.error('Stream processing error:', error);
        await writer.write(encoder.encode(`data: ${JSON.stringify({ 
          error: 'Failed to generate suggestions' 
        })}\n\n`));
      } finally {
        await writer.close();
      }
    })();

    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Template suggestions API error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}