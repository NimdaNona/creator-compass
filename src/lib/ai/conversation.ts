import { chatCompletionStream } from './openai-service';
import { knowledgeBase } from './knowledge-base';
import { ConversationMessage, AIConversation } from './types';
import { prisma } from '../db';

export class ConversationManager {
  private conversationCache = new Map<string, AIConversation>();

  async createConversation(userId: string, initialContext?: Record<string, any>): Promise<AIConversation> {
    const conversation: AIConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      messages: [],
      context: initialContext || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.conversationCache.set(conversation.id, conversation);
    
    // Save to database
    await prisma.aIConversation.create({
      data: {
        id: conversation.id,
        userId,
        messages: [],
        context: initialContext || {},
      },
    });

    return conversation;
  }

  async getConversation(conversationId: string): Promise<AIConversation | null> {
    // Check cache first
    if (this.conversationCache.has(conversationId)) {
      return this.conversationCache.get(conversationId)!;
    }

    // Load from database
    const dbConversation = await prisma.aIConversation.findUnique({
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

    // Update database
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        messages: conversation.messages,
        updatedAt: conversation.updatedAt,
      },
    });
  }

  async processUserMessage(
    conversationId: string,
    userMessage: string,
    options?: {
      includeKnowledge?: boolean;
      stream?: boolean;
    }
  ): Promise<AsyncGenerator<string> | string> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) throw new Error('Conversation not found');

    // Add user message
    await this.addMessage(conversationId, 'user', userMessage);

    // Build context
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
  }

  private async buildSystemPrompt(
    conversation: AIConversation,
    includeKnowledge?: boolean
  ): Promise<string> {
    let systemPrompt = `You are an AI assistant for CreatorCompass, a platform that helps content creators grow their audience on YouTube, TikTok, and Twitch.
    
    You are knowledgeable, friendly, and focused on providing actionable advice to content creators.
    You understand platform algorithms, content strategies, and creator challenges.`;

    // Add user context if available
    if (conversation.context.userProfile) {
      systemPrompt += `\n\nUser Profile:
      - Creator Level: ${conversation.context.userProfile.creatorLevel}
      - Platforms: ${conversation.context.userProfile.preferredPlatforms?.join(', ')}
      - Niche: ${conversation.context.userProfile.contentNiche}
      - Goals: ${conversation.context.userProfile.goals?.join(', ')}`;
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

    // Update database
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        context: conversation.context,
      },
    });
  }

  async getUserConversations(userId: string, limit = 10): Promise<AIConversation[]> {
    const conversations = await prisma.aIConversation.findMany({
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
  }
}

// Export singleton instance
export const conversationManager = new ConversationManager();

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