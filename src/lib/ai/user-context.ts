import { prisma } from '@/lib/db';
import { User, UserAIProfile, Profile, UserStats, Subscription } from '@prisma/client';

export interface UserContext {
  // Basic info
  userId: string;
  email: string;
  
  // Creator profile
  creatorLevel: 'beginner' | 'intermediate' | 'advanced';
  platform: string;
  platforms: string[];
  niche: string;
  
  // Equipment and setup
  equipment: string[];
  contentStyle?: string;
  
  // Goals and progress
  goals: string[];
  challenges: string[];
  timeCommitment: string;
  
  // Current state
  currentPhase: 'Foundation' | 'Growth' | 'Scale';
  daysActive: number;
  tasksCompleted: number;
  totalTasks: number;
  streakDays: number;
  
  // Subscription
  isSubscribed: boolean;
  subscriptionTier?: string;
  
  // Recent activity
  recentCompletions: string[];
  achievements: string[];
  
  // Full onboarding responses
  onboardingData?: Record<string, any>;
}

export class UserContextService {
  private static instance: UserContextService;
  private contextCache = new Map<string, { context: UserContext; timestamp: number }>();
  private CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UserContextService {
    if (!UserContextService.instance) {
      UserContextService.instance = new UserContextService();
    }
    return UserContextService.instance;
  }

  async getUserContext(userId: string): Promise<UserContext | null> {
    // Check cache
    const cached = this.contextCache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.context;
    }

    try {
      // Fetch comprehensive user data
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userAIProfile: true,
          profile: true,
          stats: true,
          subscription: true,
          taskCompletions: {
            orderBy: { completedAt: 'desc' },
            take: 10,
          },
          milestoneAchievements: {
            orderBy: { achievedAt: 'desc' },
            take: 5,
          },
        },
      });

      if (!user) return null;

      // Build context
      const context = this.buildUserContext(user);
      
      // Cache it
      this.contextCache.set(userId, {
        context,
        timestamp: Date.now(),
      });

      return context;
    } catch (error) {
      console.error('Error fetching user context:', error);
      return null;
    }
  }

  async updateUserContextFromOnboarding(
    userId: string,
    onboardingResponses: Record<string, any>
  ): Promise<void> {
    try {
      // Extract key information from onboarding
      const {
        creatorLevel = 'beginner',
        preferredPlatforms = [],
        contentNiche = '',
        equipment = '',
        goals = '',
        challenges = '',
        timeCommitment = '',
      } = onboardingResponses;

      // Parse equipment, goals, and challenges from text responses
      const equipmentList = this.parseListFromText(equipment);
      const goalsList = this.parseListFromText(goals);
      const challengesList = this.parseListFromText(challenges);

      // Update or create UserAIProfile
      await prisma.userAIProfile.upsert({
        where: { userId },
        update: {
          creatorLevel,
          equipment: equipmentList,
          goals: goalsList,
          challenges: challengesList,
          timeCommitment,
          contentStyle: contentNiche,
          onboardingCompleted: true,
          onboardingData: onboardingResponses,
          updatedAt: new Date(),
        },
        create: {
          userId,
          creatorLevel,
          equipment: equipmentList,
          goals: goalsList,
          challenges: challengesList,
          timeCommitment,
          contentStyle: contentNiche,
          onboardingCompleted: true,
          onboardingData: onboardingResponses,
        },
      });

      // Update user profile with platform preferences
      if (preferredPlatforms.length > 0) {
        await prisma.profile.update({
          where: { userId },
          data: {
            selectedPlatform: preferredPlatforms[0], // Primary platform
            selectedNiche: contentNiche,
          },
        });
      }

      // Clear cache to force refresh
      this.contextCache.delete(userId);
    } catch (error) {
      console.error('Error updating user context from onboarding:', error);
      throw error;
    }
  }

  private buildUserContext(user: any): UserContext {
    const profile = user.profile;
    const aiProfile = user.userAIProfile;
    const stats = user.stats;
    const subscription = user.subscription;

    // Calculate days active
    const daysActive = profile?.createdAt 
      ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Determine current phase based on days active
    let currentPhase: 'Foundation' | 'Growth' | 'Scale' = 'Foundation';
    if (daysActive > 60) currentPhase = 'Scale';
    else if (daysActive > 30) currentPhase = 'Growth';

    return {
      userId: user.id,
      email: user.email,
      
      // Creator profile from AI profile and regular profile
      creatorLevel: aiProfile?.creatorLevel || 'beginner',
      platform: profile?.selectedPlatform || 'youtube',
      platforms: aiProfile?.onboardingData?.preferredPlatforms || [profile?.selectedPlatform || 'youtube'],
      niche: profile?.selectedNiche || aiProfile?.contentStyle || 'general',
      
      // Equipment and setup
      equipment: aiProfile?.equipment || [],
      contentStyle: aiProfile?.contentStyle,
      
      // Goals and progress
      goals: aiProfile?.goals || [],
      challenges: aiProfile?.challenges || [],
      timeCommitment: aiProfile?.timeCommitment || 'unknown',
      
      // Current state
      currentPhase,
      daysActive,
      tasksCompleted: stats?.totalTasksCompleted || 0,
      totalTasks: 90, // Standard 90-day roadmap
      streakDays: stats?.currentStreak || 0,
      
      // Subscription
      isSubscribed: subscription?.status === 'active',
      subscriptionTier: subscription?.tier,
      
      // Recent activity
      recentCompletions: user.taskCompletions.map((tc: any) => tc.taskId),
      achievements: user.milestoneAchievements.map((ma: any) => ma.milestoneId),
      
      // Full onboarding data
      onboardingData: aiProfile?.onboardingData,
    };
  }

  private parseListFromText(text: string): string[] {
    if (!text) return [];
    
    // Split by common delimiters
    const items = text.split(/[,;.\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
    
    return items;
  }

  clearUserCache(userId: string): void {
    this.contextCache.delete(userId);
  }

  clearAllCache(): void {
    this.contextCache.clear();
  }

  // Helper method to get context for AI system prompts
  async getAISystemPromptContext(userId: string): Promise<string> {
    const context = await this.getUserContext(userId);
    if (!context) return '';

    return `
User Profile:
- Creator Level: ${context.creatorLevel}
- Primary Platform: ${context.platform}
- All Platforms: ${context.platforms.join(', ')}
- Content Niche: ${context.niche}
- Current Phase: ${context.currentPhase} (Day ${context.daysActive} of 90)
- Progress: ${context.tasksCompleted}/${context.totalTasks} tasks completed
- Streak: ${context.streakDays} days
- Goals: ${context.goals.join(', ')}
- Challenges: ${context.challenges.join(', ')}
- Time Commitment: ${context.timeCommitment}
- Subscription: ${context.isSubscribed ? 'Pro' : 'Free'}`;
  }
}

// Export singleton instance
export const userContextService = UserContextService.getInstance();