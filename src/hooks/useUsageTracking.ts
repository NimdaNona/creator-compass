import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface UsageData {
  usage: {
    templates: { count: number; limit: number; resetAt: string; percentage: number };
    platforms: { count: number; limit: number; resetAt: string; percentage: number };
    exports: { count: number; limit: number; resetAt: string; percentage: number };
    analytics: { count: number; limit: number; resetAt: string; percentage: number };
  };
  limits: {
    templates: number;
    platforms: number;
    exports: number;
    analytics: number;
  };
  plan: string;
}

type Feature = 'templates' | 'platforms' | 'exports' | 'analytics';

interface UseUsageTrackingReturn {
  usage: UsageData | null;
  isLoading: boolean;
  error: string | null;
  trackUsage: (feature: Feature, increment?: number) => Promise<boolean>;
  canUseFeature: (feature: Feature) => boolean;
  getRemainingUsage: (feature: Feature) => number;
  refreshUsage: () => Promise<void>;
}

export function useUsageTracking(): UseUsageTrackingReturn {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!session?.user) {
      setUsage(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/usage');
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching usage:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const trackUsage = useCallback(async (
    feature: Feature, 
    increment: number = 1
  ): Promise<boolean> => {
    if (!session?.user) {
      return false;
    }

    try {
      const response = await fetch('/api/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feature, increment }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Usage tracking error:', error);
        
        // If limit exceeded, refresh usage data to show current state
        if (response.status === 403) {
          await fetchUsage();
        }
        
        return false;
      }

      // Refresh usage data after tracking
      await fetchUsage();
      return true;
    } catch (err) {
      console.error('Error tracking usage:', err);
      return false;
    }
  }, [session, fetchUsage]);

  const canUseFeature = useCallback((feature: Feature): boolean => {
    if (!usage) return false;
    
    const featureUsage = usage.usage[feature];
    
    // If limit is 0, feature is not available
    if (featureUsage.limit === 0) return false;
    
    // If limit is -1, it's unlimited
    if (featureUsage.limit === -1) return true;
    
    // Check if under limit
    return featureUsage.count < featureUsage.limit;
  }, [usage]);

  const getRemainingUsage = useCallback((feature: Feature): number => {
    if (!usage) return 0;
    
    const featureUsage = usage.usage[feature];
    
    // If unlimited, return -1
    if (featureUsage.limit === -1) return -1;
    
    // Calculate remaining
    const remaining = featureUsage.limit - featureUsage.count;
    return Math.max(0, remaining);
  }, [usage]);

  return {
    usage,
    isLoading,
    error,
    trackUsage,
    canUseFeature,
    getRemainingUsage,
    refreshUsage: fetchUsage,
  };
}

// Hook for checking specific feature access
export function useFeatureUsage(feature: Feature) {
  const { usage, canUseFeature, getRemainingUsage, trackUsage, isLoading } = useUsageTracking();
  
  const featureUsage = usage?.usage[feature];
  const canUse = canUseFeature(feature);
  const remaining = getRemainingUsage(feature);
  
  return {
    canUse,
    remaining,
    usage: featureUsage,
    trackUsage: (increment?: number) => trackUsage(feature, increment),
    isLoading,
    isUnlimited: featureUsage?.limit === -1,
    isPremiumOnly: featureUsage?.limit === 0,
    isNearLimit: featureUsage ? featureUsage.percentage >= 80 : false,
    isAtLimit: featureUsage ? featureUsage.count >= featureUsage.limit && featureUsage.limit !== -1 : false,
  };
}