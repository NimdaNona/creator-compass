'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';

interface UseAuthRedirectOptions {
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  redirectTo?: string;
}

export function useAuthRedirect(options: UseAuthRedirectOptions = {}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { onboardingComplete, selectedPlatform, selectedNiche } = useAppStore();

  const {
    requireAuth = true,
    requireOnboarding = true,
    redirectTo = '/auth/signin'
  } = options;

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // Check authentication
    if (requireAuth && !session) {
      router.push(redirectTo);
      return;
    }

    // Check onboarding completion
    if (requireOnboarding && session && (!onboardingComplete || !selectedPlatform || !selectedNiche)) {
      router.push('/onboarding');
      return;
    }
  }, [status, session, onboardingComplete, selectedPlatform, selectedNiche, requireAuth, requireOnboarding, redirectTo, router]);

  return {
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    isOnboarded: onboardingComplete && !!selectedPlatform && !!selectedNiche
  };
}