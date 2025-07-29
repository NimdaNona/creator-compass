import { prisma } from '@/lib/db';
import { xpSystem } from './xp-system';
import { badgesAndAchievements } from './badges-achievements';
import { createOpenAIClient } from '@/lib/ai/openai-client';

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'feature' | 'cosmetic' | 'template' | 'perk' | 'content' | 'discount';
  category: 'ui' | 'functionality' | 'premium' | 'exclusive';
  unlockRequirement: UnlockRequirement;
  value: any;
  icon?: string;
  preview?: string;
  metadata?: Record<string, any>;
}

export interface UnlockRequirement {
  type: 'level' | 'achievement' | 'badge' | 'xp' | 'streak' | 'special';
  target: string | number;
  description: string;
}

export interface UnlockedReward {
  rewardId: string;
  userId: string;
  unlockedAt: Date;
  claimedAt?: Date;
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface RewardTier {
  tier: number;
  name: string;
  requiredLevel: number;
  rewards: Reward[];
}

export class RewardSystem {
  private readonly REWARDS: Reward[] = [
    // Feature Unlocks
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics Dashboard',
      description: 'Unlock detailed analytics and insights for your content',
      type: 'feature',
      category: 'functionality',
      unlockRequirement: { type: 'level', target: 3, description: 'Reach Level 3' },
      value: { featureId: 'analytics-pro' },
      icon: '📊'
    },
    {
      id: 'ai-content-ideas',
      name: 'AI Content Ideas Generator',
      description: 'Get unlimited AI-powered content ideas',
      type: 'feature',
      category: 'functionality',
      unlockRequirement: { type: 'level', target: 4, description: 'Reach Level 4' },
      value: { featureId: 'ai-ideas-unlimited' },
      icon: '🤖'
    },
    {
      id: 'collaboration-tools',
      name: 'Collaboration Tools',
      description: 'Invite team members and collaborate on content',
      type: 'feature',
      category: 'functionality',
      unlockRequirement: { type: 'level', target: 5, description: 'Reach Level 5' },
      value: { featureId: 'collaboration' },
      icon: '👥'
    },
    
    // Cosmetic Unlocks
    {
      id: 'dark-theme-variants',
      name: 'Premium Theme Pack',
      description: 'Unlock 5 exclusive theme variations',
      type: 'cosmetic',
      category: 'ui',
      unlockRequirement: { type: 'achievement', target: 'theme-explorer', description: 'Complete Theme Explorer achievement' },
      value: { themes: ['midnight', 'sunset', 'ocean', 'forest', 'cosmic'] },
      icon: '🎨'
    },
    {
      id: 'profile-frames',
      name: 'Profile Frame Collection',
      description: 'Decorative frames for your profile',
      type: 'cosmetic',
      category: 'ui',
      unlockRequirement: { type: 'xp', target: 5000, description: 'Earn 5000 XP' },
      value: { frames: ['gold', 'platinum', 'rainbow', 'animated-fire'] },
      icon: '🖼️'
    },
    {
      id: 'chat-emojis',
      name: 'Exclusive Emoji Pack',
      description: 'Special emojis for AI chat and comments',
      type: 'cosmetic',
      category: 'ui',
      unlockRequirement: { type: 'badge', target: 'community-champion', description: 'Earn Community Champion badge' },
      value: { emojis: ['creator-crown', 'viral-fire', 'engagement-star'] },
      icon: '😎'
    },
    
    // Template Unlocks
    {
      id: 'premium-templates',
      name: 'Premium Template Library',
      description: 'Access to 50+ premium content templates',
      type: 'template',
      category: 'premium',
      unlockRequirement: { type: 'level', target: 6, description: 'Reach Level 6' },
      value: { templateCount: 50, categories: ['viral', 'educational', 'entertainment'] },
      icon: '📝'
    },
    {
      id: 'ai-template-customizer',
      name: 'AI Template Customizer',
      description: 'Create custom templates with AI assistance',
      type: 'template',
      category: 'premium',
      unlockRequirement: { type: 'achievement', target: 'template-master', description: 'Complete Template Master achievement' },
      value: { featureId: 'ai-template-builder' },
      icon: '🛠️'
    },
    
    // Perks
    {
      id: 'priority-support',
      name: 'Priority Support Access',
      description: 'Get faster response times and dedicated support',
      type: 'perk',
      category: 'exclusive',
      unlockRequirement: { type: 'level', target: 7, description: 'Reach Level 7' },
      value: { supportLevel: 'priority', responseTime: '2 hours' },
      icon: '🎯'
    },
    {
      id: 'beta-features',
      name: 'Beta Feature Access',
      description: 'Try new features before everyone else',
      type: 'perk',
      category: 'exclusive',
      unlockRequirement: { type: 'achievement', target: 'early-adopter', description: 'Be an early adopter' },
      value: { betaAccess: true },
      icon: '🚀'
    },
    {
      id: 'monthly-coaching',
      name: 'Monthly Coaching Call',
      description: 'Get a 30-minute monthly coaching session',
      type: 'perk',
      category: 'exclusive',
      unlockRequirement: { type: 'level', target: 8, description: 'Reach Level 8' },
      value: { coachingMinutes: 30, frequency: 'monthly' },
      icon: '📞'
    },
    
    // Content Unlocks
    {
      id: 'exclusive-guides',
      name: 'Exclusive Creator Guides',
      description: 'Access to advanced growth strategies and case studies',
      type: 'content',
      category: 'premium',
      unlockRequirement: { type: 'xp', target: 10000, description: 'Earn 10,000 XP' },
      value: { guides: ['viral-formula', 'monetization-mastery', 'audience-psychology'] },
      icon: '📚'
    },
    {
      id: 'masterclass-series',
      name: 'Creator Masterclass Series',
      description: 'Video tutorials from successful creators',
      type: 'content',
      category: 'premium',
      unlockRequirement: { type: 'level', target: 9, description: 'Reach Level 9' },
      value: { videos: 12, totalHours: 24 },
      icon: '🎥'
    },
    
    // Discounts
    {
      id: 'pro-discount-20',
      name: '20% Pro Plan Discount',
      description: 'Get 20% off Pro plan for life',
      type: 'discount',
      category: 'exclusive',
      unlockRequirement: { type: 'streak', target: 30, description: '30-day streak' },
      value: { discountPercent: 20, planType: 'pro', lifetime: true },
      icon: '💰'
    },
    {
      id: 'studio-discount-25',
      name: '25% Studio Plan Discount',
      description: 'Get 25% off Studio plan for life',
      type: 'discount',
      category: 'exclusive',
      unlockRequirement: { type: 'level', target: 10, description: 'Reach Level 10' },
      value: { discountPercent: 25, planType: 'studio', lifetime: true },
      icon: '💎'
    }
  ];

  private readonly REWARD_TIERS: RewardTier[] = [
    {
      tier: 1,
      name: 'Starter Rewards',
      requiredLevel: 1,
      rewards: this.REWARDS.filter(r => 
        r.unlockRequirement.type === 'level' && 
        r.unlockRequirement.target <= 2
      )
    },
    {
      tier: 2,
      name: 'Growth Rewards',
      requiredLevel: 3,
      rewards: this.REWARDS.filter(r => 
        r.unlockRequirement.type === 'level' && 
        r.unlockRequirement.target >= 3 && 
        r.unlockRequirement.target <= 5
      )
    },
    {
      tier: 3,
      name: 'Pro Rewards',
      requiredLevel: 6,
      rewards: this.REWARDS.filter(r => 
        r.unlockRequirement.type === 'level' && 
        r.unlockRequirement.target >= 6 && 
        r.unlockRequirement.target <= 8
      )
    },
    {
      tier: 4,
      name: 'Elite Rewards',
      requiredLevel: 9,
      rewards: this.REWARDS.filter(r => 
        r.unlockRequirement.type === 'level' && 
        r.unlockRequirement.target >= 9
      )
    }
  ];

  async checkAndUnlockRewards(
    userId: string,
    triggerType: 'level_up' | 'achievement' | 'badge' | 'xp' | 'streak',
    triggerValue: string | number
  ): Promise<Reward[]> {
    const unlockedRewards: Reward[] = [];
    const existingUnlocks = await this.getUserUnlockedRewards(userId);
    const unlockedRewardIds = existingUnlocks.map(u => u.rewardId);

    for (const reward of this.REWARDS) {
      // Skip if already unlocked
      if (unlockedRewardIds.includes(reward.id)) continue;

      // Check if reward should be unlocked
      const shouldUnlock = await this.checkUnlockRequirement(
        userId,
        reward.unlockRequirement,
        triggerType,
        triggerValue
      );

      if (shouldUnlock) {
        await this.unlockReward(userId, reward);
        unlockedRewards.push(reward);
      }
    }

    return unlockedRewards;
  }

  private async checkUnlockRequirement(
    userId: string,
    requirement: UnlockRequirement,
    triggerType: string,
    triggerValue: string | number
  ): Promise<boolean> {
    // Quick check if trigger matches requirement type
    if (requirement.type !== triggerType) {
      // Still need to check if requirement is already met
      return await this.isRequirementMet(userId, requirement);
    }

    // Direct trigger match
    switch (requirement.type) {
      case 'level':
        return triggerValue >= requirement.target;
      
      case 'achievement':
      case 'badge':
        return triggerValue === requirement.target;
      
      case 'xp':
        const stats = await prisma.userStats.findUnique({ where: { userId } });
        return (stats?.totalXP || 0) >= (requirement.target as number);
      
      case 'streak':
        return triggerValue >= requirement.target;
      
      default:
        return false;
    }
  }

  private async isRequirementMet(userId: string, requirement: UnlockRequirement): Promise<boolean> {
    switch (requirement.type) {
      case 'level':
        const level = await xpSystem.getUserLevel(userId);
        return level.level >= (requirement.target as number);
      
      case 'achievement':
        const achievements = await badgesAndAchievements.getUserAchievements(userId);
        return achievements.some(a => a.achievementId === requirement.target);
      
      case 'badge':
        const badges = await badgesAndAchievements.getUserBadges(userId);
        return badges.some(b => b.badgeId === requirement.target);
      
      case 'xp':
        const stats = await prisma.userStats.findUnique({ where: { userId } });
        return (stats?.totalXP || 0) >= (requirement.target as number);
      
      case 'streak':
        const userStats = await prisma.userStats.findUnique({ where: { userId } });
        return (userStats?.streakDays || 0) >= (requirement.target as number);
      
      default:
        return false;
    }
  }

  private async unlockReward(userId: string, reward: Reward): Promise<void> {
    // Record unlock
    await prisma.unlockedReward.create({
      data: {
        userId,
        rewardId: reward.id,
        rewardType: reward.type,
        rewardName: reward.name,
        rewardDescription: reward.description,
        category: reward.category,
        value: reward.value,
        unlockedAt: new Date(),
        isActive: true,
        metadata: reward.metadata
      }
    });

    // Process reward based on type
    await this.activateReward(userId, reward);

    // Create notification
    await this.createRewardNotification(userId, reward);
  }

  private async activateReward(userId: string, reward: Reward): Promise<void> {
    switch (reward.type) {
      case 'feature':
        await prisma.unlockedFeature.create({
          data: {
            userId,
            featureId: reward.value.featureId,
            featureName: reward.name,
            unlockedAt: new Date(),
            unlockedBy: 'reward'
          }
        });
        break;
      
      case 'cosmetic':
        await prisma.userCosmetic.create({
          data: {
            userId,
            cosmeticId: reward.id,
            cosmeticType: reward.category,
            name: reward.name,
            value: reward.value,
            unlockedAt: new Date()
          }
        });
        break;
      
      case 'template':
        // Grant access to premium templates
        await prisma.userTemplateAccess.create({
          data: {
            userId,
            templatePackId: reward.id,
            templateCount: reward.value.templateCount || 0,
            categories: reward.value.categories || [],
            unlockedAt: new Date()
          }
        });
        break;
      
      case 'perk':
        await prisma.userPerk.create({
          data: {
            userId,
            perkId: reward.id,
            perkName: reward.name,
            perkValue: reward.value,
            activatedAt: new Date(),
            expiresAt: this.calculatePerkExpiration(reward)
          }
        });
        break;
      
      case 'content':
        await prisma.contentAccess.create({
          data: {
            userId,
            contentId: reward.id,
            contentType: 'premium',
            grantedAt: new Date()
          }
        });
        break;
      
      case 'discount':
        await prisma.userDiscount.create({
          data: {
            userId,
            discountId: reward.id,
            discountPercent: reward.value.discountPercent,
            applicableTo: reward.value.planType,
            isLifetime: reward.value.lifetime || false,
            createdAt: new Date()
          }
        });
        break;
    }
  }

  private calculatePerkExpiration(reward: Reward): Date | null {
    if (reward.value.frequency === 'monthly') {
      const expiration = new Date();
      expiration.setMonth(expiration.getMonth() + 1);
      return expiration;
    }
    return null; // No expiration for permanent perks
  }

  async getUserUnlockedRewards(userId: string): Promise<any[]> {
    return await prisma.unlockedReward.findMany({
      where: { userId },
      orderBy: { unlockedAt: 'desc' }
    });
  }

  async getUserActiveRewards(userId: string): Promise<{
    features: Reward[];
    cosmetics: Reward[];
    templates: Reward[];
    perks: Reward[];
    content: Reward[];
    discounts: Reward[];
  }> {
    const unlocked = await this.getUserUnlockedRewards(userId);
    const activeRewards = unlocked.filter(r => r.isActive);
    
    const categorizedRewards = {
      features: [] as Reward[],
      cosmetics: [] as Reward[],
      templates: [] as Reward[],
      perks: [] as Reward[],
      content: [] as Reward[],
      discounts: [] as Reward[]
    };

    for (const unlockedReward of activeRewards) {
      const reward = this.REWARDS.find(r => r.id === unlockedReward.rewardId);
      if (reward) {
        const category = reward.type + 's' as keyof typeof categorizedRewards;
        categorizedRewards[category].push(reward);
      }
    }

    return categorizedRewards;
  }

  async getRewardProgress(userId: string): Promise<Array<{
    reward: Reward;
    progress: number;
    isUnlocked: boolean;
    canClaim: boolean;
  }>> {
    const unlockedRewards = await this.getUserUnlockedRewards(userId);
    const unlockedIds = unlockedRewards.map(u => u.rewardId);

    const progress = await Promise.all(
      this.REWARDS.map(async (reward) => {
        const isUnlocked = unlockedIds.includes(reward.id);
        const unlocked = unlockedRewards.find(u => u.rewardId === reward.id);
        const canClaim = isUnlocked && unlocked && !unlocked.claimedAt;
        
        let progressPercent = 0;
        if (!isUnlocked) {
          progressPercent = await this.calculateRewardProgress(userId, reward);
        }

        return {
          reward,
          progress: isUnlocked ? 100 : progressPercent,
          isUnlocked,
          canClaim
        };
      })
    );

    return progress.sort((a, b) => b.progress - a.progress);
  }

  private async calculateRewardProgress(userId: string, reward: Reward): Promise<number> {
    const req = reward.unlockRequirement;

    switch (req.type) {
      case 'level':
        const level = await xpSystem.getUserLevel(userId);
        return Math.min(100, (level.level / (req.target as number)) * 100);
      
      case 'xp':
        const stats = await prisma.userStats.findUnique({ where: { userId } });
        const currentXP = stats?.totalXP || 0;
        return Math.min(100, (currentXP / (req.target as number)) * 100);
      
      case 'streak':
        const userStats = await prisma.userStats.findUnique({ where: { userId } });
        const currentStreak = userStats?.streakDays || 0;
        return Math.min(100, (currentStreak / (req.target as number)) * 100);
      
      case 'achievement':
      case 'badge':
        // Binary - either have it or don't
        const hasIt = await this.isRequirementMet(userId, req);
        return hasIt ? 100 : 0;
      
      default:
        return 0;
    }
  }

  async claimReward(userId: string, rewardId: string): Promise<boolean> {
    const unlockedReward = await prisma.unlockedReward.findFirst({
      where: {
        userId,
        rewardId,
        claimedAt: null
      }
    });

    if (!unlockedReward) {
      return false;
    }

    // Mark as claimed
    await prisma.unlockedReward.update({
      where: { id: unlockedReward.id },
      data: { claimedAt: new Date() }
    });

    // Award bonus XP for claiming
    await xpSystem.awardXP(userId, 'complete-milestone', {
      milestone: 'reward-claimed',
      rewardId
    });

    return true;
  }

  async getRewardTiers(userId: string): Promise<Array<{
    tier: RewardTier;
    isUnlocked: boolean;
    progress: number;
    rewards: Array<{
      reward: Reward;
      isUnlocked: boolean;
    }>;
  }>> {
    const userLevel = await xpSystem.getUserLevel(userId);
    const unlockedRewards = await this.getUserUnlockedRewards(userId);
    const unlockedIds = unlockedRewards.map(u => u.rewardId);

    return this.REWARD_TIERS.map(tier => {
      const isUnlocked = userLevel.level >= tier.requiredLevel;
      const progress = Math.min(100, (userLevel.level / tier.requiredLevel) * 100);
      
      const rewards = tier.rewards.map(reward => ({
        reward,
        isUnlocked: unlockedIds.includes(reward.id)
      }));

      return {
        tier,
        isUnlocked,
        progress,
        rewards
      };
    });
  }

  async generateMilestoneReward(
    userId: string,
    milestone: string,
    context: Record<string, any>
  ): Promise<Reward> {
    const openai = createOpenAIClient();
    const userProfile = await prisma.userProfile.findUnique({ where: { userId } });

    const prompt = `Create a special reward for a content creator milestone:
Milestone: ${milestone}
User Platform: ${userProfile?.selectedPlatform || 'Multi-platform'}
User Niche: ${userProfile?.selectedNiche || 'General'}
Context: ${JSON.stringify(context)}

Generate a meaningful reward that:
1. Celebrates this specific achievement
2. Provides real value to the creator
3. Encourages continued growth
4. Feels personalized and special

Format as JSON: {
  "name": "",
  "description": "",
  "type": "feature|cosmetic|template|perk|content",
  "category": "ui|functionality|premium|exclusive",
  "icon": "emoji",
  "value": {}
}`;

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a reward designer for a creator platform.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' }
      });

      const generated = JSON.parse(response.choices[0].message.content || '{}');

      const reward: Reward = {
        id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: generated.name || `${milestone} Reward`,
        description: generated.description || `Special reward for ${milestone}`,
        type: generated.type || 'perk',
        category: generated.category || 'exclusive',
        unlockRequirement: {
          type: 'special',
          target: milestone,
          description: `Achieved ${milestone}`
        },
        value: generated.value || { special: true },
        icon: generated.icon || '🎁',
        metadata: {
          milestone,
          context,
          generated: true
        }
      };

      // Unlock immediately
      await this.unlockReward(userId, reward);

      return reward;
    } catch (error) {
      console.error('Failed to generate milestone reward:', error);
      // Return a default reward
      return {
        id: `milestone-${Date.now()}`,
        name: `${milestone} Reward`,
        description: `Congratulations on achieving ${milestone}!`,
        type: 'perk',
        category: 'exclusive',
        unlockRequirement: {
          type: 'special',
          target: milestone,
          description: `Achieved ${milestone}`
        },
        value: { bonusXP: 500 },
        icon: '🎁',
        metadata: { milestone }
      };
    }
  }

  private async createRewardNotification(userId: string, reward: Reward): Promise<void> {
    await prisma.notification.create({
      data: {
        userId,
        type: 'reward_unlocked',
        title: `Reward Unlocked! ${reward.icon || '🎁'}`,
        message: `You've unlocked "${reward.name}"! ${reward.description}`,
        data: {
          rewardId: reward.id,
          rewardType: reward.type,
          rewardName: reward.name,
          canClaim: reward.type === 'perk' || reward.type === 'content'
        }
      }
    });
  }

  async applyActiveDiscounts(userId: string, planType: 'pro' | 'studio', basePrice: number): Promise<{
    finalPrice: number;
    discount?: {
      id: string;
      percent: number;
      amount: number;
    };
  }> {
    const userDiscounts = await prisma.userDiscount.findMany({
      where: {
        userId,
        applicableTo: planType,
        isActive: true
      },
      orderBy: { discountPercent: 'desc' }
    });

    if (userDiscounts.length === 0) {
      return { finalPrice: basePrice };
    }

    // Use highest discount
    const bestDiscount = userDiscounts[0];
    const discountAmount = basePrice * (bestDiscount.discountPercent / 100);
    const finalPrice = basePrice - discountAmount;

    return {
      finalPrice,
      discount: {
        id: bestDiscount.discountId,
        percent: bestDiscount.discountPercent,
        amount: discountAmount
      }
    };
  }
}

export const rewards = new RewardSystem();