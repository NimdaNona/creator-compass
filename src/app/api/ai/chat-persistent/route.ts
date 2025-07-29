import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createOpenAIClient } from '@/lib/ai/openai-client';
import { conversationMemory } from '@/lib/ai/conversation-memory';
import { aiPersonality } from '@/lib/ai/personality-service';
import { prisma } from '@/lib/db';
import { trackUsage } from '@/lib/usage';
import { streamingResponse } from '@/lib/ai/streaming';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, message, context, includeMemory, adaptPersonality } = await req.json();

    // Check usage limits for free tier
    const subscription = await prisma.userSubscription.findUnique({
      where: { userId: session.user.id }
    });

    const isFreeTier = !subscription || subscription.plan === 'free';
    if (isFreeTier) {
      const { allowed } = await trackUsage(session.user.id, 'templates', true);
      if (!allowed) {
        return NextResponse.json({
          error: 'Monthly AI message limit reached. Upgrade to Pro for unlimited AI assistance.',
          requiresUpgrade: true
        }, { status: 403 });
      }
    }

    // Get or create conversation memory
    const conversation = await conversationMemory.getOrCreateConversation(
      session.user.id,
      conversationId
    );

    // Add user message to memory
    await conversationMemory.addMessage(conversation.conversationId, {
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Get conversation context
    const conversationContext = await conversationMemory.getConversationContext(
      conversation.conversationId
    );

    // Get user's AI personality profile
    const personalityProfile = await aiPersonality.getOrCreatePersonality(session.user.id);

    // Build system prompt with personality and context
    const systemPrompt = buildSystemPrompt(personalityProfile, conversationContext, context);

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system' as const, content: systemPrompt }
    ];

    // Include conversation history if requested
    if (includeMemory && conversationContext?.messages) {
      const recentMessages = conversationContext.messages.slice(-10); // Last 10 messages
      messages.push(...recentMessages.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })));
    }

    // Add current user message
    messages.push({ role: 'user' as const, content: message });

    // Get streaming response from OpenAI
    const openai = createOpenAIClient();
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      stream: true,
      max_tokens: 1000
    });

    // Track response for personality adaptation
    let fullResponse = '';

    // Create streaming response
    const encoder = new TextEncoder();
    const streamingResponse = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            conversationId: conversation.conversationId 
          })}\n\n`));

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              
              // Apply personality to the response chunk
              const personalizedContent = await aiPersonality.generatePersonalizedResponse(
                session.user.id,
                content,
                { interactionType: 'chat', currentGoal: context?.goal }
              );

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                content: personalizedContent 
              })}\n\n`));
            }
          }

          // Save assistant message to memory
          await conversationMemory.addMessage(conversation.conversationId, {
            role: 'assistant',
            content: fullResponse,
            timestamp: new Date(),
            metadata: {
              personalityType: personalityProfile.personalityType,
              context
            }
          });

          // Adapt personality based on interaction
          if (adaptPersonality) {
            await aiPersonality.adaptPersonality(session.user.id, {
              userResponse: message,
              userSentiment: analyzeSentiment(message),
              interactionType: 'chat',
              effectiveness: 0.8 // Default to good effectiveness
            });

            // Send personality update if changed
            const updatedProfile = await aiPersonality.getPersonalityProfile(session.user.id);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              personalityUpdate: updatedProfile 
            })}\n\n`));
          }

          // Send done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            done: true,
            metadata: {
              conversationId: conversation.conversationId,
              messageCount: conversationContext?.messages.length || 0
            }
          })}\n\n`));

          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      }
    });

    return new Response(streamingResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Chat persistent error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(personalityProfile: any, conversationContext: any, context: any): string {
  const personalityTraits = {
    guide: "You are a friendly and patient guide who teaches and explains concepts clearly.",
    coach: "You are a motivational coach who pushes for growth and results.",
    cheerleader: "You are an enthusiastic cheerleader who celebrates wins and encourages positivity.",
    analyst: "You are a data-driven analyst who focuses on metrics and objective insights.",
    mentor: "You are a wise mentor who provides strategic guidance and long-term perspective."
  };

  const basePrompt = `You are an AI assistant for Creator Compass, a platform helping content creators grow their audience.
  
Your personality type is: ${personalityProfile.personalityType}
${personalityTraits[personalityProfile.personalityType as keyof typeof personalityTraits]}

Communication style preferences:
- Formality: ${personalityProfile.communicationStyle.formality}
- Encouragement level: ${personalityProfile.communicationStyle.encouragement}
- Detail level: ${personalityProfile.communicationStyle.detailLevel}
- Use humor: ${personalityProfile.communicationStyle.humor}
- Use emojis: ${personalityProfile.communicationStyle.emojis}
- Technical depth: ${personalityProfile.communicationStyle.technicalDepth}

${conversationContext?.summary ? `Previous conversation summary: ${conversationContext.summary}` : ''}
${conversationContext?.userPreferences ? `User preferences: ${JSON.stringify(conversationContext.userPreferences)}` : ''}
${context ? `Current context: ${JSON.stringify(context)}` : ''}

Remember to:
1. Maintain your personality type consistently
2. Adapt your response style based on the communication preferences
3. Reference previous conversations when relevant
4. Provide actionable advice for content creators
5. Be supportive and encouraging while maintaining your personality
`;

  return basePrompt;
}

function analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['great', 'awesome', 'love', 'excellent', 'happy', 'thanks', 'good', 'perfect'];
  const negativeWords = ['bad', 'hate', 'frustrated', 'confused', 'difficult', 'hard', 'stuck', 'help'];
  
  const lowercaseMessage = message.toLowerCase();
  
  const positiveCount = positiveWords.filter(word => lowercaseMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowercaseMessage.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}