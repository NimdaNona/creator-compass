'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { Compass } from 'lucide-react';

const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/error',
  '/offline'
];

const ONBOARDING_REQUIRED_ROUTES = [
  '/dashboard',
  '/foryou',
  '/calendar',
  '/ideas',
  '/templates',
  '/platform-tools',
  '/analytics',
  '/resources',
  '/achievements',
  '/community'
];

export function NavigationGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { onboardingComplete, selectedPlatform, selectedNiche } = useAppStore();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // Check if current route is public
    const isPublicRoute = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/');

    // If not authenticated and trying to access protected route
    if (!session && !isPublicRoute) {
      const callbackUrl = encodeURIComponent(pathname);
      router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
      return;
    }

    // If authenticated but hasn't completed onboarding
    if (session && ONBOARDING_REQUIRED_ROUTES.includes(pathname)) {
      if (!onboardingComplete || !selectedPlatform || !selectedNiche) {
        router.push('/onboarding');
        return;
      }
    }

    // If on onboarding page but already completed onboarding
    if (session && pathname === '/onboarding' && onboardingComplete && selectedPlatform && selectedNiche) {
      router.push('/dashboard');
      return;
    }
  }, [pathname, session, status, onboardingComplete, selectedPlatform, selectedNiche, router]);

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Compass className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}