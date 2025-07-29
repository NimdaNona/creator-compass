import { openai } from '@/lib/openai';
import { prisma } from '@/lib/db';

export interface ThumbnailAnalysis {
  id: string;
  imageUrl: string;
  platform: string;
  scores: {
    overall: number;
    eyeCatch: number;
    clarity: number;
    emotion: number;
    textReadability: number;
    colorContrast: number;
    composition: number;
  };
  elements: {
    faces: {
      count: number;
      expressions: string[];
      prominence: 'high' | 'medium' | 'low';
    };
    text: {
      present: boolean;
      readable: boolean;
      content: string[];
      fontSize: 'appropriate' | 'too_small' | 'too_large';
    };
    colors: {
      dominant: string[];
      contrast: number;
      mood: string;
    };
    composition: {
      balance: 'balanced' | 'left_heavy' | 'right_heavy' | 'center_heavy';
      ruleOfThirds: boolean;
      focusPoint: { x: number; y: number };
    };
  };
  recommendations: {
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    impact: string;
  }[];
  platformOptimizations: {
    youtube?: {
      mobileOptimized: boolean;
      textVisibleAtSmallSize: boolean;
      competesWellInSidebar: boolean;
    };
    tiktok?: {
      verticalOptimized: boolean;
      catchesScrollingAttention: boolean;
    };
  };
  competitorComparison?: {
    betterThan: number; // percentage
    averageScore: number;
    topPerformers: string[];
  };
  createdAt: Date;
}

export interface ThumbnailGenerationParams {
  title: string;
  style: 'minimalist' | 'bold' | 'professional' | 'playful' | 'dramatic';
  platform: 'youtube' | 'tiktok' | 'twitch';
  elements?: {
    includeText?: boolean;
    includeFace?: boolean;
    includeGraphics?: boolean;
    includeBackground?: boolean;
  };
  colorScheme?: 'vibrant' | 'muted' | 'monochrome' | 'complementary' | 'analogous';
  mood?: string;
  targetAudience?: string;
  competitors?: string[];
}

export interface GeneratedThumbnail {
  id: string;
  concept: string;
  description: string;
  layout: {
    background: {
      type: 'solid' | 'gradient' | 'image' | 'pattern';
      description: string;
      colors?: string[];
    };
    foreground: {
      mainElement: string;
      position: string;
      size: string;
    };
    text?: {
      primary: string;
      secondary?: string;
      position: string;
      style: string;
      colors: string[];
    };
    additionalElements: {
      type: string;
      description: string;
      position: string;
    }[];
  };
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  };
  designPrinciples: string[];
  productionNotes: string[];
  alternativeVersions: {
    name: string;
    changes: string[];
  }[];
  mockupUrl?: string;
  createdAt: Date;
}

export class ThumbnailAnalyzer {
  async analyzeThumbnail(
    imageUrl: string,
    platform: string,
    userId: string
  ): Promise<ThumbnailAnalysis> {
    try {
      // Analyze image using GPT-4 Vision
      const analysisPrompt = this.buildAnalysisPrompt(platform);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1500
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      const analysis = this.parseAnalysisResponse(response, imageUrl, platform);
      
      // Store analysis
      await this.storeAnalysis(userId, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing thumbnail:', error);
      throw new Error('Failed to analyze thumbnail');
    }
  }

  async generateThumbnailConcepts(
    params: ThumbnailGenerationParams,
    userId: string
  ): Promise<GeneratedThumbnail[]> {
    try {
      const systemPrompt = this.buildGenerationSystemPrompt(params.platform);
      const userPrompt = this.buildGenerationUserPrompt(params);

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
      const concepts = this.parseGenerationResponse(response);
      
      // Store generated concepts
      await this.storeGeneratedConcepts(userId, concepts);
      
      return concepts;
    } catch (error) {
      console.error('Error generating thumbnail concepts:', error);
      throw new Error('Failed to generate thumbnail concepts');
    }
  }

  async compareThumbnails(
    thumbnailUrls: string[],
    platform: string,
    userId: string
  ): Promise<{
    rankings: Array<{
      url: string;
      rank: number;
      score: number;
      strengths: string[];
      weaknesses: string[];
    }>;
    winner: string;
    insights: string[];
  }> {
    try {
      const comparisonPrompt = this.buildComparisonPrompt(platform);
      
      const messages: any[] = [
        { role: 'system', content: 'You are an expert thumbnail analyst specializing in maximizing click-through rates.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: comparisonPrompt },
            ...thumbnailUrls.map(url => ({
              type: 'image_url',
              image_url: { url }
            }))
          ]
        }
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages,
        max_tokens: 1500
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      return this.parseComparisonResponse(response, thumbnailUrls);
    } catch (error) {
      console.error('Error comparing thumbnails:', error);
      throw new Error('Failed to compare thumbnails');
    }
  }

  private buildAnalysisPrompt(platform: string): string {
    return `Analyze this ${platform} thumbnail in detail. Evaluate:

1. Visual Impact & Eye-Catch Factor (0-100)
2. Clarity & Message Communication (0-100)
3. Emotional Appeal & Expression (0-100)
4. Text Readability & Hierarchy (0-100)
5. Color Contrast & Visibility (0-100)
6. Composition & Visual Balance (0-100)

Also identify:
- Number and expressions of faces (if any)
- Text content and readability
- Dominant colors and mood
- Composition balance and focus points
- Platform-specific optimizations

Provide specific recommendations for improvement with priority levels.

Return your analysis as a JSON object with detailed scores, elements analysis, and recommendations.`;
  }

  private buildGenerationSystemPrompt(platform: string): string {
    return `You are an expert thumbnail designer specializing in ${platform} content. 

Your expertise includes:
- Understanding platform-specific best practices and dimensions
- Creating thumbnails that maximize click-through rates
- Color theory and visual psychology
- Typography and text hierarchy
- Composition and visual flow

Generate thumbnail concepts that are:
- Eye-catching and scroll-stopping
- Clear and easy to understand at small sizes
- Emotionally compelling
- Platform-optimized
- Production-feasible`;
  }

  private buildGenerationUserPrompt(params: ThumbnailGenerationParams): string {
    return `Create 3 thumbnail concepts for: "${params.title}"

Platform: ${params.platform}
Style: ${params.style}
Color Scheme: ${params.colorScheme || 'designer\'s choice'}
Mood: ${params.mood || 'engaging and clickable'}
Target Audience: ${params.targetAudience || 'general audience'}

Requirements:
${params.elements?.includeText !== false ? '- Include compelling text' : '- No text'}
${params.elements?.includeFace ? '- Include human face/expression' : ''}
${params.elements?.includeGraphics ? '- Include graphic elements' : ''}
${params.elements?.includeBackground !== false ? '- Design interesting background' : '- Simple/minimal background'}

For each concept provide:
1. Overall concept description
2. Detailed layout breakdown
3. Complete color palette (hex codes)
4. Design principles used
5. Production notes for creation
6. 2 alternative versions

Return as JSON with a 'concepts' array.`;
  }

  private buildComparisonPrompt(platform: string): string {
    return `Compare these ${platform} thumbnails and rank them based on:

1. Click-through rate potential
2. Visual appeal and professionalism
3. Message clarity
4. Emotional impact
5. Platform optimization

For each thumbnail:
- Assign an overall score (0-100)
- List 3 main strengths
- List 3 main weaknesses
- Provide specific improvement suggestions

Also provide:
- Clear winner with justification
- 3-5 key insights about what makes thumbnails effective

Return as JSON with rankings, winner, and insights.`;
  }

  private parseAnalysisResponse(response: any, imageUrl: string, platform: string): ThumbnailAnalysis {
    const id = `analysis-${Date.now()}`;
    
    return {
      id,
      imageUrl,
      platform,
      scores: {
        overall: response.scores?.overall || 0,
        eyeCatch: response.scores?.eyeCatch || 0,
        clarity: response.scores?.clarity || 0,
        emotion: response.scores?.emotion || 0,
        textReadability: response.scores?.textReadability || 0,
        colorContrast: response.scores?.colorContrast || 0,
        composition: response.scores?.composition || 0
      },
      elements: {
        faces: response.elements?.faces || {
          count: 0,
          expressions: [],
          prominence: 'low'
        },
        text: response.elements?.text || {
          present: false,
          readable: false,
          content: [],
          fontSize: 'appropriate'
        },
        colors: response.elements?.colors || {
          dominant: [],
          contrast: 0,
          mood: 'neutral'
        },
        composition: response.elements?.composition || {
          balance: 'balanced',
          ruleOfThirds: false,
          focusPoint: { x: 0.5, y: 0.5 }
        }
      },
      recommendations: response.recommendations || [],
      platformOptimizations: this.getPlatformOptimizations(response, platform),
      createdAt: new Date()
    };
  }

  private getPlatformOptimizations(response: any, platform: string): any {
    const optimizations: any = {};
    
    if (platform === 'youtube') {
      optimizations.youtube = {
        mobileOptimized: response.platformOptimizations?.youtube?.mobileOptimized || false,
        textVisibleAtSmallSize: response.platformOptimizations?.youtube?.textVisibleAtSmallSize || false,
        competesWellInSidebar: response.platformOptimizations?.youtube?.competesWellInSidebar || false
      };
    } else if (platform === 'tiktok') {
      optimizations.tiktok = {
        verticalOptimized: response.platformOptimizations?.tiktok?.verticalOptimized || false,
        catchesScrollingAttention: response.platformOptimizations?.tiktok?.catchesScrollingAttention || false
      };
    }
    
    return optimizations;
  }

  private parseGenerationResponse(response: any): GeneratedThumbnail[] {
    if (!response.concepts || !Array.isArray(response.concepts)) {
      throw new Error('Invalid response format');
    }

    return response.concepts.map((concept: any, index: number) => ({
      id: `concept-${Date.now()}-${index}`,
      concept: concept.concept || 'Untitled Concept',
      description: concept.description || '',
      layout: {
        background: concept.layout?.background || {
          type: 'solid',
          description: 'Simple background',
          colors: ['#ffffff']
        },
        foreground: concept.layout?.foreground || {
          mainElement: 'Title text',
          position: 'center',
          size: 'large'
        },
        text: concept.layout?.text,
        additionalElements: concept.layout?.additionalElements || []
      },
      colorPalette: concept.colorPalette || {
        primary: '#000000',
        secondary: '#666666',
        accent: '#0066cc',
        text: '#ffffff',
        background: '#f0f0f0'
      },
      designPrinciples: concept.designPrinciples || [],
      productionNotes: concept.productionNotes || [],
      alternativeVersions: concept.alternativeVersions || [],
      createdAt: new Date()
    }));
  }

  private parseComparisonResponse(response: any, urls: string[]) {
    const rankings = urls.map((url, index) => {
      const ranking = response.rankings?.find((r: any) => r.index === index) || {};
      return {
        url,
        rank: ranking.rank || index + 1,
        score: ranking.score || 0,
        strengths: ranking.strengths || [],
        weaknesses: ranking.weaknesses || []
      };
    });

    return {
      rankings: rankings.sort((a, b) => a.rank - b.rank),
      winner: response.winner || urls[0],
      insights: response.insights || []
    };
  }

  private async storeAnalysis(userId: string, analysis: ThumbnailAnalysis) {
    try {
      await prisma.thumbnailAnalysis.create({
        data: {
          userId,
          imageUrl: analysis.imageUrl,
          platform: analysis.platform,
          scores: JSON.stringify(analysis.scores),
          analysis: JSON.stringify(analysis)
        }
      });
    } catch (error) {
      console.error('Error storing analysis:', error);
    }
  }

  private async storeGeneratedConcepts(userId: string, concepts: GeneratedThumbnail[]) {
    try {
      await Promise.all(
        concepts.map(concept =>
          prisma.generatedContent.create({
            data: {
              userId,
              type: 'thumbnail',
              title: concept.concept,
              content: JSON.stringify(concept),
              status: 'draft'
            }
          })
        )
      );
    } catch (error) {
      console.error('Error storing concepts:', error);
    }
  }

  async getAnalysisHistory(userId: string, limit: number = 10) {
    try {
      const analyses = await prisma.thumbnailAnalysis.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return analyses.map(a => JSON.parse(a.analysis as string) as ThumbnailAnalysis);
    } catch (error) {
      console.error('Error fetching analysis history:', error);
      return [];
    }
  }
}

export const thumbnailAnalyzer = new ThumbnailAnalyzer();