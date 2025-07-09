'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Chrome,
  ArrowRight,
  Sparkles,
  Users,
  TrendingUp,
  Zap,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check
} from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [showMagicLinkSent, setShowMagicLinkSent] = useState(false);
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const message = searchParams.get('message');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      // Filter out email and credentials providers from OAuth list
      if (res) {
        const oauthProviders = Object.fromEntries(
          Object.entries(res).filter(
            ([key]) => key !== 'email' && key !== 'credentials'
          )
        );
        setProviders(oauthProviders);
      }
    };
    fetchProviders();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        if (result.error.includes('verify')) {
          setFormError('Please verify your email before signing in');
        } else {
          setFormError('Invalid email or password');
        }
      } else if (result?.ok) {
        router.push(callbackUrl);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setFormError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsLoading(true);

    try {
      await signIn('email', {
        email: formData.email,
        redirect: false,
        callbackUrl,
      });
      setShowMagicLinkSent(true);
    } catch (error) {
      console.error('Magic link error:', error);
      setFormError('Failed to send magic link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const getMessageText = (msg: string | null) => {
    switch (msg) {
      case 'EmailVerified':
        return 'Email verified successfully! You can now sign in.';
      case 'AccountCreated':
        return 'Account created! Please check your email to verify your account.';
      case 'EmailAlreadyVerified':
        return 'Email already verified. You can sign in.';
      default:
        return null;
    }
  };

  const messageText = getMessageText(message);

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return Chrome;
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

        {/* Success Message */}
        {messageText && (
          <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <p className="text-sm text-green-600 dark:text-green-400">{messageText}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {(error || formError) && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {formError || (
                    error === 'OAuthSignin' ? 'Error occurred during sign in. Please try again.' :
                    error === 'OAuthCallback' ? 'Error occurred during authentication. Please try again.' :
                    error === 'OAuthCreateAccount' ? 'Could not create account. Please try again.' :
                    error === 'EmailCreateAccount' ? 'Could not create account. Please try again.' :
                    error === 'Callback' ? 'Error occurred during sign in. Please try again.' :
                    error === 'OAuthAccountNotLinked' ? 'Account is linked to another provider.' :
                    error === 'EmailSignin' ? 'Error sending email. Please try again.' :
                    error === 'CredentialsSignin' ? 'Invalid credentials. Please try again.' :
                    error === 'SessionRequired' ? 'Please sign in to access this page.' :
                    error === 'InvalidToken' ? 'Invalid or expired verification token.' :
                    error === 'VerificationFailed' ? 'Email verification failed. Please try again.' :
                    'An error occurred. Please try again.'
                  )}
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
              <span>Sign In</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Magic Link Success */}
            {showMagicLinkSent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Check your email!</h3>
                <p className="text-muted-foreground mb-4">
                  We've sent a magic link to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Click the link in the email to sign in to your account.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowMagicLinkSent(false);
                    setFormData({ email: '', password: '' });
                  }}
                  className="mt-6"
                >
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <>
                {/* Email/Password Form */}
                <form onSubmit={isEmailLogin ? handleMagicLinkSubmit : handleEmailPasswordSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        required
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {!isEmailLogin && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="password" className="block text-sm font-medium">
                          Password
                        </label>
                        <Link href="/auth/forgot-password" className="text-sm text-purple-600 hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••"
                          required
                          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 social-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{isEmailLogin ? 'Sending Magic Link...' : 'Signing In...'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <span>{isEmailLogin ? 'Send Magic Link' : 'Sign In'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </Button>
                    
                    <button
                      type="button"
                      onClick={() => setIsEmailLogin(!isEmailLogin)}
                      className="w-full text-sm text-purple-600 hover:underline"
                    >
                      {isEmailLogin ? 'Sign in with password' : 'Sign in with magic link'}
                    </button>
                  </div>
                </form>

                {/* Or Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-background text-muted-foreground">or continue with</span>
                  </div>
                </div>

                {/* OAuth Providers */}
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
                            className={`w-full h-12 social-button bg-gradient-to-r ${style.gradient} hover:scale-105 transition-all duration-300 text-white border-0 shadow-lg hover:shadow-xl relative overflow-hidden group`}
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
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="h-12 bg-muted/50 rounded-full animate-pulse" />
                  </div>
                )}
                
                {/* Sign Up Link */}
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="font-medium text-purple-600 hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              </>
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