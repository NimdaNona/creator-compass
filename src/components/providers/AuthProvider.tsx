'use client';

import { useSession } from 'next-auth/react';
import { useMockAuth } from '@/hooks/useMockAuth';
import { createContext, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: any;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const { session: mockSession, isLoading: mockLoading, isMockAuth } = useMockAuth();

  // Use mock auth in development if enabled
  const user = isMockAuth ? mockSession?.user : session?.user;
  const isAuthenticated = !!user;
  const isLoading = isMockAuth ? mockLoading : status === 'loading';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}