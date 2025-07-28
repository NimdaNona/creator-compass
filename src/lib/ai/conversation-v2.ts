import { chatCompletionStream, chatCompletion } from './openai-service';
import { knowledgeBase } from './knowledge-base';
import { userContextService } from './user-context';
import { ConversationMessage, AIConversation } from './types';
import OpenAI from 'openai';
import type { PrismaClient } from '@prisma/client';

type DBType = PrismaClient;

export class ConversationManager {
  private conversationCache = new Map<string, AIConversation>();
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

    // Store in cache
    this.conversationCache.set(conversation.id, conversation);

    // Store in database only for authenticated users (not during onboarding)
    if (!userId.startsWith('onboarding-')) {
      try {
        const db = await this.getDb();
        await db.aiConversation.create({
          data: {
            id: conversation.id,
            userId,
            messages: conversation.messages,
            context: conversation.context,
          },
        });
      } catch (error: any) {
        console.error('[ConversationManager] Error saving conversation to database:', error);
        // Continue without database persistence for onboarding
      }
    }

    return conversation;
  }

  async getConversation(conversationId: string, userId?: string): Promise<AIConversation | null> {
    if (!conversationId) return null;

    // Check cache first
    if (this.conversationCache.has(conversationId)) {
      return this.conversationCache.get(conversationId)!;
    }

    // Load from database
    try {
      const db = await this.getDb();
      const dbConversation = await db.aiConversation.findUnique({
        where: { id: conversationId },
      });

      if (!dbConversation) return null;

      const conversation: AIConversation = {
        id: dbConversation.id,
        userId: dbConversation.userId,
        messages: dbConversation.messages as ConversationMessage[],
        context: dbConversation.context as Record<string, any>,
        createdAt: dbConversation.createdAt,
        updatedAt: dbConversation.updatedAt,
      };

      this.conversationCache.set(conversation.id, conversation);
      return conversation;
    } catch (error: any) {
      console.error('[ConversationManager] Error loading conversation from database:', error);
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

    // Update database only for authenticated users
    if (!conversation.userId.startsWith('onboarding-')) {
      try {
        const db = await this.getDb();
        await db.aiConversation.update({
          where: { id: conversationId },
          data: {
            messages: conversation.messages,
            updatedAt: conversation.updatedAt,
          },
        });
      } catch (error: any) {
        console.error('[ConversationManager] Error updating conversation in database:', error);
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
      throw error;
    }
  }

  async processMessage(
    conversationId: string | null,
    message: string,
    options: {
      userId: string;
      includeKnowledge?: boolean;
      context?: Record<string, any>;
      onChunk?: (chunk: string) => void;
    }
  ): Promise<AsyncGenerator<string> | string> {
    try {
      console.log('[ConversationManager] processMessage called with:', {
        conversationId,
        message: message.substring(0, 50) + '...',
        userId: options.userId,
        context: options.context
      });

      // For onboarding flow, create a temporary conversation
      if (!conversationId) {
        const conversation = await this.createConversation(
          options.userId,
          options.context || {}
        );
        conversationId = conversation.id;
        console.log('[ConversationManager] Created new conversation:', conversationId);
      }

      const conversation = await this.getConversation(conversationId);
      if (!conversation) throw new Error('Conversation not found');

      // Add user message
      await this.addMessage(conversationId, 'user', message);

      // Update onboarding context if applicable
      if (conversation.context.type === 'onboarding') {
        await this.updateOnboardingContext(conversationId, message);
        // Refresh conversation to get updated context
        const refreshedConversation = await this.getConversation(conversationId);
        if (refreshedConversation) {
          conversation.context = refreshedConversation.context;
          conversation.messages = refreshedConversation.messages;
        }
      }

      // Build context
      const systemPrompt = await this.buildSystemPrompt(conversation, options.includeKnowledge);
      const messages = this.buildMessageHistory(conversation, systemPrompt);
      
      console.log('[ConversationManager] Built messages:', messages.length, 'messages');
      console.log('[ConversationManager] System prompt length:', systemPrompt.length);

      // Get streaming response
      console.log('[ConversationManager] Getting chat completion stream...');
      const stream = await chatCompletionStream(messages);
      
      // Return async generator that yields chunks
      const self = this;
      return (async function* () {
        let fullResponse = '';
        console.log('[ConversationManager] Starting to process stream chunks...');
        
        for await (const chunk of stream) {
          // The stream returns AIStreamResponse objects, not raw OpenAI chunks
          const content = chunk.content || '';
          if (content) {
            fullResponse += content;
            console.log('[ConversationManager] Got chunk:', content.length, 'chars');
            if (options.onChunk) {
              options.onChunk(content);
            }
            yield content;
          }
          // Check if stream is done
          if (chunk.done) {
            console.log('[ConversationManager] Stream marked as done');
            break;
          }
        }
        
        console.log('[ConversationManager] Stream complete, full response:', fullResponse.length, 'chars');
        
        // Save complete response
        await self.addMessage(conversationId!, 'assistant', fullResponse);
      })();
    } catch (error: any) {
      console.error('[ConversationManager] processMessage error:', error);
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

    let systemPrompt = `You are the AI onboarding assistant for CreatorCompass. Your role is to guide new users through a conversational onboarding process to understand their creator journey and build a personalized roadmap.

IMPORTANT: You are conducting an ONBOARDING CONVERSATION, not providing general advice. Follow this structured flow:

Current Step: ${step}
User Responses So Far: ${JSON.stringify(responses, null, 2)}

CRITICAL RULES:
- NEVER ask a question that has already been answered
- Check the "User Responses So Far" before asking ANY question
- If platform is already in responses.preferredPlatforms, do NOT ask about platform again
- If a step is already complete, move to the next one

CONVERSATION FLOW:
1. Welcome & Creator Level (current step: ${step === 'welcome' ? 'ACTIVE' : 'COMPLETE'})
   ${responses.creatorLevel ? '✓ ALREADY ANSWERED: ' + responses.creatorLevel : '- Ask about their experience level (beginner/intermediate/advanced)'}
   - When they respond with "1" or "just starting out", acknowledge they're a beginner
   - DO NOT provide tips yet - move to next question

2. Platform Selection (current step: ${step === 'platform' ? 'ACTIVE' : step === 'welcome' ? 'PENDING' : 'COMPLETE'})
   ${responses.preferredPlatforms ? '✓ ALREADY ANSWERED: ' + responses.preferredPlatforms.join(', ') : '- Ask which platform they want to focus on: YouTube, TikTok, or Twitch'}
   - IMPORTANT: If preferredPlatforms already exists in responses, SKIP this question entirely

3. Content Niche (current step: ${step === 'niche' ? 'ACTIVE' : ['welcome', 'platform'].includes(step) ? 'PENDING' : 'COMPLETE'})
   ${responses.contentNiche ? '✓ ALREADY ANSWERED: ' + responses.contentNiche : '- Ask what type of content they want to create'}
   - Examples: gaming, education, lifestyle, comedy, etc.

4. Equipment & Setup (current step: ${step === 'equipment' ? 'ACTIVE' : ['welcome', 'platform', 'niche'].includes(step) ? 'PENDING' : 'COMPLETE'})
   ${responses.equipment ? '✓ ALREADY ANSWERED: ' + responses.equipment : '- Ask about their current equipment'}
   - Phone/camera, microphone, lighting, computer specs

5. Goals & Commitment (current step: ${step === 'goals' ? 'ACTIVE' : ['welcome', 'platform', 'niche', 'equipment'].includes(step) ? 'PENDING' : 'COMPLETE'})
   ${responses.goals ? '✓ ALREADY ANSWERED: ' + responses.goals : '- Ask about their content creation goals'}
   - How much time they can dedicate per week

6. Challenges (current step: ${step === 'challenges' ? 'ACTIVE' : step === 'complete' ? 'COMPLETE' : 'PENDING'})
   ${responses.challenges ? '✓ ALREADY ANSWERED: ' + responses.challenges : '- Ask what their biggest concerns or challenges are'}
   - IMPORTANT: After they answer, acknowledge their challenge and move to step 7

7. Complete (current step: ${step === 'complete' ? 'ACTIVE' : 'PENDING'})
   - Acknowledge their challenge first
   - Summarize what you've learned about them
   - Tell them you have everything needed to create their personalized roadmap
   - End with excitement about their journey ahead
   - MUST include: "Click the 'Start My Creator Journey' button below to access your personalized dashboard!"

RESPONSE GUIDELINES:
- ALWAYS check if a question has already been answered before asking it
- Keep responses conversational and encouraging
- Ask ONE main question at a time
- For beginners, be extra supportive and clear
- Show enthusiasm about their creator journey
- Ensure smooth transitions between questions

REMEMBER: You're building their confidence while gathering essential information. Make them feel excited about starting their creator journey!`;

    return systemPrompt;
  }

  private buildMessageHistory(
    conversation: AIConversation,
    systemPrompt: string
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    for (const msg of conversation.messages) {
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
    const stream = await chatCompletionStream(messages);
    let fullResponse = '';

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        yield content;
      }
    }

    // Save complete response
    await this.addMessage(conversationId, 'assistant', fullResponse);
  }

  private async getCompleteResponse(
    messages: OpenAI.Chat.ChatCompletionMessageParam[]
  ): Promise<string> {
    const completion = await chatCompletion(messages);
    return completion.choices[0]?.message?.content || '';
  }

  async updateOnboardingContext(conversationId: string, userMessage: string): Promise<void> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation || conversation.context.type !== 'onboarding') return;

    const currentStep = conversation.context.step || 'welcome';
    const responses = conversation.context.responses || {};

    // Parse user response based on current step
    switch (currentStep) {
      case 'welcome':
        // Detect creator level from response
        if (userMessage.match(/\b(1|beginner|new|just start|starting out|brand new)\b/i)) {
          responses.creatorLevel = 'beginner';
          conversation.context.step = 'platform';
        } else if (userMessage.match(/\b(2|intermediate|some experience|few months|year)\b/i)) {
          responses.creatorLevel = 'intermediate';
          conversation.context.step = 'platform';
        } else if (userMessage.match(/\b(3|advanced|expert|professional|years)\b/i)) {
          responses.creatorLevel = 'advanced';
          conversation.context.step = 'platform';
        }
        break;

      case 'platform':
        // Detect platform preference
        if (userMessage.match(/\b(youtube|yt)\b/i)) {
          responses.preferredPlatforms = ['youtube'];
          conversation.context.step = 'niche';
        } else if (userMessage.match(/\b(tiktok|tik tok)\b/i)) {
          responses.preferredPlatforms = ['tiktok'];
          conversation.context.step = 'niche';
        } else if (userMessage.match(/\b(twitch|streaming)\b/i)) {
          responses.preferredPlatforms = ['twitch'];
          conversation.context.step = 'niche';
        }
        break;

      case 'niche':
        // Store the content niche
        responses.contentNiche = userMessage.trim();
        conversation.context.step = 'equipment';
        break;

      case 'equipment':
        // Store equipment details
        responses.equipment = userMessage.trim();
        conversation.context.step = 'goals';
        break;

      case 'goals':
        // Store goals and time commitment
        responses.goals = userMessage.trim();
        conversation.context.step = 'challenges';
        break;

      case 'challenges':
        // Store challenges
        responses.challenges = userMessage.trim();
        conversation.context.step = 'complete';
        break;
    }

    // Update conversation context
    conversation.context.responses = responses;
    conversation.updatedAt = new Date();

    // Update cache
    this.conversationCache.set(conversationId, conversation);

    // Update database for authenticated users
    if (!conversation.userId.startsWith('onboarding-')) {
      try {
        const db = await this.getDb();
        await db.aiConversation.update({
          where: { id: conversationId },
          data: {
            context: conversation.context,
            updatedAt: conversation.updatedAt,
          },
        });
      } catch (error: any) {
        console.error('[ConversationManager] Error updating onboarding context:', error);
      }
    }
  }

  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    // Remove from cache
    this.conversationCache.delete(conversationId);

    // Remove from database
    try {
      const db = await this.getDb();
      await db.aiConversation.deleteMany({
        where: {
          id: conversationId,
          userId,
        },
      });
    } catch (error: any) {
      console.error('[ConversationManager] Error deleting conversation:', error);
    }
  }

  async getUserConversations(userId: string, limit: number = 10): Promise<AIConversation[]> {
    try {
      const db = await this.getDb();
      const dbConversations = await db.aiConversation.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });

      return dbConversations.map(conv => ({
        id: conv.id,
        userId: conv.userId,
        messages: conv.messages as ConversationMessage[],
        context: conv.context as Record<string, any>,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
      }));
    } catch (error: any) {
      console.error('[ConversationManager] Error getting user conversations:', error);
      return [];
    }
  }
}

export const conversationManager = new ConversationManager();