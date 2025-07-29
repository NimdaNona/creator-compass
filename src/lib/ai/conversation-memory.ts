import { prisma } from '@/lib/db';
import { createOpenAIClient } from '@/lib/ai/openai-client';
import { nanoid } from 'nanoid';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ConversationSummary {
  mainTopics: string[];
  keyDecisions: string[];
  userSentiment: 'positive' | 'neutral' | 'negative' | 'mixed';
  actionItems: string[];
  preferences: Record<string, any>;
}

export class ConversationMemoryService {
  private readonly MAX_MESSAGES_PER_CONVERSATION = 100;
  private readonly SUMMARIZE_AFTER_MESSAGES = 20;
  private readonly MEMORY_RETENTION_DAYS = 90;

  async getOrCreateConversation(userId: string, conversationId?: string) {
    if (conversationId) {
      const existing = await prisma.conversationMemory.findUnique({
        where: { conversationId }
      });
      if (existing) return existing;
    }

    const newConversationId = conversationId || `conv_${nanoid()}`;
    return prisma.conversationMemory.create({
      data: {
        userId,
        conversationId: newConversationId,
        messages: [],
        topicTags: [],
        lastActiveAt: new Date()
      }
    });
  }

  async addMessage(
    conversationId: string,
    message: Message
  ) {
    const conversation = await prisma.conversationMemory.findUnique({
      where: { conversationId }
    });

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const messages = (conversation.messages as Message[]) || [];
    messages.push(message);

    // Trim old messages if exceeding limit
    const trimmedMessages = messages.slice(-this.MAX_MESSAGES_PER_CONVERSATION);

    // Check if we should summarize
    const shouldSummarize = messages.length >= this.SUMMARIZE_AFTER_MESSAGES &&
      messages.length % this.SUMMARIZE_AFTER_MESSAGES === 0;

    let updates: any = {
      messages: trimmedMessages,
      lastActiveAt: new Date()
    };

    if (shouldSummarize) {
      const summary = await this.generateConversationSummary(trimmedMessages);
      updates = {
        ...updates,
        summary: summary.summary,
        keyInsights: summary.keyInsights,
        userPreferences: summary.preferences,
        topicTags: summary.topicTags,
        emotionalContext: summary.emotionalContext,
        actionItems: summary.actionItems
      };
    }

    return prisma.conversationMemory.update({
      where: { conversationId },
      data: updates
    });
  }

  private async generateConversationSummary(messages: Message[]) {
    const prompt = `Analyze this conversation and extract:
1. A brief summary (2-3 sentences)
2. Key insights and decisions made
3. User preferences mentioned
4. Main topics discussed (as tags)
5. User's emotional context
6. Action items or follow-ups needed

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

Return as JSON with structure:
{
  "summary": "string",
  "keyInsights": ["insight1", "insight2"],
  "preferences": { "key": "value" },
  "topicTags": ["tag1", "tag2"],
  "emotionalContext": { "mood": "string", "concerns": ["concern1"] },
  "actionItems": ["item1", "item2"]
}`;

    const openai = createOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }

  async getRecentConversations(userId: string, limit = 5) {
    return prisma.conversationMemory.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
      take: limit,
      select: {
        conversationId: true,
        summary: true,
        topicTags: true,
        lastActiveAt: true
      }
    });
  }

  async searchConversations(userId: string, query: string) {
    // Search in summaries and topic tags
    const conversations = await prisma.conversationMemory.findMany({
      where: {
        userId,
        OR: [
          { summary: { contains: query, mode: 'insensitive' } },
          { topicTags: { has: query.toLowerCase() } }
        ]
      },
      orderBy: { lastActiveAt: 'desc' }
    });

    // Also search in messages for more detailed results
    const detailedSearch = await Promise.all(
      conversations.map(async (conv) => {
        const messages = conv.messages as Message[];
        const relevantMessages = messages.filter(m => 
          m.content.toLowerCase().includes(query.toLowerCase())
        );
        
        return {
          ...conv,
          relevantMessages,
          relevanceScore: relevantMessages.length
        };
      })
    );

    return detailedSearch.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async getConversationContext(conversationId: string) {
    const conversation = await prisma.conversationMemory.findUnique({
      where: { conversationId }
    });

    if (!conversation) return null;

    return {
      messages: conversation.messages as Message[],
      summary: conversation.summary,
      keyInsights: conversation.keyInsights,
      userPreferences: conversation.userPreferences,
      emotionalContext: conversation.emotionalContext,
      actionItems: conversation.actionItems,
      topicTags: conversation.topicTags
    };
  }

  async mergeUserPreferences(userId: string) {
    // Aggregate preferences from all conversations
    const conversations = await prisma.conversationMemory.findMany({
      where: { userId },
      select: { userPreferences: true }
    });

    const mergedPreferences: Record<string, any> = {};
    
    conversations.forEach(conv => {
      if (conv.userPreferences) {
        Object.assign(mergedPreferences, conv.userPreferences);
      }
    });

    return mergedPreferences;
  }

  async cleanupOldConversations() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.MEMORY_RETENTION_DAYS);

    return prisma.conversationMemory.deleteMany({
      where: {
        lastActiveAt: { lt: cutoffDate }
      }
    });
  }

  // Get conversation insights for AI personality adaptation
  async getConversationInsights(userId: string) {
    const conversations = await prisma.conversationMemory.findMany({
      where: { userId },
      orderBy: { lastActiveAt: 'desc' },
      take: 10
    });

    const insights = {
      totalConversations: conversations.length,
      topTopics: this.extractTopTopics(conversations),
      commonConcerns: this.extractCommonConcerns(conversations),
      preferredInteractionStyle: this.analyzeInteractionStyle(conversations),
      averageSessionLength: this.calculateAverageSessionLength(conversations)
    };

    return insights;
  }

  private extractTopTopics(conversations: any[]) {
    const topicCounts: Record<string, number> = {};
    
    conversations.forEach(conv => {
      (conv.topicTags || []).forEach((tag: string) => {
        topicCounts[tag] = (topicCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }));
  }

  private extractCommonConcerns(conversations: any[]) {
    const concerns: string[] = [];
    
    conversations.forEach(conv => {
      if (conv.emotionalContext?.concerns) {
        concerns.push(...conv.emotionalContext.concerns);
      }
    });

    return [...new Set(concerns)];
  }

  private analyzeInteractionStyle(conversations: any[]) {
    // Analyze message patterns to determine preferred interaction style
    let totalMessages = 0;
    let userMessageLengths: number[] = [];

    conversations.forEach(conv => {
      const messages = (conv.messages || []) as Message[];
      messages.forEach(msg => {
        if (msg.role === 'user') {
          userMessageLengths.push(msg.content.length);
          totalMessages++;
        }
      });
    });

    const avgMessageLength = userMessageLengths.reduce((a, b) => a + b, 0) / userMessageLengths.length;

    return {
      prefersConcise: avgMessageLength < 50,
      prefersDetailed: avgMessageLength > 150,
      messageStyle: avgMessageLength < 50 ? 'brief' : avgMessageLength > 150 ? 'detailed' : 'moderate'
    };
  }

  private calculateAverageSessionLength(conversations: any[]) {
    const sessionLengths = conversations.map(conv => {
      const messages = (conv.messages || []) as Message[];
      return messages.length;
    });

    return sessionLengths.reduce((a, b) => a + b, 0) / sessionLengths.length;
  }
}

export const conversationMemory = new ConversationMemoryService();