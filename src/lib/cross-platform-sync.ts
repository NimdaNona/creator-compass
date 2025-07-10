import { prisma } from '@/lib/db';

export interface PlatformContent {
  id: string;
  platform: 'youtube' | 'tiktok' | 'twitch';
  title: string;
  description: string;
  format: string;
  duration?: number;
  tags: string[];
  metadata: Record<string, any>;
}

export interface ContentAdaptation {
  sourcePlatform: string;
  targetPlatform: string;
  adaptations: {
    title?: string;
    description?: string;
    format?: string;
    duration?: number;
    tags?: string[];
    suggestions: string[];
  };
}

export interface CrossPlatformStrategy {
  contentId: string;
  strategies: {
    platform: string;
    approach: string;
    modifications: string[];
    estimatedEffort: 'low' | 'medium' | 'high';
    tips: string[];
  }[];
}

export class CrossPlatformSyncService {
  // Platform-specific constraints
  private platformConstraints = {
    youtube: {
      titleMaxLength: 100,
      descriptionMaxLength: 5000,
      optimalDuration: { min: 8 * 60, max: 15 * 60 }, // 8-15 minutes
      formats: ['long-form', 'tutorial', 'vlog', 'review'],
      features: ['chapters', 'cards', 'end-screens', 'premieres']
    },
    tiktok: {
      titleMaxLength: 100,
      descriptionMaxLength: 2200,
      optimalDuration: { min: 15, max: 180 }, // 15 seconds to 3 minutes
      formats: ['short-form', 'trend', 'challenge', 'quick-tip'],
      features: ['effects', 'sounds', 'duets', 'stitches']
    },
    twitch: {
      titleMaxLength: 140,
      descriptionMaxLength: 300,
      optimalDuration: { min: 60 * 60, max: 8 * 60 * 60 }, // 1-8 hours
      formats: ['stream', 'gameplay', 'just-chatting', 'creative'],
      features: ['raids', 'bits', 'channel-points', 'clips']
    }
  };

  // Content adaptation rules
  private adaptationRules = {
    'youtube-to-tiktok': {
      title: 'Create catchy hook from first 3 seconds',
      description: 'Condense to key points with trending hashtags',
      format: 'Extract highlights or create series',
      suggestions: [
        'Break long video into multiple parts',
        'Focus on most engaging moments',
        'Add trending audio',
        'Use text overlays for key points',
        'Create teaser for full YouTube video'
      ]
    },
    'youtube-to-twitch': {
      title: 'Add stream schedule and topic',
      description: 'Include interaction prompts',
      format: 'Convert to live commentary format',
      suggestions: [
        'Plan audience interaction segments',
        'Prepare discussion points',
        'Set up alerts and overlays',
        'Create clips for highlights',
        'Schedule regular streaming times'
      ]
    },
    'tiktok-to-youtube': {
      title: 'Expand with detailed description',
      description: 'Add context and deeper explanation',
      format: 'Compile multiple TikToks or expand content',
      suggestions: [
        'Create compilation of related TikToks',
        'Add introduction and conclusion',
        'Expand on the topic in detail',
        'Include behind-the-scenes content',
        'Add educational value'
      ]
    },
    'tiktok-to-twitch': {
      title: 'Create stream title with trending topic',
      description: 'Add stream goals and interaction',
      format: 'Use as stream highlights or segments',
      suggestions: [
        'React to your TikToks live',
        'Create TikToks during stream',
        'Engage viewers in challenges',
        'Use TikTok trends as stream themes',
        'Create clips from stream for TikTok'
      ]
    },
    'twitch-to-youtube': {
      title: 'Create descriptive video title',
      description: 'Add timestamps and detailed info',
      format: 'Edit highlights or upload VODs',
      suggestions: [
        'Create highlight compilations',
        'Edit out downtime',
        'Add chapters for navigation',
        'Create themed videos from streams',
        'Include best moments montage'
      ]
    },
    'twitch-to-tiktok': {
      title: 'Extract catchy moment',
      description: 'Focus on viral potential',
      format: 'Clip best moments',
      suggestions: [
        'Use funny or epic moments',
        'Add captions and effects',
        'Time with trending sounds',
        'Create fail/win compilations',
        'Share memorable quotes'
      ]
    }
  };

  async adaptContent(
    sourceContent: PlatformContent,
    targetPlatform: 'youtube' | 'tiktok' | 'twitch'
  ): Promise<ContentAdaptation> {
    const adaptationKey = `${sourceContent.platform}-to-${targetPlatform}` as keyof typeof this.adaptationRules;
    const rules = this.adaptationRules[adaptationKey];

    if (!rules) {
      throw new Error(`No adaptation rules for ${sourceContent.platform} to ${targetPlatform}`);
    }

    const targetConstraints = this.platformConstraints[targetPlatform];
    const adaptations: ContentAdaptation['adaptations'] = {
      suggestions: rules.suggestions
    };

    // Adapt title
    if (sourceContent.title.length > targetConstraints.titleMaxLength) {
      adaptations.title = this.truncateWithEllipsis(
        sourceContent.title,
        targetConstraints.titleMaxLength - 3
      );
    }

    // Adapt description
    if (sourceContent.description.length > targetConstraints.descriptionMaxLength) {
      adaptations.description = this.summarizeDescription(
        sourceContent.description,
        targetConstraints.descriptionMaxLength
      );
    }

    // Adapt format
    if (!targetConstraints.formats.includes(sourceContent.format)) {
      adaptations.format = this.suggestFormat(
        sourceContent.format,
        targetConstraints.formats
      );
    }

    // Adapt duration
    if (sourceContent.duration) {
      const { min, max } = targetConstraints.optimalDuration;
      if (sourceContent.duration < min || sourceContent.duration > max) {
        adaptations.duration = this.suggestDuration(sourceContent.duration, min, max);
      }
    }

    // Adapt tags
    adaptations.tags = this.adaptTags(
      sourceContent.tags,
      sourceContent.platform,
      targetPlatform
    );

    return {
      sourcePlatform: sourceContent.platform,
      targetPlatform,
      adaptations
    };
  }

  async generateCrossPlatformStrategy(
    contentId: string,
    contentType: string
  ): Promise<CrossPlatformStrategy> {
    const strategies: CrossPlatformStrategy['strategies'] = [];

    // Define strategies based on content type
    const contentStrategies = {
      tutorial: {
        youtube: {
          approach: 'Create comprehensive tutorial with chapters',
          modifications: [
            'Add detailed introduction',
            'Include step-by-step sections',
            'Add troubleshooting section',
            'Include resource links'
          ],
          estimatedEffort: 'low' as const,
          tips: [
            'Use clear chapter markers',
            'Include visual demonstrations',
            'Provide downloadable resources'
          ]
        },
        tiktok: {
          approach: 'Break into quick tips series',
          modifications: [
            'Extract key steps as separate videos',
            'Create 60-second version',
            'Add text overlays',
            'Use trending tutorial format'
          ],
          estimatedEffort: 'medium' as const,
          tips: [
            'Start with the result',
            'Use fast-paced editing',
            'Add captions for accessibility'
          ]
        },
        twitch: {
          approach: 'Live tutorial with Q&A',
          modifications: [
            'Prepare for live demonstration',
            'Set up viewer interaction',
            'Create follow-along segments',
            'Plan troubleshooting discussions'
          ],
          estimatedEffort: 'high' as const,
          tips: [
            'Encourage questions in chat',
            'Prepare backup examples',
            'Have resources ready to share'
          ]
        }
      },
      entertainment: {
        youtube: {
          approach: 'Polished entertainment video',
          modifications: [
            'Add intro/outro',
            'Include multiple camera angles',
            'Add background music',
            'Create thumbnail variations'
          ],
          estimatedEffort: 'medium' as const,
          tips: [
            'Focus on storytelling',
            'Use engaging editing',
            'Optimize for watch time'
          ]
        },
        tiktok: {
          approach: 'Viral-focused short content',
          modifications: [
            'Hook in first 3 seconds',
            'Use trending sounds',
            'Add effects and filters',
            'Create loop-worthy ending'
          ],
          estimatedEffort: 'low' as const,
          tips: [
            'Follow current trends',
            'Use popular hashtags',
            'Encourage interactions'
          ]
        },
        twitch: {
          approach: 'Interactive entertainment stream',
          modifications: [
            'Plan audience games',
            'Set up alerts and rewards',
            'Create interactive segments',
            'Prepare conversation topics'
          ],
          estimatedEffort: 'medium' as const,
          tips: [
            'Engage with chat constantly',
            'Use channel point rewards',
            'Create memorable moments'
          ]
        }
      },
      educational: {
        youtube: {
          approach: 'In-depth educational content',
          modifications: [
            'Add visual aids and graphics',
            'Include citations',
            'Create summary sections',
            'Add quiz or exercises'
          ],
          estimatedEffort: 'high' as const,
          tips: [
            'Use clear structure',
            'Provide additional resources',
            'Include real-world examples'
          ]
        },
        tiktok: {
          approach: 'Bite-sized learning moments',
          modifications: [
            'Focus on one concept',
            'Use visual metaphors',
            'Add memorable hooks',
            'Create series for topics'
          ],
          estimatedEffort: 'medium' as const,
          tips: [
            'Make it memorable',
            'Use repetition effectively',
            'Link to full content'
          ]
        },
        twitch: {
          approach: 'Interactive learning session',
          modifications: [
            'Include live exercises',
            'Set up polls and quizzes',
            'Create study sessions',
            'Plan review segments'
          ],
          estimatedEffort: 'high' as const,
          tips: [
            'Encourage note-taking',
            'Answer questions live',
            'Create study communities'
          ]
        }
      }
    };

    const typeStrategies = contentStrategies[contentType as keyof typeof contentStrategies] || 
                         contentStrategies.entertainment;

    for (const [platform, strategy] of Object.entries(typeStrategies)) {
      strategies.push({
        platform,
        ...strategy
      });
    }

    return {
      contentId,
      strategies
    };
  }

  async syncContentAcrossPlatforms(
    userId: string,
    sourceContentId: string,
    targetPlatforms: string[]
  ): Promise<{
    synced: Array<{ platform: string; success: boolean; contentId?: string; error?: string }>;
    recommendations: string[];
  }> {
    const results = [];
    const recommendations: string[] = [];

    try {
      // Get source content
      const sourceContent = await prisma.generatedContent.findUnique({
        where: { id: sourceContentId }
      });

      if (!sourceContent) {
        throw new Error('Source content not found');
      }

      // Process each target platform
      for (const platform of targetPlatforms) {
        try {
          // Create adapted content
          const adaptedContent = await this.adaptContentForPlatform(
            sourceContent,
            platform as 'youtube' | 'tiktok' | 'twitch'
          );

          // Save to database
          const created = await prisma.generatedContent.create({
            data: {
              userId,
              platform,
              type: adaptedContent.type,
              title: adaptedContent.title,
              content: adaptedContent.content,
              metadata: adaptedContent.metadata
            }
          });

          results.push({
            platform,
            success: true,
            contentId: created.id
          });

          // Add platform-specific recommendations
          recommendations.push(
            ...this.getPlatformRecommendations(
              sourceContent.platform,
              platform
            )
          );
        } catch (error) {
          results.push({
            platform,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return {
        synced: results,
        recommendations: [...new Set(recommendations)] // Remove duplicates
      };
    } catch (error) {
      throw new Error(`Failed to sync content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async adaptContentForPlatform(
    sourceContent: any,
    targetPlatform: 'youtube' | 'tiktok' | 'twitch'
  ): Promise<any> {
    const platformContent: PlatformContent = {
      id: sourceContent.id,
      platform: sourceContent.platform,
      title: sourceContent.title,
      description: sourceContent.content.description || '',
      format: sourceContent.type,
      duration: sourceContent.metadata?.duration,
      tags: sourceContent.metadata?.tags || [],
      metadata: sourceContent.metadata || {}
    };

    const adaptation = await this.adaptContent(platformContent, targetPlatform);

    return {
      type: adaptation.adaptations.format || sourceContent.type,
      title: adaptation.adaptations.title || sourceContent.title,
      content: {
        ...sourceContent.content,
        description: adaptation.adaptations.description || sourceContent.content.description,
        adaptationNotes: adaptation.adaptations.suggestions
      },
      metadata: {
        ...sourceContent.metadata,
        duration: adaptation.adaptations.duration,
        tags: adaptation.adaptations.tags,
        sourcePlatform: sourceContent.platform,
        adapted: true
      }
    };
  }

  private getPlatformRecommendations(
    sourcePlatform: string,
    targetPlatform: string
  ): string[] {
    const key = `${sourcePlatform}-to-${targetPlatform}` as keyof typeof this.adaptationRules;
    return this.adaptationRules[key]?.suggestions || [];
  }

  private truncateWithEllipsis(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  private summarizeDescription(description: string, maxLength: number): string {
    // Simple summarization - in production, use AI
    const sentences = description.split('. ');
    let summary = '';
    
    for (const sentence of sentences) {
      if (summary.length + sentence.length + 2 <= maxLength) {
        summary += sentence + '. ';
      } else {
        break;
      }
    }

    return summary.trim();
  }

  private suggestFormat(currentFormat: string, availableFormats: string[]): string {
    // Map formats intelligently
    const formatMap: Record<string, Record<string, string>> = {
      'long-form': { 'short-form': 'highlight', 'stream': 'commentary' },
      'tutorial': { 'short-form': 'quick-tip', 'stream': 'workshop' },
      'vlog': { 'short-form': 'moment', 'stream': 'just-chatting' },
      'review': { 'short-form': 'recommendation', 'stream': 'discussion' }
    };

    const targetFormat = availableFormats[0];
    return formatMap[currentFormat]?.[targetFormat] || availableFormats[0];
  }

  private suggestDuration(current: number, min: number, max: number): number {
    if (current < min) return min;
    if (current > max) return max;
    return current;
  }

  private adaptTags(
    tags: string[],
    sourcePlatform: string,
    targetPlatform: string
  ): string[] {
    const platformHashtags: Record<string, string[]> = {
      youtube: ['tutorial', 'howto', 'youtube', 'creator'],
      tiktok: ['fyp', 'foryou', 'viral', 'trending'],
      twitch: ['live', 'streaming', 'twitch', 'gaming']
    };

    // Keep relevant tags and add platform-specific ones
    const adaptedTags = tags.filter(tag => tag.length <= 30);
    const platformTags = platformHashtags[targetPlatform] || [];
    
    return [...new Set([...adaptedTags, ...platformTags])].slice(0, 10);
  }

  async getContentSyncStatus(userId: string): Promise<{
    platforms: Array<{
      platform: string;
      contentCount: number;
      lastSync?: Date;
      syncEnabled: boolean;
    }>;
    suggestions: Array<{
      source: string;
      target: string;
      potentialContent: number;
      estimatedReach: string;
    }>;
  }> {
    // Get content distribution
    const contentByPlatform = await prisma.generatedContent.groupBy({
      by: ['platform'],
      where: { userId },
      _count: true,
      _max: {
        createdAt: true
      }
    });

    const platforms = ['youtube', 'tiktok', 'twitch'].map(platform => {
      const platformData = contentByPlatform.find(p => p.platform === platform);
      return {
        platform,
        contentCount: platformData?._count || 0,
        lastSync: platformData?._max.createdAt || undefined,
        syncEnabled: true
      };
    });

    // Generate sync suggestions
    const suggestions = [];
    for (const source of platforms) {
      if (source.contentCount > 0) {
        for (const target of platforms) {
          if (source.platform !== target.platform && target.contentCount < source.contentCount) {
            suggestions.push({
              source: source.platform,
              target: target.platform,
              potentialContent: source.contentCount - target.contentCount,
              estimatedReach: this.estimateReach(source.platform, target.platform, source.contentCount)
            });
          }
        }
      }
    }

    return { platforms, suggestions };
  }

  private estimateReach(source: string, target: string, contentCount: number): string {
    const reachMultipliers: Record<string, Record<string, number>> = {
      youtube: { tiktok: 2.5, twitch: 0.8 },
      tiktok: { youtube: 0.4, twitch: 0.6 },
      twitch: { youtube: 1.2, tiktok: 3.0 }
    };

    const multiplier = reachMultipliers[source]?.[target] || 1;
    const estimatedNewReach = contentCount * multiplier * 1000;

    if (estimatedNewReach >= 1000000) {
      return `${(estimatedNewReach / 1000000).toFixed(1)}M`;
    } else if (estimatedNewReach >= 1000) {
      return `${(estimatedNewReach / 1000).toFixed(0)}K`;
    }
    return estimatedNewReach.toFixed(0);
  }
}

export const crossPlatformSync = new CrossPlatformSyncService();