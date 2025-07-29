import { chatCompletionStream, chatCompletion } from './openai-service';
import { knowledgeBase } from './knowledge-base';
import { userContextService } from './user-context';
import { ConversationMessage, AIConversation } from './types';
import OpenAI from 'openai';
import type { PrismaClient } from '@prisma/client';
import { getConversationCache, setConversationManager } from './conversation-cache';

type DBType = PrismaClient;

export class ConversationManager {
  private conversationCache = getConversationCache();
  private dbInstance: DBType | null = null;

  // Lazy load database
  private async getDb(): Promise<DBType> {
    if (!this.dbInstance) {
      const { db } = await import('@/lib/db');
      this.dbInstance = db;
    }
    return this.dbInstance;
  }

  async createConversation(userId: string, initialContext?: Record<string, any>): Promise<AIConversation> {
    const conversation: AIConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      messages: [],
      context: initialContext || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('[ConversationManager] Creating conversation:', {
      id: conversation.id,
      userId,
      context: initialContext,
      cacheSize: this.conversationCache.size
    });

    this.conversationCache.set(conversation.id, conversation);
    console.log('[ConversationManager] Conversation cached. New cache size:', this.conversationCache.size);
    
    // Always save to database to ensure persistence across module boundaries
    try {
      const db = await this.getDb();
      
      // For onboarding users, we need to ensure they have a valid user record
      if (userId.startsWith('onboarding-')) {
        // Create a temporary user record for onboarding
        try {
          await db.user.create({
            data: {
              id: userId,
              email: `${userId}@temp.local`,
              emailVerified: null, // Changed from false to null (DateTime or null expected)
              name: 'Onboarding User',
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          console.log('[ConversationManager] Created temporary user for onboarding');
        } catch (userError: any) {
          if (userError.code !== 'P2002') { // Ignore unique constraint errors
            console.error('[ConversationManager] Error creating temp user:', userError);
          }
        }
      }
      
      await db.aIConversation.create({
        data: {
          id: conversation.id,
          userId,
          messages: [],
          context: initialContext || {},
        },
      });
      console.log('[ConversationManager] Conversation saved to database');
    } catch (error: any) {
      console.error('[ConversationManager] Database error:', error);
      // Only continue for onboarding users
      if (!userId.startsWith('onboarding-')) {
        throw error; // Re-throw for authenticated users
      }
    }

    return conversation;
  }

  async getConversation(conversationId: string): Promise<AIConversation | null> {
    console.log('[ConversationManager] Getting conversation:', {
      conversationId,
      cacheSize: this.conversationCache.size,
      hasInCache: this.conversationCache.has(conversationId)
    });

    // Always load from database to ensure consistency across module boundaries
    try {
      const db = await this.getDb();
      const dbConversation = await db.aIConversation.findUnique({
        where: { id: conversationId },
      });

      if (!dbConversation) {
        console.log('[ConversationManager] Conversation not found in database');
        return null;
      }

      const conversation: AIConversation = {
        id: dbConversation.id,
        userId: dbConversation.userId,
        messages: dbConversation.messages as ConversationMessage[],
        context: dbConversation.context as Record<string, any>,
        createdAt: dbConversation.createdAt,
        updatedAt: dbConversation.updatedAt,
      };

      // Update cache after loading from database
      this.conversationCache.set(conversation.id, conversation);
      console.log('[ConversationManager] Loaded from database and cached');
      return conversation;
    } catch (error) {
      console.error('[ConversationManager] Error loading conversation:', error);
      return null;
    }
  }

  async addMessage(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date(),
    };

    conversation.messages.push(message);
    conversation.updatedAt = new Date();

    // Always update database to ensure persistence
    try {
      const db = await this.getDb();
      await db.aIConversation.update({
        where: { id: conversationId },
        data: {
          messages: conversation.messages,
          updatedAt: conversation.updatedAt,
        },
      });
    } catch (error) {
      console.error('[ConversationManager] Error updating message:', error);
      // For onboarding users, continue without database update
      if (!conversation.userId.startsWith('onboarding-')) {
        throw error; // Re-throw for authenticated users
      }
    }
  }

  async processUserMessage(
    conversationId: string,
    userMessage: string,
    options?: {
      includeKnowledge?: boolean;
      stream?: boolean;
    }
  ): Promise<AsyncGenerator<string> | string> {
    try {
      console.log('[ConversationManager] processUserMessage - getting conversation');
      const conversation = await this.getConversation(conversationId);
      if (!conversation) throw new Error('Conversation not found');

      // Add user message
      await this.addMessage(conversationId, 'user', userMessage);

    // Update onboarding context if applicable
    if (conversation.context.type === 'onboarding') {
      await this.updateOnboardingContext(conversationId, userMessage);
      // Refresh conversation to get updated context
      const refreshedConversation = await this.getConversation(conversationId);
      if (refreshedConversation) {
        conversation.context = refreshedConversation.context;
        conversation.messages = refreshedConversation.messages;
      }
    }

    // Build context with updated conversation
    const systemPrompt = await this.buildSystemPrompt(conversation, options?.includeKnowledge);
    const messages = this.buildMessageHistory(conversation, systemPrompt);

    if (options?.stream) {
      // Return streaming response
      return this.streamResponse(conversationId, messages);
    } else {
      // Return complete response
      const response = await this.getCompleteResponse(messages);
      await this.addMessage(conversationId, 'assistant', response);
      return response;
    }
    } catch (error: any) {
      console.error('[ConversationManager] processUserMessage error:', error);
      console.error('[ConversationManager] Error stack:', error.stack);
      throw error;
    }
  }

  private async buildSystemPrompt(
    conversation: AIConversation,
    includeKnowledge?: boolean
  ): Promise<string> {
    // Check if this is an onboarding conversation
    if (conversation.context.type === 'onboarding') {
      return this.buildOnboardingSystemPrompt(conversation);
    }

    let systemPrompt = `You are an AI assistant for CreatorCompass, a platform that provides personalized 90-day roadmaps for content creators on YouTube, TikTok, and Twitch.
    
    You are knowledgeable, friendly, and focused on providing actionable advice that aligns with their current roadmap phase.
    You understand platform algorithms, content strategies, and creator challenges.`;

    // Add comprehensive user context
    const userContext = await userContextService.getAISystemPromptContext(conversation.userId);
    if (userContext) {
      systemPrompt += `\n${userContext}`;
    }

    // Add relevant knowledge if requested
    if (includeKnowledge && conversation.messages.length > 0) {
      const lastUserMessage = [...conversation.messages]
        .reverse()
        .find(m => m.role === 'user')?.content || '';
      
      const relevantContext = await knowledgeBase.getRelevantContext(lastUserMessage, {
        platform: conversation.context.currentPlatform,
        niche: conversation.context.currentNiche,
        maxTokens: 1000,
      });

      if (relevantContext) {
        systemPrompt += `\n\nRelevant Knowledge Base Information:${relevantContext}`;
      }
    }

    return systemPrompt;
  }

  private buildOnboardingSystemPrompt(conversation: AIConversation): string {
    const step = conversation.context.step || 'welcome';
    const responses = conversation.context.responses || {};

    // Build step-specific prompt to be more focused
    let stepPrompt = '';
    
    switch (step) {
      case 'welcome':
        stepPrompt = `You just welcomed the user. Now ask about their experience level.
Your EXACT response should be something like:
"Great! So are you just starting out (1), have some experience creating content (2), or are you an experienced creator looking to grow (3)?"

DO NOT mention platforms, equipment, or anything else yet.`;
        break;
        
      case 'platform':
        stepPrompt = `The user just told you their experience level (${responses.creatorLevel}).
Acknowledge that briefly, then ask which platform they want to focus on.
Your response should be like:
"${responses.creatorLevel === 'beginner' ? "Perfect! Starting fresh is exciting" : responses.creatorLevel === 'intermediate' ? "Great! So you have some experience" : "Excellent! An experienced creator"}. Which platform are you most interested in creating content for - YouTube, TikTok, or Twitch?"

DO NOT jump ahead to other topics.`;
        break;
        
      case 'niche':
        stepPrompt = `The user selected ${responses.preferredPlatforms?.[0] || 'a platform'}.
Acknowledge their platform choice, then ask about their content niche.
Your response should be like:
"${responses.preferredPlatforms?.[0] === 'youtube' ? 'YouTube is a great choice!' : responses.preferredPlatforms?.[0] === 'tiktok' ? 'TikTok is perfect for short-form content!' : 'Twitch is awesome for live streaming!'} What type of content are you planning to create? (gaming, education, lifestyle, comedy, tech, etc.)"

DO NOT ask about equipment or other topics yet.`;
        break;
        
      case 'equipment':
        stepPrompt = `The user told you they want to create ${responses.contentNiche} content.
Acknowledge their niche, then ask about their equipment.
Your response should be like:
"${responses.contentNiche} content is a great niche! To help tailor your roadmap, what equipment do you currently have for creating content? (camera, microphone, lighting, computer, or just starting with a phone?)"`;
        break;
        
      case 'goals':
        stepPrompt = `The user described their equipment as: ${responses.equipment}.
Acknowledge their setup, then ask about their goals and time commitment.
Your response should be like:
"${responses.equipment?.includes('phone') ? "Starting with a phone is perfectly fine!" : "Good equipment setup!"} What are your main goals as a content creator, and how much time can you dedicate per week to creating content?"`;
        break;
        
      case 'challenges':
        stepPrompt = `The user shared their goals: ${responses.goals}.
Acknowledge their goals, then ask about their challenges.
Your response should be like:
"Those are great goals! Last question - what do you think will be your biggest challenge or concern as you start your creator journey?"`;
        break;
        
      case 'complete':
        stepPrompt = `The user shared their challenges: ${responses.challenges}.
Now provide the FINAL summary and tell them to click the button.

Your response MUST follow this exact structure:
1. Acknowledge their challenge
2. Provide a brief summary of what you learned
3. Express excitement about their journey
4. End with: "Click the 'Start My Creator Journey' button below to access your personalized dashboard! 🚀"

Example:
"${responses.challenges?.includes('viewers') ? "Getting viewers is definitely a common challenge for new creators" : "I understand that challenge"}. 

Great! I now have everything I need to create your personalized roadmap:
- You're ${responses.creatorLevel === 'beginner' ? 'just starting out' : responses.creatorLevel} as a ${responses.contentNiche} creator on ${responses.preferredPlatforms?.[0]}
- You have ${responses.equipment}
- Your goals: ${responses.goals}
- Main challenge: ${responses.challenges}

I'm excited to help you on this journey! Your custom 90-day roadmap is ready.

Click the 'Start My Creator Journey' button below to access your personalized dashboard! 🚀"`;
        break;
    }

    let systemPrompt = `You are the AI onboarding assistant for CreatorCompass. You must guide users through a STRICT step-by-step onboarding process.

CURRENT STEP: ${step}
USER RESPONSES: ${JSON.stringify(responses, null, 2)}

CRITICAL INSTRUCTION: You MUST ONLY respond according to the current step. DO NOT mention future steps or jump ahead.

${stepPrompt}

ABSOLUTE RULES:
1. ONLY ask about the current step
2. NEVER mention future questions
3. NEVER say "I'll also need to know about..." for future steps
4. NEVER mention the "Start My Creator Journey" button except at step 'complete'
5. Keep responses short and focused on the current question
6. One question at a time only`;

    return systemPrompt;
  }

  private buildMessageHistory(
    conversation: AIConversation,
    systemPrompt: string
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add conversation history (limit to last 10 messages to manage context)
    const recentMessages = conversation.messages.slice(-10);
    for (const msg of recentMessages) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    return messages;
  }

  private async *streamResponse(
    conversationId: string,
    messages: OpenAI.Chat.ChatCompletionMessageParam[]
  ): AsyncGenerator<string> {
    let fullResponse = '';
    let hasError = false;
    
    try {
      const stream = await chatCompletionStream(messages);
      
      for await (const chunk of stream) {
        if (chunk.content) {
          fullResponse += chunk.content;
          yield chunk.content;
        }
        
        if (chunk.done) {
          // Save the complete response
          await this.addMessage(conversationId, 'assistant', fullResponse);
        }
      }
    } catch (error) {
      hasError = true;
      console.error('Stream error:', error);
      
      // If we have a partial response, save it
      if (fullResponse) {
        await this.addMessage(conversationId, 'assistant', fullResponse);
      }
      
      // Yield error message
      yield '\n\n[Error: Response was interrupted. Please try again.]';
      throw error;
    } finally {
      // Ensure we always mark the stream as done
      if (!hasError && fullResponse) {
        // Ensure the response was saved
        const saved = await this.getConversation(conversationId);
        const lastMessage = saved?.messages[saved.messages.length - 1];
        if (lastMessage?.role !== 'assistant' || lastMessage?.content !== fullResponse) {
          await this.addMessage(conversationId, 'assistant', fullResponse);
        }
      }
    }
  }

  private async getCompleteResponse(
    messages: OpenAI.Chat.ChatCompletionMessageParam[]
  ): Promise<string> {
    const response = await chatCompletion(messages);
    return response.content;
  }

  async updateContext(
    conversationId: string,
    updates: Record<string, any>
  ): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    conversation.context = {
      ...conversation.context,
      ...updates,
    };

    // Always update database to ensure persistence
    try {
      const db = await this.getDb();
      await db.aIConversation.update({
        where: { id: conversationId },
        data: {
          context: conversation.context,
        },
      });
    } catch (error) {
      console.error('[ConversationManager] Error updating context:', error);
      // For onboarding users, continue without database update
      if (!conversation.userId.startsWith('onboarding-')) {
        throw error; // Re-throw for authenticated users
      }
    }

    // Clear cache to ensure fresh data
    this.conversationCache.delete(conversationId);
  }

  async getUserConversations(userId: string, limit = 10): Promise<AIConversation[]> {
    try {
      const db = await this.getDb();
      const conversations = await db.aIConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    return conversations.map(conv => ({
      id: conv.id,
      userId: conv.userId,
      messages: conv.messages as ConversationMessage[],
      context: conv.context as Record<string, any>,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    }));
    } catch (error) {
      console.error('[ConversationManager] Error getting user conversations:', error);
      return [];
    }
  }

  private async updateOnboardingContext(conversationId: string, userMessage: string): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation || conversation.context.type !== 'onboarding') return;

    const currentStep = conversation.context.step || 'welcome';
    const responses = conversation.context.responses || {};
    const messageLower = userMessage.toLowerCase();

    let nextStep = currentStep;
    let updates: Record<string, any> = {};

    // State machine for onboarding flow
    switch (currentStep) {
      case 'welcome':
        // User is responding to experience level question
        if (messageLower.includes('1') || messageLower.includes('beginner') || messageLower.includes('starting')) {
          responses.creatorLevel = 'beginner';
          nextStep = 'platform';
        } else if (messageLower.includes('2') || messageLower.includes('already') || messageLower.includes('grow')) {
          responses.creatorLevel = 'intermediate';
          nextStep = 'platform';
        } else if (messageLower.includes('3') || messageLower.includes('experienced') || messageLower.includes('optimize')) {
          responses.creatorLevel = 'advanced';
          nextStep = 'platform';
        }
        break;

      case 'platform':
        // User is selecting platform
        if (messageLower.includes('youtube')) {
          responses.preferredPlatforms = ['youtube'];
          nextStep = 'niche';
        } else if (messageLower.includes('tiktok')) {
          responses.preferredPlatforms = ['tiktok'];
          nextStep = 'niche';
        } else if (messageLower.includes('twitch')) {
          responses.preferredPlatforms = ['twitch'];
          nextStep = 'niche';
        } else if (messageLower.includes('all') || messageLower.includes('multiple') || 
                   messageLower.includes('three') || messageLower.includes('each') ||
                   messageLower.includes('variety')) {
          // Handle various ways users might say "all platforms"
          responses.preferredPlatforms = ['youtube', 'tiktok', 'twitch'];
          nextStep = 'niche';
        } else {
          // If we can't parse the platform, assume they mentioned something valid and store the raw response
          // This prevents the AI from asking the same question again
          responses.preferredPlatforms = ['youtube', 'tiktok', 'twitch']; // Default to all
          responses.platformResponse = userMessage; // Store raw response for context
          nextStep = 'niche';
        }
        break;

      case 'niche':
        // User is describing their content niche
        responses.contentNiche = userMessage; // Store full response for analysis
        nextStep = 'equipment';
        break;

      case 'equipment':
        // User is describing their equipment
        responses.equipment = userMessage;
        nextStep = 'goals';
        break;

      case 'goals':
        // User is describing their goals and time commitment
        responses.goals = userMessage;
        nextStep = 'challenges';
        break;

      case 'challenges':
        // User is describing their challenges
        responses.challenges = userMessage;
        nextStep = 'complete';
        
        // Save onboarding data to user profile - do this after response is sent
        // to avoid interrupting the stream
        setTimeout(async () => {
          try {
            await userContextService.updateUserContextFromOnboarding(
              conversation.userId,
              responses
            );
          } catch (error) {
            console.error('Failed to save onboarding data:', error);
          }
        }, 1000);
        break;
    }

    // Update conversation context
    updates = {
      step: nextStep,
      responses,
    };

    await this.updateContext(conversationId, updates);
  }
}

// Create singleton instance
export const conversationManager = new ConversationManager();
setConversationManager(conversationManager);

// Helper function for onboarding conversations
export async function createOnboardingConversation(userId: string): Promise<AIConversation> {
  return conversationManager.createConversation(userId, {
    type: 'onboarding',
    step: 'welcome',
    responses: {},
  });
}

// Helper function for support conversations
export async function createSupportConversation(
  userId: string,
  topic: string
): Promise<AIConversation> {
  return conversationManager.createConversation(userId, {
    type: 'support',
    topic,
    currentPage: '',
  });
}