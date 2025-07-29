import { openai } from '@/lib/openai';
import { prisma } from '@/lib/db';
import { Platform, Niche } from '@/types';

export interface TrendData {
  topic: string;
  searchVolume: number;
  trendingScore: number;
  competitionLevel: 'low' | 'medium' | 'high';
  growthRate: number;
  relatedKeywords: string[];
}

export interface ContentIdea {
  id: string;
  title: string;
  description: string;
  platform: Platform['id'];
  niche: Niche['id'];
  format: string;
  estimatedDuration?: number;
  targetAudience: string;
  hooks: string[];
  keywords: string[];
  trendingTopics: string[];
  uniqueAngle: string;
  estimatedEngagement: {
    views: { min: number; max: number };
    engagement: { min: number; max: number };
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  productionTime: string;
  requiredResources: string[];
  contentStructure: {
    introduction: string;
    mainPoints: string[];
    callToAction: string;
  };
  thumbnailConcepts: string[];
  createdAt: Date;
}

export interface IdeaGenerationParams {
  userId: string;
  platform: Platform['id'];
  niche: Niche['id'];
  targetAudience?: string;
  contentGoals?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferences?: {
    contentLength?: 'short' | 'medium' | 'long';
    style?: 'educational' | 'entertainment' | 'motivational' | 'informational';
    frequency?: 'daily' | 'weekly' | 'biweekly';
  };
}

export class ContentIdeaGenerator {
  private readonly trendSources = {
    youtube: ['YouTube Trends', 'Google Trends', 'VidIQ', 'TubeBuddy'],
    tiktok: ['TikTok Discover', 'Trending Sounds', 'Hashtag Challenges'],
    twitch: ['Twitch Browse', 'Popular Categories', 'Trending Games']
  };

  async generateIdeas(params: IdeaGenerationParams): Promise<ContentIdea[]> {
    try {
      // Get user's content history and performance
      const userContent = await this.getUserContentHistory(params.userId);
      const trendData = await this.analyzeTrends(params.platform, params.niche);
      
      const systemPrompt = this.buildSystemPrompt(params);
      const userPrompt = this.buildUserPrompt(params, userContent, trendData);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      const ideas = this.parseIdeasResponse(response, params);
      
      // Store generated ideas for future reference
      await this.storeGeneratedIdeas(params.userId, ideas);
      
      return ideas;
    } catch (error) {
      console.error('Error generating content ideas:', error);
      throw new Error('Failed to generate content ideas');
    }
  }

  async analyzeTrends(platform: string, niche: string): Promise<TrendData[]> {
    // Simulate trend analysis with realistic data
    const trendKeywords = this.getTrendKeywords(platform, niche);
    
    return trendKeywords.map((keyword, index) => ({
      topic: keyword,
      searchVolume: Math.floor(Math.random() * 100000) + 10000,
      trendingScore: Math.random() * 100,
      competitionLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      growthRate: (Math.random() * 50) - 10, // -10% to +40% growth
      relatedKeywords: this.getRelatedKeywords(keyword, platform)
    }));
  }

  private getTrendKeywords(platform: string, niche: string): string[] {
    const nicheTrends: Record<string, string[]> = {
      gaming: ['speedruns', 'indie games', 'gaming setup', 'pro tips', 'easter eggs'],
      tech: ['AI tools', 'productivity apps', 'tech reviews', 'coding tutorials', 'gadgets'],
      fitness: ['home workouts', 'nutrition tips', 'transformation', 'workout challenges', 'recovery'],
      cooking: ['quick recipes', 'meal prep', 'kitchen hacks', 'fusion cuisine', 'dietary'],
      music: ['cover songs', 'music production', 'instrument tutorials', 'music theory', 'gear reviews'],
      art: ['digital art', 'tutorials', 'art challenges', 'speed painting', 'art supplies'],
      vlog: ['day in life', 'travel vlogs', 'lifestyle', 'routines', 'challenges'],
      education: ['study tips', 'online courses', 'career advice', 'skill development', 'tutorials'],
      business: ['entrepreneurship', 'marketing tips', 'case studies', 'productivity', 'leadership'],
      beauty: ['makeup tutorials', 'skincare', 'hauls', 'transformations', 'product reviews']
    };

    return nicheTrends[niche] || ['trending', 'viral', 'popular', 'new', 'best'];
  }

  private getRelatedKeywords(keyword: string, platform: string): string[] {
    // Generate contextually relevant keywords
    const relatedMap: Record<string, string[]> = {
      'speedruns': ['world record', 'any%', 'glitchless', 'tutorial', 'strategy'],
      'AI tools': ['ChatGPT', 'automation', 'workflow', 'productivity', 'future'],
      'home workouts': ['no equipment', 'HIIT', 'beginner friendly', 'quick', 'effective'],
      'quick recipes': ['5 minute', 'one pot', 'meal prep', 'healthy', 'budget'],
      'cover songs': ['acoustic', 'remix', 'mashup', 'original arrangement', 'collab']
    };

    return relatedMap[keyword] || [
      `best ${keyword}`,
      `${keyword} tutorial`,
      `${keyword} tips`,
      `${keyword} guide`,
      `${keyword} 2024`
    ];
  }

  private buildSystemPrompt(params: IdeaGenerationParams): string {
    return `You are an expert content strategist specializing in ${params.platform} content creation for the ${params.niche} niche. 
    
Your task is to generate creative, trending, and highly engaging content ideas that will help creators grow their audience and increase engagement.

Consider:
- Platform-specific best practices and formats
- Current trends and viral content patterns
- Audience psychology and engagement triggers
- SEO and discoverability factors
- Content production feasibility

Provide detailed, actionable content ideas with specific implementation strategies.

Return your response as a JSON object with an 'ideas' array containing 5 content ideas.`;
  }

  private buildUserPrompt(
    params: IdeaGenerationParams, 
    userContent: any,
    trends: TrendData[]
  ): string {
    const trendSummary = trends
      .slice(0, 3)
      .map(t => `${t.topic} (${t.trendingScore.toFixed(0)}% trending, ${t.competitionLevel} competition)`)
      .join(', ');

    return `Generate 5 unique content ideas for a ${params.experienceLevel || 'intermediate'} ${params.platform} creator in the ${params.niche} niche.

Target Audience: ${params.targetAudience || 'General audience interested in ' + params.niche}
Content Goals: ${params.contentGoals?.join(', ') || 'Grow audience and increase engagement'}
Current Trends: ${trendSummary}
Preferred Style: ${params.preferences?.style || 'mixed'}
Content Length: ${params.preferences?.contentLength || 'medium'}

Each idea should include:
- Catchy title
- Detailed description
- Content format (video type, duration, etc.)
- Target audience specifics
- 3-5 compelling hooks
- Relevant keywords and hashtags
- Trending topics to incorporate
- Unique angle that sets it apart
- Estimated engagement metrics
- Production difficulty and time
- Required resources
- Content structure (intro, main points, CTA)
- 2-3 thumbnail concepts

Make the ideas specific, actionable, and tailored to current ${params.platform} algorithms and audience preferences.`;
  }

  private parseIdeasResponse(response: any, params: IdeaGenerationParams): ContentIdea[] {
    if (!response.ideas || !Array.isArray(response.ideas)) {
      throw new Error('Invalid response format from AI');
    }

    return response.ideas.map((idea: any, index: number) => ({
      id: `idea-${Date.now()}-${index}`,
      title: idea.title || 'Untitled Idea',
      description: idea.description || '',
      platform: params.platform,
      niche: params.niche,
      format: idea.format || this.getDefaultFormat(params.platform),
      estimatedDuration: idea.estimatedDuration,
      targetAudience: idea.targetAudience || params.targetAudience || 'General audience',
      hooks: idea.hooks || [],
      keywords: idea.keywords || [],
      trendingTopics: idea.trendingTopics || [],
      uniqueAngle: idea.uniqueAngle || '',
      estimatedEngagement: idea.estimatedEngagement || {
        views: { min: 1000, max: 10000 },
        engagement: { min: 5, max: 15 }
      },
      difficulty: idea.difficulty || 'intermediate',
      productionTime: idea.productionTime || '2-4 hours',
      requiredResources: idea.requiredResources || [],
      contentStructure: idea.contentStructure || {
        introduction: '',
        mainPoints: [],
        callToAction: ''
      },
      thumbnailConcepts: idea.thumbnailConcepts || [],
      createdAt: new Date()
    }));
  }

  private getDefaultFormat(platform: string): string {
    const formats: Record<string, string> = {
      youtube: 'Standard Video (8-12 minutes)',
      tiktok: 'Short-form Video (15-60 seconds)',
      twitch: 'Live Stream (2-4 hours)'
    };
    return formats[platform] || 'Standard Content';
  }

  private async getUserContentHistory(userId: string) {
    // Get user's content performance history
    try {
      const recentContent = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          profile: {
            select: {
              contentHistory: true,
              topPerformingContent: true,
              audienceInsights: true
            }
          }
        }
      });
      return recentContent?.profile || {};
    } catch (error) {
      console.error('Error fetching user content history:', error);
      return {};
    }
  }

  private async storeGeneratedIdeas(userId: string, ideas: ContentIdea[]) {
    try {
      // Store ideas in database for future reference and tracking
      const storedIdeas = await Promise.all(
        ideas.map(idea => 
          prisma.generatedContent.create({
            data: {
              userId,
              type: 'idea',
              title: idea.title,
              content: JSON.stringify(idea),
              platform: idea.platform,
              status: 'draft'
            }
          })
        )
      );
      return storedIdeas;
    } catch (error) {
      console.error('Error storing generated ideas:', error);
      // Non-critical error, don't throw
    }
  }

  async getIdea(userId: string, ideaId: string): Promise<ContentIdea | null> {
    try {
      const stored = await prisma.generatedContent.findFirst({
        where: {
          userId,
          id: ideaId,
          type: 'idea'
        }
      });

      if (!stored) return null;
      
      return JSON.parse(stored.content as string) as ContentIdea;
    } catch (error) {
      console.error('Error retrieving idea:', error);
      return null;
    }
  }

  async updateIdeaStatus(
    userId: string, 
    ideaId: string, 
    status: 'draft' | 'in_progress' | 'published' | 'archived'
  ): Promise<boolean> {
    try {
      await prisma.generatedContent.updateMany({
        where: {
          userId,
          id: ideaId,
          type: 'idea'
        },
        data: { status }
      });
      return true;
    } catch (error) {
      console.error('Error updating idea status:', error);
      return false;
    }
  }
}

export const contentIdeaGenerator = new ContentIdeaGenerator();