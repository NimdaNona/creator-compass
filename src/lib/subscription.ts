import { UserSubscription } from '@prisma/client';

export type SubscriptionPlan = 'free' | 'premium' | 'enterprise';

export interface SubscriptionFeatures {
  maxPlatforms: number;
  maxProgressDays: number;
  hasAdvancedAnalytics: boolean;
  hasPremiumTemplates: boolean;
  hasCrossplatformStrategies: boolean;
  hasPrioritySupport: boolean;
  hasExportReports: boolean;
  hasCustomGoals: boolean;
  hasAchievementSystem: boolean;
  hasEarlyAccess: boolean;
  hasTeamCollaboration: boolean;
  hasMultiAccountManagement: boolean;
  hasWhiteLabel: boolean;
  hasApiAccess: boolean;
  hasCustomIntegrations: boolean;
  hasDedicatedAccountManager: boolean;
  has24x7Support: boolean;
  hasCustomAnalytics: boolean;
  hasAdvancedTesting: boolean;
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionPlan, SubscriptionFeatures> = {
  free: {
    maxPlatforms: 1,
    maxProgressDays: 30,
    hasAdvancedAnalytics: false,
    hasPremiumTemplates: false,
    hasCrossplatformStrategies: false,
    hasPrioritySupport: false,
    hasExportReports: false,
    hasCustomGoals: false,
    hasAchievementSystem: false,
    hasEarlyAccess: false,
    hasTeamCollaboration: false,
    hasMultiAccountManagement: false,
    hasWhiteLabel: false,
    hasApiAccess: false,
    hasCustomIntegrations: false,
    hasDedicatedAccountManager: false,
    has24x7Support: false,
    hasCustomAnalytics: false,
    hasAdvancedTesting: false,
  },
  premium: {
    maxPlatforms: 3, // YouTube, TikTok, Twitch
    maxProgressDays: 90,
    hasAdvancedAnalytics: true,
    hasPremiumTemplates: true,
    hasCrossplatformStrategies: true,
    hasPrioritySupport: true,
    hasExportReports: true,
    hasCustomGoals: true,
    hasAchievementSystem: true,
    hasEarlyAccess: true,
    hasTeamCollaboration: false,
    hasMultiAccountManagement: false,
    hasWhiteLabel: false,
    hasApiAccess: false,
    hasCustomIntegrations: false,
    hasDedicatedAccountManager: false,
    has24x7Support: false,
    hasCustomAnalytics: false,
    hasAdvancedTesting: false,
  },
  enterprise: {
    maxPlatforms: 999, // Unlimited
    maxProgressDays: 365,
    hasAdvancedAnalytics: true,
    hasPremiumTemplates: true,
    hasCrossplatformStrategies: true,
    hasPrioritySupport: true,
    hasExportReports: true,
    hasCustomGoals: true,
    hasAchievementSystem: true,
    hasEarlyAccess: true,
    hasTeamCollaboration: true,
    hasMultiAccountManagement: true,
    hasWhiteLabel: true,
    hasApiAccess: true,
    hasCustomIntegrations: true,
    hasDedicatedAccountManager: true,
    has24x7Support: true,
    hasCustomAnalytics: true,
    hasAdvancedTesting: true,
  },
};

export function getUserSubscriptionFeatures(subscription: UserSubscription | null): SubscriptionFeatures {
  const plan = subscription?.plan as SubscriptionPlan || 'free';
  return SUBSCRIPTION_FEATURES[plan];
}

export function hasFeatureAccess(
  subscription: UserSubscription | null,
  feature: keyof SubscriptionFeatures
): boolean {
  const features = getUserSubscriptionFeatures(subscription);
  return features[feature] as boolean;
}

export function getMaxPlatforms(subscription: UserSubscription | null): number {
  const features = getUserSubscriptionFeatures(subscription);
  return features.maxPlatforms;
}

export function getMaxProgressDays(subscription: UserSubscription | null): number {
  const features = getUserSubscriptionFeatures(subscription);
  return features.maxProgressDays;
}

export function isSubscriptionActive(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  
  const now = new Date();
  
  // Free plan is always "active"
  if (subscription.plan === 'free') return true;
  
  // Check if subscription is active and not expired
  if (subscription.status === 'active' && subscription.currentPeriodEnd) {
    return new Date(subscription.currentPeriodEnd) > now;
  }
  
  return false;
}

export function isSubscriptionCanceled(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  return subscription.status === 'canceled' || subscription.cancelAtPeriodEnd;
}

export function getSubscriptionStatus(subscription: UserSubscription | null): {
  isActive: boolean;
  isCanceled: boolean;
  isExpired: boolean;
  daysLeft: number | null;
} {
  if (!subscription) {
    return {
      isActive: false,
      isCanceled: false,
      isExpired: false,
      daysLeft: null,
    };
  }

  const now = new Date();
  const isActive = isSubscriptionActive(subscription);
  const isCanceled = isSubscriptionCanceled(subscription);
  
  let daysLeft: number | null = null;
  let isExpired = false;
  
  if (subscription.currentPeriodEnd) {
    const endDate = new Date(subscription.currentPeriodEnd);
    const timeDiff = endDate.getTime() - now.getTime();
    daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
    isExpired = daysLeft <= 0;
  }

  return {
    isActive,
    isCanceled,
    isExpired,
    daysLeft,
  };
}

// Helper function to check if user can access a specific platform
export function canAccessPlatform(
  subscription: UserSubscription | null,
  currentPlatformCount: number
): boolean {
  const maxPlatforms = getMaxPlatforms(subscription);
  return currentPlatformCount < maxPlatforms;
}

// Helper function to check if user can track progress for more days
export function canTrackProgress(
  subscription: UserSubscription | null,
  daysSinceStart: number
): boolean {
  const maxDays = getMaxProgressDays(subscription);
  return daysSinceStart <= maxDays;
}

// Feature-specific access checks
export function canAccessAdvancedAnalytics(subscription: UserSubscription | null): boolean {
  return hasFeatureAccess(subscription, 'hasAdvancedAnalytics');
}

export function canAccessPremiumTemplates(subscription: UserSubscription | null): boolean {
  return hasFeatureAccess(subscription, 'hasPremiumTemplates');
}

export function canExportReports(subscription: UserSubscription | null): boolean {
  return hasFeatureAccess(subscription, 'hasExportReports');
}

export function canAccessAchievementSystem(subscription: UserSubscription | null): boolean {
  return hasFeatureAccess(subscription, 'hasAchievementSystem');
}

export function canAccessTeamFeatures(subscription: UserSubscription | null): boolean {
  return hasFeatureAccess(subscription, 'hasTeamCollaboration');
}

export function canAccessApiFeatures(subscription: UserSubscription | null): boolean {
  return hasFeatureAccess(subscription, 'hasApiAccess');
}