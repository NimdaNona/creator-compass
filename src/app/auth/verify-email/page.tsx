'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, Mail, AlertCircle } from 'lucide-react';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'waiting'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('waiting');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Your email has been successfully verified!');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. The link may have expired.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/20">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px]" />
      
      <Card className="w-full max-w-md relative">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Email Verification</CardTitle>
          <CardDescription>
            {status === 'waiting' ? 'Check your email for the verification link' : 'Verifying your email address'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Verifying your email...</p>
            </div>
          )}

          {status === 'waiting' && (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  We've sent a verification email to your registered email address. 
                  Please check your inbox and click the verification link to continue.
                </AlertDescription>
              </Alert>
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Didn't receive the email? Check your spam folder or
                </p>
                <Button variant="outline" size="sm">
                  Resend verification email
                </Button>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Verification Successful!</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Link href="/auth/signin">
                <Button className="w-full">
                  Continue to Sign In
                </Button>
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Verification Failed</h3>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="space-y-2">
                <Link href="/auth/signup">
                  <Button variant="outline" className="w-full">
                    Try Again
                  </Button>
                </Link>
                <Link href="/auth/signin">
                  <Button variant="ghost" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}