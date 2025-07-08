'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface MockUser {
  id: string;
  email: string;
  name: string;
  image: string | null;
}

interface MockSession {
  user: MockUser;
  expires: string;
}

export function useMockAuth() {
  const [mockSession, setMockSession] = useState<MockSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Only use mock auth in development
    if (process.env.NODE_ENV !== 'development' || !process.env.NEXT_PUBLIC_MOCK_AUTH) {
      setIsLoading(false);
      return;
    }

    // Check for mock session
    const storedSession = localStorage.getItem('mock-session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        // Check if session is expired
        if (new Date(session.expires) > new Date()) {
          setMockSession(session);
          // Set cookie for middleware
          document.cookie = `mock-session=true; path=/; expires=${session.expires}`;
        } else {
          // Clear expired session
          localStorage.removeItem('mock-session');
          document.cookie = 'mock-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
      } catch (error) {
        console.error('Error parsing mock session:', error);
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = () => {
    const mockUser: MockUser = {
      id: 'mock-user-1',
      email: 'test@creatorcompass.app',
      name: 'Test Creator',
      image: null,
    };

    const session: MockSession = {
      user: mockUser,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };

    localStorage.setItem('mock-session', JSON.stringify(session));
    document.cookie = `mock-session=true; path=/; expires=${session.expires}`;
    setMockSession(session);
    
    // Redirect to onboarding (middleware will handle the flow)
    router.push('/onboarding');
  };

  const signOut = () => {
    localStorage.removeItem('mock-session');
    document.cookie = 'mock-session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setMockSession(null);
    router.push('/');
  };

  return {
    session: mockSession,
    isLoading,
    signIn,
    signOut,
    isMockAuth: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_AUTH === 'true',
  };
}