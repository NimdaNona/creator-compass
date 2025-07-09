'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Lock,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  KeyRound
} from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const passwordRequirements = [
    { text: 'At least 8 characters', met: password.length >= 8 },
    { text: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { text: 'One lowercase letter', met: /[a-z]/.test(password) },
    { text: 'One number', met: /[0-9]/.test(password) },
    { text: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const passwordsMatch = password === confirmPassword && password.length > 0;
  const allRequirementsMet = passwordRequirements.every(req => req.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Invalid reset token');
      return;
    }

    if (!allRequirementsMet) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setIsSuccess(true);
      
      // Redirect to sign in after 3 seconds
      setTimeout(() => {
        router.push('/auth/signin?message=PasswordReset');
      }, 3000);
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
              New Password
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-sm mx-auto">
            Create a strong password for your account
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
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <span>Set New Password</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Password Reset Successfully!</h3>
                <p className="text-muted-foreground mb-4">
                  Your password has been updated. Redirecting to sign in...
                </p>
                <Link href="/auth/signin">
                  <Button className="w-full" variant="outline">
                    Go to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={!token}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Password Requirements */}
                  {password && (
                    <div className="mt-3 space-y-1">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          {req.met ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <X className="w-3 h-3 text-red-500" />
                          )}
                          <span className={req.met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={!token}
                      className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {confirmPassword && (
                    <div className="mt-2 flex items-center space-x-2 text-sm">
                      {passwordsMatch ? (
                        <>
                          <Check className="w-3 h-3 text-green-500" />
                          <span className="text-green-600 dark:text-green-400">Passwords match</span>
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 text-red-500" />
                          <span className="text-red-600 dark:text-red-400">Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !token || !allRequirementsMet || !passwordsMatch}
                  className="w-full h-12 social-button bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Resetting Password...</span>
                    </div>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </Button>

                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link href="/auth/signin" className="font-medium text-purple-600 hover:underline">
                      Sign in
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}