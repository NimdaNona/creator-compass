import { openai } from '@/lib/openai';
import { prisma } from '@/lib/db';
import { Platform, Niche, User } from '@/types';

export interface ContentPerformance {
  expectedViews: {
    min: number;
    max: number;
    average: number;
  };
  expectedEngagement: {
    likes: { min: number; max: number };
    comments: { min: number; max: number };
    shares: { min: number; max: number };
  };
  growthPotential: {
    subscriberGain: { min: number; max: number };
    impressions: { min: number; max: number };
    clickThroughRate: { min: number; max: number };
  };
  viralityScore: number; // 0-100
  audienceRetention: {
    averageViewDuration: number;
    dropOffPoints: { timestamp: number; percentage: number }[];
  };
}

export interface PerformancePrediction {
  id: string;
  contentType: string;
  title: string;
  description?: string;
  thumbnail?: string;
  publishDate?: Date;
  platform: Platform['id'];
  niche: Niche['id'];
  performance: ContentPerformance;
  factors: {
    positive: PredictionFactor[];
    negative: PredictionFactor[];
    opportunities: PredictionFactor[];
  };
  competitorBenchmark: {
    averageViews: number;
    topPerformers: {
      title: string;
      views: number;
      engagement: number;
    }[];
  };
  optimizationTips: OptimizationTip[];
  confidenceScore: number; // 0-100
  seasonalFactors?: {
    trend: 'up' | 'down' | 'stable';
    impact: number; // -100 to +100
    reason: string;
  };
  createdAt: Date;
}

export interface PredictionFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  score: number; // -10 to +10
  explanation: string;
}

export interface OptimizationTip {
  area: 'title' | 'thumbnail' | 'description' | 'timing' | 'content' | 'tags';
  currentScore: number;
  potentialScore: number;
  suggestion: string;
  implementation: string;
  estimatedImpact: {
    views: number; // percentage increase
    engagement: number; // percentage increase
  };
}

export interface HistoricalData {
  contentId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
  publishedAt: Date;
}

export interface TrendAnalysis {
  trendingTopics: {
    topic: string;
    score: number;
    growth: number;
    relevance: number;
  }[];
  optimalTiming: {
    dayOfWeek: string;
    hourOfDay: number;
    timezone: string;
    reasoning: string;
  };
  competitionLevel: 'low' | 'medium' | 'high';
}

export class PerformancePredictor {
  async predictPerformance(
    params: {
      title: string;
      description?: string;
      thumbnail?: string;
      contentType: string;
      platform: Platform['id'];
      niche: Niche['id'];
      publishDate?: Date;
      historicalData?: HistoricalData[];
      tags?: string[];
    },
    userId: string
  ): Promise<PerformancePrediction> {
    try {
      // Get user's channel data for baseline
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId },
        include: {
          platformAccounts: true,
          analytics: {
            orderBy: { createdAt: 'desc' },
            take: 30
          }
        }
      });

      // Analyze trends
      const trends = await this.analyzeTrends(params.platform, params.niche);
      
      // Build prediction prompt
      const systemPrompt = this.buildPredictionSystemPrompt(params.platform);
      const userPrompt = this.buildPredictionUserPrompt(params, userProfile, trends);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}');
      const prediction = this.parsePredictionResponse(response, params);
      
      // Store prediction
      await this.storePrediction(userId, prediction);
      
      return prediction;
    } catch (error) {
      console.error('Error predicting performance:', error);
      throw new Error('Failed to predict performance');
    }
  }

  async compareScenarios(
    scenarios: Array<{
      title: string;
      description?: string;
      thumbnail?: string;
      publishDate?: Date;
      tags?: string[];
    }>,
    baseParams: {
      contentType: string;
      platform: Platform['id'];
      niche: Niche['id'];
    },
    userId: string
  ): Promise<{
    scenarios: PerformancePrediction[];
    winner: number;
    insights: string[];
    recommendations: string[];
  }> {
    try {
      // Predict performance for each scenario
      const predictions = await Promise.all(
        scenarios.map(scenario =>
          this.predictPerformance(
            { ...baseParams, ...scenario },
            userId
          )
        )
      );

      // Compare and analyze
      const comparison = this.comparePerformancePredictions(predictions);
      
      return {
        scenarios: predictions,
        winner: comparison.winnerIndex,
        insights: comparison.insights,
        recommendations: comparison.recommendations
      };
    } catch (error) {
      console.error('Error comparing scenarios:', error);
      throw new Error('Failed to compare scenarios');
    }
  }

  async optimizeContent(
    content: {
      title: string;
      description?: string;
      thumbnail?: string;
      tags?: string[];
      contentType: string;
      platform: Platform['id'];
      niche: Niche['id'];
    },
    targetMetric: 'views' | 'engagement' | 'retention' | 'growth',
    userId: string
  ): Promise<{
    original: PerformancePrediction;
    optimized: {
      title?: string;
      description?: string;
      thumbnailSuggestions?: string[];
      tags?: string[];
      timing?: {
        dayOfWeek: string;
        hourOfDay: number;
      };
    };
    improvements: {
      metric: string;
      before: number;
      after: number;
      increase: number; // percentage
    }[];
  }> {
    try {
      // Get original prediction
      const originalPrediction = await this.predictPerformance(content, userId);
      
      // Generate optimization suggestions
      const optimizationPrompt = this.buildOptimizationPrompt(content, targetMetric, originalPrediction);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: 'You are an expert content optimization specialist.' },
          { role: 'user', content: optimizationPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      });

      const optimization = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        original: originalPrediction,
        optimized: optimization.suggestions,
        improvements: optimization.improvements
      };
    } catch (error) {
      console.error('Error optimizing content:', error);
      throw new Error('Failed to optimize content');
    }
  }

  private async analyzeTrends(
    platform: string,
    niche: string
  ): Promise<TrendAnalysis> {
    // In a real implementation, this would fetch from trend APIs
    // For now, we'll use AI to simulate trend analysis
    const trendPrompt = `Analyze current trends for ${platform} content in the ${niche} niche.
Include:
1. Top 5 trending topics with scores
2. Optimal posting times
3. Competition level analysis`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: 'You are a social media trend analyst.' },
        { role: 'user', content: trendPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content || '{}');
  }

  private buildPredictionSystemPrompt(platform: string): string {
    return `You are an expert ${platform} performance analyst with deep understanding of:
- Content virality factors
- Audience behavior patterns
- Platform algorithms
- Engagement metrics
- Growth strategies

Analyze content and predict its performance based on:
1. Title effectiveness and SEO
2. Content timing and trends
3. Audience targeting
4. Competition analysis
5. Platform-specific factors

Provide detailed, data-driven predictions with confidence scores.`;
  }

  private buildPredictionUserPrompt(
    params: any,
    userProfile: any,
    trends: TrendAnalysis
  ): string {
    const channelSize = userProfile?.platformAccounts?.[0]?.metrics?.subscribers || 'small';
    const avgViews = userProfile?.analytics?.[0]?.views || 100;

    return `Predict performance for this content:

Title: ${params.title}
Description: ${params.description || 'Not provided'}
Content Type: ${params.contentType}
Platform: ${params.platform}
Niche: ${params.niche}
Tags: ${params.tags?.join(', ') || 'None'}
Publish Date: ${params.publishDate || 'Not specified'}

Channel Context:
- Size: ${channelSize} subscribers
- Average Views: ${avgViews}
- Historical Performance: ${params.historicalData ? 'Available' : 'Not available'}

Current Trends:
${JSON.stringify(trends, null, 2)}

Provide a comprehensive performance prediction including:
1. Expected view ranges (min, max, average)
2. Engagement metrics (likes, comments, shares)
3. Growth potential (subscriber gain, impressions)
4. Virality score (0-100)
5. Positive and negative factors
6. Optimization opportunities
7. Competitor benchmarking
8. Confidence score

Return as JSON with detailed analysis.`;
  }

  private parsePredictionResponse(response: any, params: any): PerformancePrediction {
    const id = `prediction-${Date.now()}`;
    
    return {
      id,
      contentType: params.contentType,
      title: params.title,
      description: params.description,
      thumbnail: params.thumbnail,
      publishDate: params.publishDate,
      platform: params.platform,
      niche: params.niche,
      performance: {
        expectedViews: response.performance?.expectedViews || {
          min: 100,
          max: 1000,
          average: 500
        },
        expectedEngagement: response.performance?.expectedEngagement || {
          likes: { min: 10, max: 100 },
          comments: { min: 5, max: 50 },
          shares: { min: 2, max: 20 }
        },
        growthPotential: response.performance?.growthPotential || {
          subscriberGain: { min: 1, max: 10 },
          impressions: { min: 1000, max: 10000 },
          clickThroughRate: { min: 2, max: 10 }
        },
        viralityScore: response.performance?.viralityScore || 50,
        audienceRetention: response.performance?.audienceRetention || {
          averageViewDuration: 60,
          dropOffPoints: []
        }
      },
      factors: {
        positive: response.factors?.positive || [],
        negative: response.factors?.negative || [],
        opportunities: response.factors?.opportunities || []
      },
      competitorBenchmark: response.competitorBenchmark || {
        averageViews: 1000,
        topPerformers: []
      },
      optimizationTips: response.optimizationTips || [],
      confidenceScore: response.confidenceScore || 75,
      seasonalFactors: response.seasonalFactors,
      createdAt: new Date()
    };
  }

  private comparePerformancePredictions(predictions: PerformancePrediction[]) {
    // Score each prediction
    const scores = predictions.map(p => ({
      views: p.performance.expectedViews.average,
      engagement: (
        p.performance.expectedEngagement.likes.max +
        p.performance.expectedEngagement.comments.max +
        p.performance.expectedEngagement.shares.max
      ) / 3,
      virality: p.performance.viralityScore,
      overall: 0
    }));

    // Calculate overall scores
    scores.forEach(s => {
      s.overall = (s.views * 0.4) + (s.engagement * 0.3) + (s.virality * 0.3);
    });

    // Find winner
    const winnerIndex = scores.reduce((best, current, index) => 
      current.overall > scores[best].overall ? index : best, 0
    );

    // Generate insights
    const insights = [
      `Scenario ${winnerIndex + 1} has the highest predicted performance`,
      `Expected ${Math.round((scores[winnerIndex].views / scores[0].views - 1) * 100)}% more views than baseline`,
      predictions[winnerIndex].factors.positive[0]?.factor || 'Strong content fundamentals'
    ];

    // Generate recommendations
    const recommendations = predictions[winnerIndex].optimizationTips
      .slice(0, 3)
      .map(tip => tip.suggestion);

    return { winnerIndex, insights, recommendations };
  }

  private buildOptimizationPrompt(
    content: any,
    targetMetric: string,
    prediction: PerformancePrediction
  ): string {
    return `Optimize this content for maximum ${targetMetric}:

Current Content:
${JSON.stringify(content, null, 2)}

Current Prediction:
${JSON.stringify(prediction, null, 2)}

Target: Maximize ${targetMetric}

Provide specific optimizations for:
1. Title (if applicable)
2. Description (if applicable)
3. Thumbnail concepts
4. Tags
5. Optimal posting time

Include expected improvements for each change.
Return as JSON with suggestions and improvement metrics.`;
  }

  private async storePrediction(userId: string, prediction: PerformancePrediction) {
    try {
      await prisma.performancePrediction.create({
        data: {
          userId,
          contentType: prediction.contentType,
          title: prediction.title,
          platform: prediction.platform,
          prediction: JSON.stringify(prediction),
          confidenceScore: prediction.confidenceScore
        }
      });
    } catch (error) {
      console.error('Error storing prediction:', error);
    }
  }

  async getPredictionHistory(userId: string, limit: number = 10) {
    try {
      const predictions = await prisma.performancePrediction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return predictions.map(p => JSON.parse(p.prediction as string) as PerformancePrediction);
    } catch (error) {
      console.error('Error fetching prediction history:', error);
      return [];
    }
  }
}

export const performancePredictor = new PerformancePredictor();