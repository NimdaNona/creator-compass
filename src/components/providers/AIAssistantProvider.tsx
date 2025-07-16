'use client';

import { usePathname } from 'next/navigation';
import { AIAssistantWidget } from '@/components/ai/AIAssistantWidget';
import { useSession } from 'next-auth/react';

// Pages where the AI assistant should not appear
const excludedPaths = [
  '/auth/signin',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/onboarding',
];

export function AIAssistantProvider() {
  const pathname = usePathname();
  const { data: session } = useSession();

  // Don't show on auth pages or if user is not authenticated
  if (excludedPaths.some(path => pathname.startsWith(path)) || !session) {
    return null;
  }

  return <AIAssistantWidget />;
}