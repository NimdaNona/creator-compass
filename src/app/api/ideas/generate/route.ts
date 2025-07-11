import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { trackUsage } from '@/lib/usage';
import { contentIdeasByNiche } from '@/data/contentIdeas';

// Schema for generating ideas
const generateIdeaSchema = z.object({
  platform: z.string().optional(),
  niche: z.string().optional(),
  category: z.string().optional(),
  contentType: z.string().optional()
});

// Map niche IDs to our data keys
const nicheMapping: Record<string, string> = {
  'gaming': 'gaming',
  'beauty-fashion': 'beauty',
  'tech-reviews': 'tech',
  'entertainment': 'entertainment',
  'educational': 'educational',
  'fitness-health': 'beauty', // Using beauty data as placeholder
  'food-cooking': 'entertainment', // Using entertainment as placeholder
  'travel': 'educational', // Using educational as placeholder
  'business': 'tech', // Using tech as placeholder
  'art-music': 'entertainment' // Using entertainment as placeholder
};

function getRandomIdeas(nicheKey: string, count: number = 3) {
  const nicheIdeas = contentIdeasByNiche[nicheKey];
  if (!nicheIdeas) return [];

  // Combine all difficulty levels
  const allIdeas = [
    ...nicheIdeas.beginner,
    ...nicheIdeas.intermediate,
    ...nicheIdeas.advanced
  ];

  // Shuffle and pick random ideas
  const shuffled = allIdeas.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function filterIdeasByPreferences(ideas: any[], category?: string, contentType?: string) {
  let filtered = [...ideas];

  if (category && category !== 'all') {
    filtered = filtered.filter(idea => idea.category === category);
  }

  if (contentType && contentType !== 'all') {
    filtered = filtered.filter(idea => idea.contentType === contentType);
  }

  // If filtering reduced results too much, add some random ones
  if (filtered.length < 3) {
    const remaining = ideas.filter(idea => !filtered.includes(idea));
    const additional = remaining.slice(0, 3 - filtered.length);
    filtered = [...filtered, ...additional];
  }

  return filtered.slice(0, 3);
}

// POST /api/ideas/generate - Generate content ideas
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscription: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { niche, category, contentType } = generateIdeaSchema.parse(body);

    // Track usage for free tier limits
    const isActive = user.subscription?.status === 'active';
    if (!isActive) {
      const usageCheck = await trackUsage(user.id, 'ideas', false);
      if (!usageCheck.allowed) {
        return NextResponse.json(
          { 
            error: 'Daily idea limit reached',
            upgradeRequired: true
          },
          { status: 403 }
        );
      }
    }

    // Get the appropriate niche key
    const nicheKey = nicheMapping[niche || 'gaming'] || 'gaming';
    
    // Get random ideas from the niche
    const baseIdeas = getRandomIdeas(nicheKey, 10);
    
    // Filter by preferences
    const filteredIdeas = filterIdeasByPreferences(baseIdeas, category, contentType);

    // Transform ideas to match frontend format
    const ideas = filteredIdeas.map((idea, index) => ({
      id: `generated-${Date.now()}-${index}`,
      title: idea.title,
      description: idea.description,
      hook: generateHook(idea),
      contentType: idea.contentType,
      category: idea.category,
      estimatedEngagement: idea.viralityPotential,
      difficulty: idea.difficulty,
      keywords: idea.keywords,
      format: getFormat(idea.contentType),
      platform: body.platform || 'general'
    }));

    // Track the generation
    if (!isActive) {
      await trackUsage(user.id, 'ideas', true);
    }

    return NextResponse.json({ ideas });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error generating ideas:', error);
    return NextResponse.json(
      { error: 'Failed to generate ideas' },
      { status: 500 }
    );
  }
}

function generateHook(idea: any): string {
  const hooks = [
    `The secret to ${idea.title.toLowerCase()} that nobody talks about...`,
    `Why ${idea.title.toLowerCase()} will change everything...`,
    `Stop making these mistakes with ${idea.title.toLowerCase()}...`,
    `The truth about ${idea.title.toLowerCase()} revealed...`,
    `How to master ${idea.title.toLowerCase()} in record time...`,
    `What I learned from ${idea.title.toLowerCase()}...`,
    `The hidden benefits of ${idea.title.toLowerCase()}...`,
    `${idea.title} changed my life - here's how...`
  ];
  
  return hooks[Math.floor(Math.random() * hooks.length)];
}

function getFormat(contentType: string): string {
  const formats: Record<string, string> = {
    'video': 'Video Content',
    'short': 'Short-Form',
    'stream': 'Live Stream',
    'series': 'Content Series',
    'post': 'Social Post'
  };
  
  return formats[contentType] || 'General Content';
}