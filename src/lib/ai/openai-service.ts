import OpenAI from 'openai';
import { AIResponse, AIStreamResponse, ContentGenerationType } from './types';
import { promptTemplates } from './prompt-templates';
import { RateLimiter } from '../ratelimit';
import { userContextService } from './user-context';

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// Rate limiter for API calls
const rateLimiter = new RateLimiter({
  tokensPerInterval: 100,
  interval: 'minute',
  fireImmediately: true,
});

// Main chat completion function
export async function chatCompletion(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
    model?: string;
  }
): Promise<AIResponse> {
  try {
    // Check rate limit
    const { success } = await rateLimiter.check('global');
    if (!success) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: options?.model || 'gpt-4-turbo-preview',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      stream: false,
    });

    const content = completion.choices[0]?.message?.content || '';
    
    return {
      content,
      usage: completion.usage,
      model: completion.model,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

// Streaming chat completion
export async function chatCompletionStream(
  messages: OpenAI.Chat.ChatCompletionMessageParam[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }
): Promise<AsyncGenerator<AIStreamResponse>> {
  try {
    const { success } = await rateLimiter.check('global');
    if (!success) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }

    const client = getOpenAIClient();
    const stream = await client.chat.completions.create({
      model: options?.model || 'gpt-4-turbo-preview',
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      stream: true,
    });

    return (async function* () {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield { content, done: false };
        }
      }
      yield { content: '', done: true };
    })();
  } catch (error) {
    console.error('OpenAI streaming error:', error);
    throw error;
  }
}

// Generate content based on type
export async function generateContent(
  type: ContentGenerationType,
  context: Record<string, any>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    userId?: string;
  }
): Promise<string> {
  const template = promptTemplates[type];
  if (!template) {
    throw new Error(`Unknown content generation type: ${type}`);
  }

  // Get user context if userId provided
  let enhancedSystemPrompt = template.systemPrompt;
  if (options?.userId) {
    const userContext = await userContextService.getAISystemPromptContext(options.userId);
    if (userContext) {
      enhancedSystemPrompt += `\n\n${userContext}`;
    }
  }

  const prompt = template.buildPrompt(context);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: enhancedSystemPrompt,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: options?.temperature ?? template.temperature,
    maxTokens: options?.maxTokens ?? template.maxTokens,
  });

  return response.content;
}

// Analyze user input for onboarding
export async function analyzeUserProfile(
  userInput: string,
  conversationHistory?: string[]
): Promise<{
  creatorLevel: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  goals: string[];
  challenges: string[];
  timeCommitment: string;
  preferredPlatforms: string[];
  contentNiche: string;
}> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are an AI assistant for CreatorCompass analyzing a content creator's profile based on their onboarding conversation.
      
      Context: CreatorCompass provides personalized 90-day roadmaps for content creators on YouTube, TikTok, and Twitch.
      
      Extract the following information from the conversation:
      - Creator level: Map user responses to one of:
        * "beginner" - just starting out, no content yet
        * "intermediate" - already creating content but wants to grow
        * "advanced" - experienced creator looking to optimize
      - Equipment: List actual equipment mentioned (camera, microphone, lights, etc.)
      - Goals: Specific creator goals mentioned (grow audience, monetize, improve quality, etc.)
      - Challenges: Pain points or concerns they've expressed
      - Time commitment: Hours per week they can dedicate
      - Preferred platforms: Must be one or more of: youtube, tiktok, twitch
      - Content niche: The type of content they want to create (gaming, education, lifestyle, etc.)
      
      Be precise and only extract what was explicitly mentioned in the conversation.
      Return the analysis in JSON format.`,
    },
  ];

  // Add conversation history if available
  if (conversationHistory) {
    conversationHistory.forEach((msg, i) => {
      messages.push({
        role: i % 2 === 0 ? 'assistant' : 'user',
        content: msg,
      });
    });
  }

  messages.push({
    role: 'user',
    content: userInput,
  });

  const response = await chatCompletion(messages, {
    temperature: 0.3, // Lower temperature for more consistent analysis
    maxTokens: 1000,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse AI analysis:', error);
    // Return default values if parsing fails
    return {
      creatorLevel: 'beginner',
      equipment: [],
      goals: [],
      challenges: [],
      timeCommitment: 'unknown',
      preferredPlatforms: [],
      contentNiche: 'general',
    };
  }
}

// Generate personalized recommendations
export async function generateRecommendations(
  userProfile: any,
  type: 'equipment' | 'content' | 'strategy' | 'next-steps'
): Promise<string[]> {
  const prompts = {
    equipment: `Based on this creator profile, recommend equipment they should consider for their content creation journey:`,
    content: `Based on this creator profile, suggest specific content ideas that align with their niche and platform:`,
    strategy: `Based on this creator profile, recommend proven growth strategies for their platform:`,
    'next-steps': `Based on this creator profile and their progress in the 90-day roadmap, suggest their immediate next steps:`,
  };

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are an expert content creation advisor for CreatorCompass. 
      
      Context: CreatorCompass provides personalized 90-day roadmaps for content creators on YouTube, TikTok, and Twitch.
      
      Provide specific, actionable recommendations that:
      1. Are tailored to the user's creator level (beginner/intermediate/advanced)
      2. Consider their specific platform (YouTube/TikTok/Twitch)
      3. Align with their content niche
      4. Respect their time commitment and current equipment
      5. Build upon their current progress in the roadmap
      
      Focus on practical, achievable recommendations that will help them progress in their creator journey.`,
    },
    {
      role: 'user',
      content: `${prompts[type]}
      
      Profile: ${JSON.stringify(userProfile, null, 2)}
      
      Provide 5 specific, actionable recommendations in JSON array format. Each recommendation should be a complete sentence that the user can immediately understand and act upon.`,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.7,
    maxTokens: 1000,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse recommendations:', error);
    return [];
  }
}

// Smart task prioritization
export async function prioritizeTasks(
  tasks: any[],
  userContext: any
): Promise<string[]> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: `You are a productivity expert for CreatorCompass, helping content creators on YouTube, TikTok, and Twitch follow their 90-day roadmaps effectively.
      
      Prioritize tasks based on:
      1. The user's current roadmap phase (Foundation, Growth, or Scale)
      2. Their creator level (beginner, intermediate, advanced)
      3. Platform-specific best practices
      4. Their time commitment and current progress
      5. Tasks that build upon completed work
      
      Focus on tasks that will have the most impact on their growth at their current stage.`,
    },
    {
      role: 'user',
      content: `Prioritize these tasks for a content creator:
      
      Tasks: ${JSON.stringify(tasks, null, 2)}
      User Context: ${JSON.stringify(userContext, null, 2)}
      
      Return an array of task IDs in priority order (highest priority first).`,
    },
  ];

  const response = await chatCompletion(messages, {
    temperature: 0.3,
    maxTokens: 500,
  });

  try {
    return JSON.parse(response.content);
  } catch (error) {
    console.error('Failed to parse task priorities:', error);
    return tasks.map(t => t.id);
  }
}

// Embedding generation for semantic search
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getOpenAIClient();
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Failed to generate embedding:', error);
    throw error;
  }
}

// Moderate content for safety
export async function moderateContent(content: string): Promise<boolean> {
  try {
    const client = getOpenAIClient();
    const response = await client.moderations.create({
      input: content,
    });

    const result = response.results[0];
    return !result.flagged;
  } catch (error) {
    console.error('Failed to moderate content:', error);
    // Default to safe if moderation fails
    return true;
  }
}