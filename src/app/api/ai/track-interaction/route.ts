import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { aiPersonality } from '@/lib/ai/personality-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      conversationId, 
      userMessage, 
      assistantResponse, 
      metadata, 
      context 
    } = await req.json();

    // Analyze interaction effectiveness
    const effectiveness = analyzeInteractionEffectiveness(userMessage, assistantResponse, metadata);
    const sentiment = analyzeSentiment(userMessage);

    // Track the interaction
    await prisma.aIInteraction.create({
      data: {
        userId: session.user.id,
        interactionType: context?.interactionType || 'chat',
        context: {
          conversationId,
          page: context?.page,
          feature: context?.feature,
          metadata: context
        },
        interaction: {
          userMessage,
          assistantResponse: assistantResponse.substring(0, 500), // Store truncated version
          metadata
        },
        userResponse: determineUserResponse(userMessage),
        sessionId: conversationId,
        impact: {
          effectiveness,
          sentiment,
          messageLength: userMessage.length,
          responseLength: assistantResponse.length
        }
      }
    });

    // Adapt personality based on interaction
    await aiPersonality.adaptPersonality(session.user.id, {
      userResponse: userMessage,
      userSentiment: sentiment,
      interactionType: context?.interactionType || 'chat',
      effectiveness
    });

    // Update user journey state if needed
    await updateUserJourneyState(session.user.id, userMessage, context);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Track interaction error:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

function analyzeInteractionEffectiveness(
  userMessage: string, 
  assistantResponse: string, 
  metadata: any
): number {
  let score = 0.5; // Base score

  // Positive indicators
  if (userMessage.toLowerCase().includes('thanks') || 
      userMessage.toLowerCase().includes('perfect') ||
      userMessage.toLowerCase().includes('great')) {
    score += 0.2;
  }

  // Length of interaction (longer = more engaged)
  if (userMessage.length > 50) score += 0.1;
  if (assistantResponse.length > 200) score += 0.1;

  // Metadata indicators
  if (metadata?.helpfulness > 3) score += 0.2;
  if (metadata?.confidence > 0.8) score += 0.1;

  // Negative indicators
  if (userMessage.toLowerCase().includes('confused') ||
      userMessage.toLowerCase().includes('don\'t understand') ||
      userMessage.toLowerCase().includes('not helpful')) {
    score -= 0.3;
  }

  return Math.max(0, Math.min(1, score));
}

function analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['great', 'awesome', 'love', 'excellent', 'happy', 'thanks', 'good', 'perfect', 'amazing'];
  const negativeWords = ['bad', 'hate', 'frustrated', 'confused', 'difficult', 'hard', 'stuck', 'help', 'wrong', 'issue'];
  
  const lowercaseMessage = message.toLowerCase();
  
  const positiveCount = positiveWords.filter(word => lowercaseMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowercaseMessage.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function determineUserResponse(message: string): string {
  const lowercaseMessage = message.toLowerCase();
  
  if (lowercaseMessage.includes('yes') || 
      lowercaseMessage.includes('sure') || 
      lowercaseMessage.includes('ok')) {
    return 'accepted';
  }
  
  if (lowercaseMessage.includes('no') || 
      lowercaseMessage.includes('not') || 
      lowercaseMessage.includes('don\'t')) {
    return 'dismissed';
  }
  
  if (lowercaseMessage.includes('change') || 
      lowercaseMessage.includes('modify') || 
      lowercaseMessage.includes('adjust')) {
    return 'modified';
  }
  
  return 'engaged';
}

async function updateUserJourneyState(userId: string, message: string, context: any) {
  const lowercaseMessage = message.toLowerCase();
  
  // Check for stage-related keywords
  const stageKeywords = {
    discovery: ['getting started', 'new', 'beginner', 'first time'],
    foundation: ['setup', 'channel', 'profile', 'basics'],
    growth: ['grow', 'audience', 'subscribers', 'views'],
    scale: ['monetize', 'sponsor', 'income', 'scale'],
    mastery: ['advanced', 'expert', 'optimize', 'analytics']
  };

  let detectedStage: string | null = null;
  
  for (const [stage, keywords] of Object.entries(stageKeywords)) {
    if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
      detectedStage = stage;
      break;
    }
  }

  if (detectedStage || context?.focus) {
    const currentState = await prisma.userJourneyState.findUnique({
      where: { userId }
    });

    if (currentState) {
      await prisma.userJourneyState.update({
        where: { userId },
        data: {
          ...(detectedStage && { currentStage: detectedStage }),
          ...(context?.focus && { currentFocus: context.focus }),
          lastGuidanceAt: new Date(),
          aiInsights: {
            ...((currentState.aiInsights as any) || {}),
            lastInteractionTopics: [
              ...(((currentState.aiInsights as any)?.lastInteractionTopics || []).slice(-9)),
              { topic: message.substring(0, 100), timestamp: new Date() }
            ]
          }
        }
      });
    }
  }
}