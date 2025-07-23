/**
 * Platform validation utilities for ensuring subscription compliance
 */

import { prisma } from '@/lib/db';

export interface PlatformValidationResult {
  allowed: boolean;
  error?: string;
  requiresUpgrade?: boolean;
  currentPlatform?: string;
  subscription?: {
    plan: string;
    isActive: boolean;
  };
}

/**
 * Validates if a user can switch to a different platform based on their subscription
 */
export async function validatePlatformSwitch(
  userId: string,
  newPlatform: string
): Promise<PlatformValidationResult> {
  try {
    // Get user with profile and subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        subscription: true
      }
    });

    if (!user) {
      return {
        allowed: false,
        error: 'User not found'
      };
    }

    const currentPlatform = user.profile?.selectedPlatform;
    const subscription = user.subscription;
    const isFreeTier = !subscription || subscription.plan === 'free' || subscription.status !== 'active';

    // If no current platform is selected, allow selection
    if (!currentPlatform) {
      return {
        allowed: true,
        subscription: {
          plan: subscription?.plan || 'free',
          isActive: subscription?.status === 'active' || false
        }
      };
    }

    // If trying to switch to the same platform, allow it
    if (currentPlatform === newPlatform) {
      return {
        allowed: true,
        currentPlatform,
        subscription: {
          plan: subscription?.plan || 'free',
          isActive: subscription?.status === 'active' || false
        }
      };
    }

    // If on free tier and trying to switch platforms, deny
    if (isFreeTier) {
      return {
        allowed: false,
        error: 'Free tier users can only select one platform. Upgrade to Pro or Studio to switch between platforms.',
        requiresUpgrade: true,
        currentPlatform,
        subscription: {
          plan: 'free',
          isActive: false
        }
      };
    }

    // Premium users can switch platforms
    return {
      allowed: true,
      currentPlatform,
      subscription: {
        plan: subscription.plan,
        isActive: true
      }
    };

  } catch (error) {
    console.error('Error validating platform switch:', error);
    return {
      allowed: false,
      error: 'Failed to validate platform switch'
    };
  }
}

/**
 * Gets the maximum number of platforms allowed for a subscription tier
 */
export function getMaxPlatformsForTier(plan: string | null): number {
  switch (plan) {
    case 'pro':
    case 'studio':
      return 3; // Premium users can switch between all platforms
    case 'free':
    default:
      return 1; // Free users can only select one platform
  }
}

/**
 * Validates if a user can select additional platforms
 */
export async function validatePlatformAccess(
  userId: string,
  platformCount: number
): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true
      }
    });

    if (!user) {
      return false;
    }

    const plan = user.subscription?.plan || 'free';
    const isActive = user.subscription?.status === 'active';
    const maxPlatforms = getMaxPlatformsForTier(isActive ? plan : 'free');

    return platformCount < maxPlatforms;
  } catch (error) {
    console.error('Error validating platform access:', error);
    return false;
  }
}