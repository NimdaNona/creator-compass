import { chatCompletionStream, chatCompletion } from './openai-service';
import { knowledgeBase } from './knowledge-base';
import { userContextService } from './user-context';
import { ConversationMessage, AIConversation } from './types';
import { prisma } from '../db';
import OpenAI from 'openai';

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
   - Example: "That's a common challenge for new streamers! Building an audience takes time, but with the right strategies, you'll get there. 🎯\\n\\nGreat! I now have everything I need to create your personalized roadmap:\\n- You're just starting out as a gaming streamer on Twitch\\n- You have basic equipment to begin with\\n- You can dedicate 30 hours/week\\n- Your main goal is building an audience\\n\\nI'm excited to help you on this journey! Your custom 90-day roadmap is ready to guide you from your first stream to building a thriving community.\\n\\nClick the 'Start My Creator Journey' button below to access your personalized dashboard! 🚀"

RESPONSE GUIDELINES:
- ALWAYS check if a question has already been answered before asking it
- Keep responses conversational and encouraging
- Ask ONE main question at a time
- Acknowledge their answer before moving to the next question
- Use emojis sparingly for friendliness
- If they provide multiple pieces of information, acknowledge all and still ask the next question
- DO NOT provide lengthy tips or tutorials during onboarding
- Focus on gathering information, not teaching
- In the final complete step, ALWAYS mention the button to continue

Example responses:
- "Great! So you're just starting out. That's exciting! 🌟 Which platform are you most interested in creating content for - YouTube, TikTok, or Twitch?"
- "Gaming content is awesome! There's such a great community. What equipment do you currently have for creating content?"`;

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

    // Update database
    await prisma.aIConversation.update({
      where: { id: conversationId },
      data: {
        context: conversation.context,
      },
    });

    // Clear cache to ensure fresh data
    this.conversationCache.delete(conversationId);
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