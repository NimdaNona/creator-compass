import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { aiPersonality } from '@/lib/ai/personality-service';
import { conversationMemory } from '@/lib/ai/conversation-memory';
import { prisma } from '@/lib/db';
import { createOpenAIClient } from '@/lib/ai/openai-client';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { context } = await req.json();

    // Get user profile and journey state
    const [userProfile, journeyState, personalityProfile, recentConversations] = await Promise.all([
      prisma.userProfile.findUnique({
        where: { userId: session.user.id }
      }),
      prisma.userJourneyState.findUnique({
        where: { userId: session.user.id }
      }),
      aiPersonality.getPersonalityProfile(session.user.id),
      conversationMemory.getRecentConversations(session.user.id, 3)
    ]);

    // Get user's current stats and progress
    const stats = await prisma.userStats.findUnique({
      where: { userId: session.user.id }
    });

    // Build greeting context
    const greetingContext = {
      userName: session.user.name,
      platform: userProfile?.selectedPlatform,
      niche: userProfile?.selectedNiche,
      currentStage: journeyState?.currentStage || 'discovery',
      currentFocus: journeyState?.currentFocus,
      streakDays: stats?.streakDays || 0,
      totalTasksCompleted: stats?.totalTasksCompleted || 0,
      personalityType: personalityProfile.type,
      personalityTraits: personalityProfile.traits,
      recentTopics: recentConversations.flatMap(c => c.topicTags || []),
      pageContext: context,
      timeOfDay: getTimeOfDay(),
      dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
    };

    // Generate personalized greeting
    const prompt = `Generate a personalized greeting for a content creator with the following context:
- Name: ${greetingContext.userName || 'Creator'}
- Platform: ${greetingContext.platform || 'Not selected'}
- Niche: ${greetingContext.niche || 'Not selected'}
- Journey Stage: ${greetingContext.currentStage}
- Current Focus: ${greetingContext.currentFocus || 'Getting started'}
- Streak: ${greetingContext.streakDays} days
- Tasks Completed: ${greetingContext.totalTasksCompleted}
- Time: ${greetingContext.timeOfDay} on ${greetingContext.dayOfWeek}
- Recent Topics: ${greetingContext.recentTopics.join(', ') || 'None'}

AI Personality Type: ${greetingContext.personalityType}
Personality Traits: ${greetingContext.personalityTraits.join(', ')}

Generate a brief, personalized greeting that:
1. Acknowledges the time of day and any achievements
2. Matches the AI personality type
3. Is encouraging and relevant to their current journey stage
4. Optionally references recent topics if relevant
5. Ends with an open-ended question or offer to help
6. Keep it concise (2-3 sentences max)

Example format: "Good [time], [name]! [Achievement/status acknowledgment]. [Help offer/question]"`;

    const openai = createOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful AI assistant for content creators.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 150
    });

    const greeting = response.choices[0].message.content || getDefaultGreeting(greetingContext);

    // Apply personality styling
    const personalizedGreeting = await aiPersonality.generatePersonalizedResponse(
      session.user.id,
      greeting,
      { interactionType: 'greeting', currentGoal: greetingContext.currentFocus }
    );

    return NextResponse.json({ greeting: personalizedGreeting });

  } catch (error) {
    console.error('Generate greeting error:', error);
    // Return a default greeting on error
    return NextResponse.json({ 
      greeting: "Welcome back! I'm here to help you on your creator journey. What would you like to work on today?" 
    });
  }
}

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function getDefaultGreeting(context: any): string {
  const timeGreetings = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good evening"
  };

  const timeGreeting = timeGreetings[context.timeOfDay as keyof typeof timeGreetings] || "Hello";
  const name = context.userName ? `, ${context.userName}` : '';
  
  if (context.streakDays > 0) {
    return `${timeGreeting}${name}! Amazing ${context.streakDays}-day streak! 🔥 What would you like to work on today?`;
  }
  
  return `${timeGreeting}${name}! Ready to grow your ${context.platform || 'content'} channel? How can I help you today?`;
}