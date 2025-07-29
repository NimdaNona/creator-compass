import { prisma } from '@/lib/db';
import { conversationMemory } from './conversation-memory';

export type PersonalityType = 'guide' | 'coach' | 'cheerleader' | 'analyst' | 'mentor';

export interface CommunicationStyle {
  formality: 'formal' | 'casual' | 'adaptive';
  encouragement: 'high' | 'moderate' | 'minimal';
  detailLevel: 'detailed' | 'concise' | 'balanced';
  humor: boolean;
  emojis: boolean;
  technicalDepth: 'beginner' | 'intermediate' | 'advanced';
}

export interface PersonalityAdaptation {
  preferredGreeting: string;
  commonPhrases: string[];
  avoidPhrases: string[];
  responseLength: 'short' | 'medium' | 'long';
  proactivity: 'high' | 'medium' | 'low';
}

export class AIPersonalityService {
  private readonly DEFAULT_PERSONALITY: PersonalityType = 'guide';
  
  private readonly PERSONALITY_TRAITS = {
    guide: {
      description: 'Friendly and informative, focuses on teaching and explaining',
      traits: ['patient', 'educational', 'structured', 'encouraging'],
      communicationStyle: {
        formality: 'casual' as const,
        encouragement: 'high' as const,
        detailLevel: 'balanced' as const,
        humor: true,
        emojis: true,
        technicalDepth: 'beginner' as const
      }
    },
    coach: {
      description: 'Motivational and goal-oriented, pushes for growth',
      traits: ['motivating', 'direct', 'results-focused', 'challenging'],
      communicationStyle: {
        formality: 'casual' as const,
        encouragement: 'high' as const,
        detailLevel: 'concise' as const,
        humor: true,
        emojis: false,
        technicalDepth: 'intermediate' as const
      }
    },
    cheerleader: {
      description: 'Highly enthusiastic and celebratory, focuses on wins',
      traits: ['enthusiastic', 'celebratory', 'positive', 'energetic'],
      communicationStyle: {
        formality: 'casual' as const,
        encouragement: 'high' as const,
        detailLevel: 'concise' as const,
        humor: true,
        emojis: true,
        technicalDepth: 'beginner' as const
      }
    },
    analyst: {
      description: 'Data-driven and objective, focuses on metrics and insights',
      traits: ['analytical', 'precise', 'objective', 'thorough'],
      communicationStyle: {
        formality: 'formal' as const,
        encouragement: 'minimal' as const,
        detailLevel: 'detailed' as const,
        humor: false,
        emojis: false,
        technicalDepth: 'advanced' as const
      }
    },
    mentor: {
      description: 'Wise and experienced, provides strategic guidance',
      traits: ['wise', 'strategic', 'supportive', 'insightful'],
      communicationStyle: {
        formality: 'adaptive' as const,
        encouragement: 'moderate' as const,
        detailLevel: 'balanced' as const,
        humor: true,
        emojis: false,
        technicalDepth: 'advanced' as const
      }
    }
  };

  async getOrCreatePersonality(userId: string) {
    let personality = await prisma.aIPersonality.findUnique({
      where: { userId }
    });

    if (!personality) {
      // Analyze user profile to determine initial personality
      const userProfile = await prisma.userProfile.findUnique({
        where: { userId }
      });

      const initialType = await this.determineInitialPersonality(userId, userProfile);
      
      personality = await prisma.aIPersonality.create({
        data: {
          userId,
          personalityType: initialType,
          communicationStyle: this.PERSONALITY_TRAITS[initialType].communicationStyle,
          adaptations: {
            preferredGreeting: this.getDefaultGreeting(initialType),
            commonPhrases: this.getDefaultPhrases(initialType),
            avoidPhrases: [],
            responseLength: 'medium',
            proactivity: 'medium'
          },
          responsePatterns: {
            templates: this.getDefaultTemplates(initialType)
          }
        }
      });
    }

    return personality;
  }

  private async determineInitialPersonality(userId: string, profile: any): Promise<PersonalityType> {
    // Analyze user's initial preferences and goals
    if (!profile) return this.DEFAULT_PERSONALITY;

    const goals = profile.goals || {};
    const motivation = profile.motivation || '';

    // Simple heuristic based on user data
    if (motivation.toLowerCase().includes('learn') || goals.primary?.includes('education')) {
      return 'guide';
    } else if (motivation.toLowerCase().includes('grow') || goals.primary?.includes('growth')) {
      return 'coach';
    } else if (motivation.toLowerCase().includes('fun') || motivation.toLowerCase().includes('enjoy')) {
      return 'cheerleader';
    } else if (goals.primary?.includes('monetization') || goals.primary?.includes('analytics')) {
      return 'analyst';
    }

    return 'mentor';
  }

  async adaptPersonality(userId: string, interactionData: {
    userResponse: string;
    userSentiment: 'positive' | 'negative' | 'neutral';
    interactionType: string;
    effectiveness: number; // 0-1 scale
  }) {
    const personality = await this.getOrCreatePersonality(userId);
    const adaptations = personality.adaptations as PersonalityAdaptation;

    // Adapt based on user response patterns
    if (interactionData.effectiveness < 0.5) {
      // Current approach not working well, consider changes
      if (interactionData.userSentiment === 'negative') {
        // Reduce proactivity if user seems overwhelmed
        if (adaptations.proactivity === 'high') {
          adaptations.proactivity = 'medium';
        }
        
        // Switch to more encouraging personality if needed
        if (personality.personalityType === 'analyst' || personality.personalityType === 'coach') {
          await this.transitionPersonality(userId, 'guide');
        }
      }
    }

    // Learn from positive interactions
    if (interactionData.effectiveness > 0.8 && interactionData.userSentiment === 'positive') {
      // Gradually increase engagement
      if (adaptations.proactivity === 'low') {
        adaptations.proactivity = 'medium';
      } else if (adaptations.proactivity === 'medium') {
        adaptations.proactivity = 'high';
      }
    }

    // Update communication style based on user preferences
    const insights = await conversationMemory.getConversationInsights(userId);
    const style = personality.communicationStyle as CommunicationStyle;

    if (insights.preferredInteractionStyle.prefersConcise) {
      style.detailLevel = 'concise';
      adaptations.responseLength = 'short';
    } else if (insights.preferredInteractionStyle.prefersDetailed) {
      style.detailLevel = 'detailed';
      adaptations.responseLength = 'long';
    }

    return prisma.aIPersonality.update({
      where: { userId },
      data: {
        adaptations,
        communicationStyle: style,
        interactionStats: {
          totalInteractions: ((personality.interactionStats as any)?.totalInteractions || 0) + 1,
          lastAdaptation: new Date()
        }
      }
    });
  }

  private async transitionPersonality(userId: string, newType: PersonalityType) {
    const current = await this.getOrCreatePersonality(userId);
    const currentAdaptations = current.adaptations as PersonalityAdaptation;

    // Preserve learned preferences while transitioning
    const newPersonality = {
      personalityType: newType,
      communicationStyle: {
        ...this.PERSONALITY_TRAITS[newType].communicationStyle,
        // Keep learned preferences
        detailLevel: (current.communicationStyle as CommunicationStyle).detailLevel
      },
      adaptations: {
        ...currentAdaptations,
        preferredGreeting: this.getDefaultGreeting(newType),
        commonPhrases: [
          ...currentAdaptations.commonPhrases.slice(0, 3),
          ...this.getDefaultPhrases(newType)
        ]
      }
    };

    return prisma.aIPersonality.update({
      where: { userId },
      data: newPersonality
    });
  }

  async generatePersonalizedResponse(
    userId: string,
    baseResponse: string,
    context?: {
      interactionType?: string;
      userMood?: string;
      currentGoal?: string;
    }
  ): Promise<string> {
    const personality = await this.getOrCreatePersonality(userId);
    const style = personality.communicationStyle as CommunicationStyle;
    const adaptations = personality.adaptations as PersonalityAdaptation;

    let personalizedResponse = baseResponse;

    // Apply personality-specific modifications
    switch (personality.personalityType) {
      case 'guide':
        personalizedResponse = this.applyGuideStyle(personalizedResponse, style);
        break;
      case 'coach':
        personalizedResponse = this.applyCoachStyle(personalizedResponse, style);
        break;
      case 'cheerleader':
        personalizedResponse = this.applyCheerleaderStyle(personalizedResponse, style);
        break;
      case 'analyst':
        personalizedResponse = this.applyAnalystStyle(personalizedResponse, style);
        break;
      case 'mentor':
        personalizedResponse = this.applyMentorStyle(personalizedResponse, style);
        break;
    }

    // Apply learned adaptations
    if (adaptations.responseLength === 'short') {
      personalizedResponse = this.shortenResponse(personalizedResponse);
    } else if (adaptations.responseLength === 'long') {
      personalizedResponse = this.expandResponse(personalizedResponse);
    }

    // Add preferred phrases
    if (Math.random() < 0.3 && adaptations.commonPhrases.length > 0) {
      const phrase = adaptations.commonPhrases[Math.floor(Math.random() * adaptations.commonPhrases.length)];
      personalizedResponse = `${phrase} ${personalizedResponse}`;
    }

    return personalizedResponse;
  }

  private applyGuideStyle(response: string, style: CommunicationStyle): string {
    let styled = response;
    
    if (style.emojis) {
      styled = this.addEmojis(styled, ['💡', '✨', '🎯', '📚', '🚀']);
    }
    
    if (style.encouragement === 'high') {
      styled = this.addEncouragement(styled, [
        "You're doing great!",
        "Keep up the excellent work!",
        "That's a fantastic approach!"
      ]);
    }

    return styled;
  }

  private applyCoachStyle(response: string, style: CommunicationStyle): string {
    let styled = response;
    
    styled = this.addMotivation(styled, [
      "Let's push forward!",
      "Time to level up!",
      "You've got this!"
    ]);

    if (style.detailLevel === 'concise') {
      styled = this.makeActionable(styled);
    }

    return styled;
  }

  private applyCheerleaderStyle(response: string, style: CommunicationStyle): string {
    let styled = response;
    
    if (style.emojis) {
      styled = this.addEmojis(styled, ['🎉', '🌟', '🏆', '💪', '🔥', '🎊']);
    }
    
    styled = this.addExcitement(styled, [
      "Amazing work!",
      "You're crushing it!",
      "Absolutely brilliant!"
    ]);

    return styled;
  }

  private applyAnalystStyle(response: string, style: CommunicationStyle): string {
    let styled = response;
    
    styled = this.addDataFocus(styled);
    
    if (style.detailLevel === 'detailed') {
      styled = this.addMetrics(styled);
    }

    return styled;
  }

  private applyMentorStyle(response: string, style: CommunicationStyle): string {
    let styled = response;
    
    styled = this.addWisdom(styled, [
      "From my experience,",
      "Consider this perspective:",
      "A strategic approach would be"
    ]);

    return styled;
  }

  // Helper methods for style application
  private addEmojis(text: string, emojis: string[]): string {
    const sentences = text.split('. ');
    return sentences.map((sentence, i) => {
      if (i < emojis.length && Math.random() < 0.5) {
        return `${sentence} ${emojis[i]}`;
      }
      return sentence;
    }).join('. ');
  }

  private addEncouragement(text: string, phrases: string[]): string {
    if (Math.random() < 0.4) {
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      return `${text} ${phrase}`;
    }
    return text;
  }

  private addMotivation(text: string, phrases: string[]): string {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    return `${phrase} ${text}`;
  }

  private addExcitement(text: string, phrases: string[]): string {
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    return text.replace(/\.$/, `! ${phrase}`);
  }

  private addDataFocus(text: string): string {
    return text.replace(/approximately/gi, 'precisely')
      .replace(/probably/gi, 'statistically')
      .replace(/maybe/gi, 'potentially');
  }

  private addMetrics(text: string): string {
    // Add metric-focused language
    return `${text} (Based on current data trends and performance metrics)`;
  }

  private addWisdom(text: string, phrases: string[]): string {
    if (Math.random() < 0.5) {
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      return `${phrase} ${text}`;
    }
    return text;
  }

  private shortenResponse(text: string): string {
    const sentences = text.split('. ');
    if (sentences.length > 3) {
      return sentences.slice(0, 3).join('. ') + '.';
    }
    return text;
  }

  private expandResponse(text: string): string {
    return `${text} Let me know if you'd like me to elaborate on any specific aspect or if you have questions about this.`;
  }

  private makeActionable(text: string): string {
    if (!text.includes('1.') && !text.includes('•')) {
      return `Here's what to do: ${text}`;
    }
    return text;
  }

  private getDefaultGreeting(type: PersonalityType): string {
    const greetings = {
      guide: "Hey there! Ready to learn something new?",
      coach: "Let's get to work and make progress!",
      cheerleader: "Hey superstar! 🌟",
      analyst: "Hello. Let's review your data.",
      mentor: "Welcome back. Let's discuss your journey."
    };
    return greetings[type];
  }

  private getDefaultPhrases(type: PersonalityType): string[] {
    const phrases = {
      guide: ["Let me explain", "Here's how it works", "Think of it like"],
      coach: ["Time to level up", "Push yourself", "Focus on"],
      cheerleader: ["You're amazing", "Keep shining", "Celebrate this win"],
      analyst: ["The data shows", "Based on metrics", "Analyzing trends"],
      mentor: ["Consider this", "In my experience", "Long-term strategy"]
    };
    return phrases[type];
  }

  private getDefaultTemplates(type: PersonalityType): Record<string, string> {
    return {
      greeting: this.getDefaultGreeting(type),
      success: `Great job! ${type === 'cheerleader' ? '🎉' : ''}`,
      encouragement: type === 'coach' ? 'Keep pushing!' : 'You\'re doing well!',
      advice: type === 'mentor' ? 'Here\'s my recommendation:' : 'Try this:'
    };
  }

  async getPersonalityProfile(userId: string) {
    const personality = await this.getOrCreatePersonality(userId);
    const traits = this.PERSONALITY_TRAITS[personality.personalityType as PersonalityType];

    return {
      type: personality.personalityType,
      description: traits.description,
      traits: traits.traits,
      communicationStyle: personality.communicationStyle,
      adaptations: personality.adaptations,
      stats: personality.interactionStats
    };
  }
}

export const aiPersonality = new AIPersonalityService();