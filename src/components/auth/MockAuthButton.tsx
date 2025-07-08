'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMockAuth } from '@/hooks/useMockAuth';

export function MockAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isMockAuth } = useMockAuth();

  const handleMockSignIn = async () => {
    setIsLoading(true);
    
    try {
      // Simulate auth delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Use the proper mock auth sign in
      signIn();
    } catch (error) {
      console.error('Mock sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show in development with mock auth enabled
  if (!isMockAuth) {
    return null;
  }

  return (
    <Button
      onClick={handleMockSignIn}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          🧪 Test Sign In (Development)
        </>
      )}
    </Button>
  );
}