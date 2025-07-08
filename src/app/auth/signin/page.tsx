'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Chrome,
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Zap,
  AlertCircle
} from 'lucide-react';
import { MockAuthButton } from '@/components/auth/MockAuthButton';

type Provider = {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
};

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const handleSignIn = async (providerId: string) => {
    setIsLoading(true);
    try {
      await signIn(providerId, { callbackUrl });
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return Chrome;
      case 'github':
        return Github;
      default:
        return Users;
    }
  };

  const getProviderStyle = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return {
          gradient: 'from-blue-500 to-red-500',
          bg: 'from-blue-50 to-red-50 dark:from-blue-950/20 dark:to-red-950/20',
          border: 'border-blue-200/50',
        };
      case 'github':
        return {
          gradient: 'from-gray-800 to-black',
          bg: 'from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-black/20',
          border: 'border-gray-200/50',
        };
      default:
        return {
          gradient: 'from-purple-500 to-pink-500',
          bg: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
          border: 'border-purple-200/50',
        };
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-green-500/10 rounded-full blur-xl animate-pulse delay-3000" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <div className="relative">
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                Welcome Back!
              </span>
              <span className="ml-3 text-3xl emoji-bounce inline-block">👋</span>
            </h1>
            
            {/* Floating elements */}
            <div className="absolute -top-2 -left-4 w-6 h-6 bg-purple-500/20 rounded-full blur-sm animate-pulse" />
            <div className="absolute -top-1 -right-3 w-4 h-4 bg-pink-500/20 rounded-full blur-sm animate-pulse delay-500" />
          </div>
          
          <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Sign in to continue your <span className="font-semibold text-purple-600">creator journey</span> and unlock your potential! 
          </p>
          
          <Badge variant="secondary" className="px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-300/50 text-purple-700 dark:text-purple-300">
            <Sparkles className="w-4 h-4 mr-2" />
            Join 50K+ Creators
          </Badge>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error === 'OAuthSignin' && 'Error occurred during sign in. Please try again.'}
                  {error === 'OAuthCallback' && 'Error occurred during authentication. Please try again.'}
                  {error === 'OAuthCreateAccount' && 'Could not create account. Please try again.'}
                  {error === 'EmailCreateAccount' && 'Could not create account. Please try again.'}
                  {error === 'Callback' && 'Error occurred during sign in. Please try again.'}
                  {error === 'OAuthAccountNotLinked' && 'Account is linked to another provider.'}
                  {error === 'EmailSignin' && 'Error sending email. Please try again.'}
                  {error === 'CredentialsSignin' && 'Invalid credentials. Please try again.'}
                  {error === 'SessionRequired' && 'Please sign in to access this page.'}
                  {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'EmailCreateAccount', 'Callback', 'OAuthAccountNotLinked', 'EmailSignin', 'CredentialsSignin', 'SessionRequired'].includes(error) && 'An error occurred. Please try again.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign In Card */}
        <Card className="modern-card gen-z-card bg-gradient-to-br from-white/90 to-white/95 dark:from-black/20 dark:to-black/30 border-purple-200/30 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span>Choose Your Sign In</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {providers ? (
              <div className="space-y-4">
                {Object.values(providers).length > 0 ? (
                  Object.values(providers).map((provider) => {
                    const Icon = getProviderIcon(provider.id);
                    const style = getProviderStyle(provider.id);
                    
                    return (
                      <Button
                        key={provider.name}
                        onClick={() => handleSignIn(provider.id)}
                        disabled={isLoading}
                        className={`w-full h-14 social-button bg-gradient-to-r ${style.gradient} hover:scale-105 transition-all duration-300 text-white border-0 shadow-lg hover:shadow-xl relative overflow-hidden group`}
                      >
                        <div className="flex items-center justify-center space-x-3 relative z-10">
                          <Icon className="w-5 h-5" />
                          <span className="font-semibold">
                            Continue with {provider.name}
                          </span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                        
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      </Button>
                    );
                  })
                ) : (
                  <div className="text-center p-4 text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="font-medium">No OAuth providers configured</p>
                    <p className="text-sm mt-1">
                      To enable OAuth sign-in, configure your provider credentials in environment variables.
                    </p>
                    <p className="text-xs mt-2 text-gray-500">
                      Google OAuth is available • GitHub OAuth needs setup
                    </p>
                  </div>
                )}
                
                {/* Mock Auth Button for Testing */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-muted-foreground/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or for testing</span>
                  </div>
                </div>
                
                <MockAuthButton />
              </div>
            ) : (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 bg-muted/50 rounded-full animate-pulse" />
                ))}
              </div>
            )}
            
            {/* Benefits */}
            <div className="mt-8 space-y-4 p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 dark:from-purple-950/10 dark:to-pink-950/10 rounded-xl border border-purple-200/30">
              <h4 className="font-semibold text-center text-sm text-purple-700 dark:text-purple-300">
                ✨ What you'll get access to:
              </h4>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>Personalized 90-day creator roadmaps</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>AI-powered content templates & tools</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>Achievement system & progress tracking</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <span className="font-medium text-purple-600 hover:underline cursor-pointer">
              Terms of Service
            </span>{' '}
            and{' '}
            <span className="font-medium text-purple-600 hover:underline cursor-pointer">
              Privacy Policy
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}