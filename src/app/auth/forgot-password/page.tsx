'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft,
  Mail,
  Send,
  Check,
  AlertCircle
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setIsSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-pink-500/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-blue-500/10 rounded-full blur-xl animate-pulse delay-2000" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8 space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold">
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
              Reset Password
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-sm mx-auto">
            No worries! We'll send you reset instructions.
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Card */}
        <Card className="modern-card gen-z-card bg-gradient-to-br from-white/90 to-white/95 dark:from-black/20 dark:to-black/30 border-purple-200/30 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span>Password Reset</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Check your email!</h3>
                <p className="text-muted-foreground mb-6">
                  If an account exists with <strong>{email}</strong>, you'll receive password reset instructions.
                </p>
                <div className="space-y-3">
                  <Link href="/auth/signin">
                    <Button className="w-full" variant="outline">
                      Back to Sign In
                    </Button>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Didn't receive an email? Check your spam folder or{' '}
                    <button
                      onClick={() => {
                        setIsSuccess(false);
                        setEmail('');
                      }}
                      className="font-medium text-purple-600 hover:underline"
                    >
                      try again
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 social-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Send className="w-4 h-4" />
                      <span>Send Reset Instructions</span>
                    </div>
                  )}
                </Button>

                <div className="text-center pt-4">
                  <Link href="/auth/signin" className="inline-flex items-center text-sm text-purple-600 hover:underline">
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/auth/signin" className="font-medium text-purple-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}