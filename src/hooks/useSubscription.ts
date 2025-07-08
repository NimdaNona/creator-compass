import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserSubscription } from '@prisma/client';
import { 
  getUserSubscriptionFeatures, 
  hasFeatureAccess, 
  isSubscriptionActive,
  getSubscriptionStatus,
  SubscriptionFeatures 
} from '@/lib/subscription';

interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  features: SubscriptionFeatures;
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
  isCanceled: boolean;
  isExpired: boolean;
  daysLeft: number | null;
  hasFeature: (feature: keyof SubscriptionFeatures) => boolean;
  refreshSubscription: () => Promise<void>;
  upgradeToPortal: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    if (!session?.user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/stripe/subscription');
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const upgradeToPortal = async () => {
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal');
      console.error('Error opening billing portal:', err);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [session]);

  const features = getUserSubscriptionFeatures(subscription);
  const status = getSubscriptionStatus(subscription);

  const hasFeature = (feature: keyof SubscriptionFeatures): boolean => {
    return hasFeatureAccess(subscription, feature);
  };

  return {
    subscription,
    features,
    isLoading,
    error,
    isActive: status.isActive,
    isCanceled: status.isCanceled,
    isExpired: status.isExpired,
    daysLeft: status.daysLeft,
    hasFeature,
    refreshSubscription: fetchSubscription,
    upgradeToPortal,
  };
}

// Hook for specific feature checks
export function useFeatureAccess(feature: keyof SubscriptionFeatures): {
  hasAccess: boolean;
  subscription: UserSubscription | null;
  isLoading: boolean;
} {
  const { subscription, hasFeature, isLoading } = useSubscription();

  return {
    hasAccess: hasFeature(feature),
    subscription,
    isLoading,
  };
}

// Hook for platform access checks
export function usePlatformAccess(): {
  canAccessPlatform: (currentCount: number) => boolean;
  maxPlatforms: number;
  subscription: UserSubscription | null;
  isLoading: boolean;
} {
  const { subscription, features, isLoading } = useSubscription();

  const canAccessPlatform = (currentCount: number): boolean => {
    return currentCount < features.maxPlatforms;
  };

  return {
    canAccessPlatform,
    maxPlatforms: features.maxPlatforms,
    subscription,
    isLoading,
  };
}

// Hook for progress tracking limits
export function useProgressAccess(): {
  canTrackProgress: (daysSinceStart: number) => boolean;
  maxProgressDays: number;
  subscription: UserSubscription | null;
  isLoading: boolean;
} {
  const { subscription, features, isLoading } = useSubscription();

  const canTrackProgress = (daysSinceStart: number): boolean => {
    return daysSinceStart <= features.maxProgressDays;
  };

  return {
    canTrackProgress,
    maxProgressDays: features.maxProgressDays,
    subscription,
    isLoading,
  };
}