import { Platform, Niche } from '@/types';
import { OpenAI } from 'openai';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export interface TestVariable {
  name: string;
  description: string;
  options: TestOption[];
  impact: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TestOption {
  value: string;
  description: string;
  hypothesis: string;
  expectedImpact: {
    metric: string;
    change: string;
    confidence: number;
  }[];
}

export interface ABTestRecommendation {
  id: string;
  contentType: string;
  platform: Platform['id'];
  niche: Niche['id'];
  testName: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedDuration: number; // days
  minimumSampleSize: number;
  variables: TestVariable[];
  methodology: {
    splitType: 'even' | 'weighted' | 'sequential';
    splitRatio?: number[];
    controlGroup: string;
    testGroups: string[];
  };
  successMetrics: {
    primary: string;
    secondary: string[];
    minimumDetectableEffect: number;
  };
  risks: {
    type: string;
    description: string;
    mitigation: string;
  }[];
  implementation: {
    step: string;
    description: string;
    tools?: string[];
    timeEstimate?: string;
  }[];
  createdAt: Date;
  userId: string;
}

export interface TestResult {
  id: string;
  testId: string;
  variant: string;
  metrics: {
    name: string;
    value: number;
    change: number;
    confidence: number;
    significant: boolean;
  }[];
  sampleSize: number;
  duration: number;
  winner: boolean;
  insights: string[];
}

export interface OptimizationPath {
  currentState: {
    title: string;
    description?: string;
    thumbnail?: string;
    performance: {
      views: number;
      engagement: number;
      retention: number;
    };
  };
  recommendedTests: ABTestRecommendation[];
  projectedOutcome: {
    bestCase: {
      views: number;
      engagement: number;
      retention: number;
    };
    realistic: {
      views: number;
      engagement: number;
      retention: number;
    };
    timeToAchieve: number; // days
  };
  roadmap: {
    phase: number;
    name: string;
    tests: string[];
    duration: number;
    expectedImprovement: string;
  }[];
}

export class ABTestingAdvisor {
  async generateTestRecommendations(
    params: {
      contentType: string;
      title?: string;
      description?: string;
      currentMetrics?: {
        views: number;
        engagement: number;
        retention: number;
        clickThrough?: number;
      };
      platform: Platform['id'];
      niche: Niche['id'];
      goals?: string[];
    },
    userId: string
  ): Promise<ABTestRecommendation[]> {
    try {
      const prompt = `You are an A/B testing expert for content creators. Generate comprehensive A/B test recommendations for optimizing content performance.

Context:
- Content Type: ${params.contentType}
${params.title ? `- Title: ${params.title}` : ''}
${params.description ? `- Description: ${params.description}` : ''}
- Platform: ${params.platform}
- Niche: ${params.niche}
${params.currentMetrics ? `- Current Performance:
  - Views: ${params.currentMetrics.views}
  - Engagement Rate: ${params.currentMetrics.engagement}%
  - Retention: ${params.currentMetrics.retention}%
  ${params.currentMetrics.clickThrough ? `- CTR: ${params.currentMetrics.clickThrough}%` : ''}` : ''}
${params.goals ? `- Goals: ${params.goals.join(', ')}` : ''}

Generate 3-5 A/B test recommendations that cover different aspects of content optimization. Each test should be actionable, measurable, and tailored to the platform.

Return a JSON array of test recommendations with this structure:
{
  "tests": [
    {
      "testName": "string",
      "description": "string",
      "priority": "critical|high|medium|low",
      "estimatedDuration": number (days),
      "minimumSampleSize": number,
      "variables": [
        {
          "name": "string",
          "description": "string", 
          "options": [
            {
              "value": "string",
              "description": "string",
              "hypothesis": "string",
              "expectedImpact": [
                {
                  "metric": "string",
                  "change": "string (e.g., +10-15%)",
                  "confidence": number (0-100)
                }
              ]
            }
          ],
          "impact": "high|medium|low",
          "difficulty": "easy|medium|hard"
        }
      ],
      "methodology": {
        "splitType": "even|weighted|sequential",
        "splitRatio": [numbers] (optional),
        "controlGroup": "string",
        "testGroups": ["string"]
      },
      "successMetrics": {
        "primary": "string",
        "secondary": ["string"],
        "minimumDetectableEffect": number (percentage)
      },
      "risks": [
        {
          "type": "string",
          "description": "string",
          "mitigation": "string"
        }
      ],
      "implementation": [
        {
          "step": "string",
          "description": "string",
          "tools": ["string"] (optional),
          "timeEstimate": "string" (optional)
        }
      ]
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an A/B testing expert specializing in content optimization for creators. Provide data-driven, actionable test recommendations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      const tests = result.tests || [];

      // Save to database
      const savedTests = await Promise.all(
        tests.map(async (test: any) => {
          const testData = {
            ...test,
            id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            contentType: params.contentType,
            platform: params.platform,
            niche: params.niche,
            createdAt: new Date(),
            userId
          };

          await prisma.userInteraction.create({
            data: {
              userId,
              interactionType: 'ab_test_generated',
              context: {
                testId: testData.id,
                testName: test.testName,
                platform: params.platform,
                niche: params.niche
              }
            }
          });

          return testData;
        })
      );

      return savedTests;
    } catch (error) {
      console.error('Error generating A/B test recommendations:', error);
      throw error;
    }
  }

  async analyzeTestResults(
    testId: string,
    results: {
      variants: {
        name: string;
        metrics: {
          views: number;
          engagement: number;
          retention: number;
          clicks?: number;
          conversions?: number;
        };
        sampleSize: number;
      }[];
      duration: number; // days
    },
    userId: string
  ): Promise<TestResult> {
    try {
      const prompt = `Analyze A/B test results and provide statistical insights and recommendations.

Test Results:
${results.variants.map(v => `
Variant: ${v.name}
- Sample Size: ${v.sampleSize}
- Views: ${v.metrics.views}
- Engagement: ${v.metrics.engagement}%
- Retention: ${v.metrics.retention}%
${v.metrics.clicks ? `- Clicks: ${v.metrics.clicks}` : ''}
${v.metrics.conversions ? `- Conversions: ${v.metrics.conversions}` : ''}
`).join('\n')}

Test Duration: ${results.duration} days

Perform statistical analysis to determine:
1. Which variant performed best for each metric
2. Statistical significance of results
3. Confidence levels
4. Key insights and learnings
5. Recommendations for implementation

Return a JSON object with this structure:
{
  "analysis": {
    "winner": "variant name",
    "variants": [
      {
        "name": "string",
        "metrics": [
          {
            "name": "string",
            "value": number,
            "change": number (percentage change from control),
            "confidence": number (0-100),
            "significant": boolean
          }
        ],
        "overallPerformance": "string"
      }
    ],
    "insights": ["string"],
    "recommendations": ["string"],
    "statisticalNotes": ["string"]
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a data scientist specializing in A/B testing analysis. Provide rigorous statistical analysis and actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.5,
        response_format: { type: "json_object" }
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}').analysis;

      // Determine winner
      const winnerVariant = analysis.variants.find((v: any) => v.name === analysis.winner);

      const testResult: TestResult = {
        id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        testId,
        variant: analysis.winner,
        metrics: winnerVariant?.metrics || [],
        sampleSize: results.variants.reduce((sum, v) => sum + v.sampleSize, 0),
        duration: results.duration,
        winner: true,
        insights: analysis.insights
      };

      // Save interaction
      await prisma.userInteraction.create({
        data: {
          userId,
          interactionType: 'ab_test_analyzed',
          context: {
            testId,
            resultId: testResult.id,
            winner: analysis.winner
          }
        }
      });

      return testResult;
    } catch (error) {
      console.error('Error analyzing test results:', error);
      throw error;
    }
  }

  async generateOptimizationPath(
    params: {
      currentContent: {
        title: string;
        description?: string;
        thumbnail?: string;
        metrics: {
          views: number;
          engagement: number;
          retention: number;
        };
      };
      goals: {
        targetViews?: number;
        targetEngagement?: number;
        targetRetention?: number;
        timeframe?: number; // days
      };
      platform: Platform['id'];
      niche: Niche['id'];
      constraints?: string[];
    },
    userId: string
  ): Promise<OptimizationPath> {
    try {
      const prompt = `Create a comprehensive optimization roadmap using A/B testing to achieve content performance goals.

Current State:
- Title: ${params.currentContent.title}
${params.currentContent.description ? `- Description: ${params.currentContent.description}` : ''}
- Current Metrics:
  - Views: ${params.currentContent.metrics.views}
  - Engagement: ${params.currentContent.metrics.engagement}%
  - Retention: ${params.currentContent.metrics.retention}%

Goals:
${params.goals.targetViews ? `- Target Views: ${params.goals.targetViews}` : ''}
${params.goals.targetEngagement ? `- Target Engagement: ${params.goals.targetEngagement}%` : ''}
${params.goals.targetRetention ? `- Target Retention: ${params.goals.targetRetention}%` : ''}
${params.goals.timeframe ? `- Timeframe: ${params.goals.timeframe} days` : ''}

Platform: ${params.platform}
Niche: ${params.niche}
${params.constraints ? `Constraints: ${params.constraints.join(', ')}` : ''}

Create a step-by-step optimization path with specific A/B tests to run in sequence. Consider test dependencies and cumulative effects.

Return a JSON object with this structure:
{
  "optimizationPath": {
    "recommendedTests": [
      // Array of A/B test recommendations (use same structure as generateTestRecommendations)
    ],
    "projectedOutcome": {
      "bestCase": {
        "views": number,
        "engagement": number,
        "retention": number
      },
      "realistic": {
        "views": number,
        "engagement": number,
        "retention": number
      },
      "timeToAchieve": number
    },
    "roadmap": [
      {
        "phase": number,
        "name": "string",
        "tests": ["test names"],
        "duration": number,
        "expectedImprovement": "string"
      }
    ]
  }
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a growth optimization strategist specializing in content performance. Create data-driven optimization roadmaps."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(response.choices[0].message.content || '{}').optimizationPath;

      // Process recommended tests
      const recommendedTests = await Promise.all(
        (result.recommendedTests || []).map(async (test: any) => ({
          ...test,
          id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          contentType: 'optimization',
          platform: params.platform,
          niche: params.niche,
          createdAt: new Date(),
          userId
        }))
      );

      const optimizationPath: OptimizationPath = {
        currentState: params.currentContent,
        recommendedTests,
        projectedOutcome: result.projectedOutcome,
        roadmap: result.roadmap
      };

      // Save interaction
      await prisma.userInteraction.create({
        data: {
          userId,
          interactionType: 'optimization_path_generated',
          context: {
            currentMetrics: params.currentContent.metrics,
            goals: params.goals,
            testCount: recommendedTests.length
          }
        }
      });

      return optimizationPath;
    } catch (error) {
      console.error('Error generating optimization path:', error);
      throw error;
    }
  }
}

export const abTestingAdvisor = new ABTestingAdvisor();