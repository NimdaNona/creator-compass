'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowLeft, RefreshCw, Home } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the server configuration. Please contact support.',
          icon: '⚙️',
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to sign in. Please contact support if you believe this is an error.',
          icon: '🚫',
        };
      case 'Verification':
        return {
          title: 'Verification Error',
          description: 'The verification token has expired or has already been used. Please try signing in again.',
          icon: '📧',
        };
      case 'Default':
      default:
        return {
          title: 'Authentication Error',
          description: 'An unexpected error occurred during authentication. Please try again.',
          icon: '⚠️',
        };
    }
  };

  const errorInfo = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-red-500/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-orange-500/10 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl animate-pulse delay-2000" />
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Error Card */}
        <Card className="modern-card gen-z-card bg-gradient-to-br from-red-50/90 to-orange-50/95 dark:from-red-950/20 dark:to-orange-950/30 border-red-200/50 shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold flex items-center justify-center space-x-2">
              <span>{errorInfo.title}</span>
              <span className="text-2xl">{errorInfo.icon}</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-muted-foreground leading-relaxed">
                {errorInfo.description}
              </p>
            </div>

            {/* Error Details */}
            {error && (
              <div className="p-4 bg-red-100/50 dark:bg-red-950/30 rounded-xl border border-red-200/30">
                <p className="text-sm text-red-600 dark:text-red-400">
                  <strong>Error Code:</strong> {error}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                asChild
                className="w-full h-12 social-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0"
              >
                <Link href="/auth/signin">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Link>
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  asChild
                  className="social-button border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <Link href="/">
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </Link>
                </Button>
                
                <Button
                  variant="outline"
                  asChild
                  className="social-button border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <Link href="/auth/signin">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Link>
                </Button>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 dark:from-blue-950/10 dark:to-cyan-950/10 rounded-xl border border-blue-200/30">
              <p className="text-sm text-muted-foreground">
                Need help? Contact our support team at{' '}
                <span className="font-medium text-blue-600 hover:underline cursor-pointer">
                  support@creatorcompass.app
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}