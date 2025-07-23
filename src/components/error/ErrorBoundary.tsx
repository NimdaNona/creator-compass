'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
  showDetails: boolean;
  copied: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  showDetails?: boolean;
  context?: string;
}

// Client-side error logger
class ClientErrorLogger {
  private static instance: ClientErrorLogger;
  
  private constructor() {}
  
  static getInstance(): ClientErrorLogger {
    if (!ClientErrorLogger.instance) {
      ClientErrorLogger.instance = new ClientErrorLogger();
    }
    return ClientErrorLogger.instance;
  }
  
  async logError(
    error: Error,
    errorInfo: ErrorInfo,
    context?: string
  ): Promise<string> {
    const errorId = crypto.randomUUID();
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught:', {
        errorId,
        error,
        errorInfo,
        context
      });
    }
    
    // Send to API endpoint
    try {
      await fetch('/api/errors/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          context,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
    } catch (logError) {
      console.error('Failed to log error to server:', logError);
    }
    
    return errorId;
  }
}

const clientLogger = ClientErrorLogger.getInstance();

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false,
      showDetails: false,
      copied: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to server
    const errorId = await clientLogger.logError(
      error,
      errorInfo,
      this.props.context
    );
    
    this.setState({ errorInfo, errorId });
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo, errorId);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined,
      errorId: undefined,
      showDetails: false 
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  copyErrorDetails = async () => {
    const { error, errorInfo, errorId } = this.state;
    
    const details = `Error ID: ${errorId}
Error: ${error?.message}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
URL: ${window.location.href}
Time: ${new Date().toISOString()}`;

    try {
      await navigator.clipboard.writeText(details);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  render() {
    const { hasError, error, errorInfo, errorId, showDetails, copied } = this.state;
    const { fallback, showDetails: showDetailsProp = true } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      const isProduction = process.env.NODE_ENV === 'production';

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-destructive">
                <AlertTriangle className="h-6 w-6" />
                <span>Oops! Something went wrong</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Bug className="h-4 w-4" />
                <AlertTitle>We encountered an unexpected error</AlertTitle>
                <AlertDescription>
                  {isProduction 
                    ? "We've been notified and are working on a fix. Please try again or return to the homepage."
                    : error?.message || 'An unexpected error occurred'
                  }
                </AlertDescription>
              </Alert>

              {errorId && (
                <div className="text-sm text-muted-foreground">
                  Error ID: <code className="font-mono">{errorId}</code>
                </div>
              )}

              {showDetailsProp && !isProduction && (
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={this.toggleDetails}
                    className="flex items-center space-x-2"
                  >
                    {showDetails ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    <span>
                      {showDetails ? 'Hide' : 'Show'} Technical Details
                    </span>
                  </Button>

                  {showDetails && (
                    <div className="space-y-4">
                      <div className="rounded-md bg-muted p-4 font-mono text-xs overflow-auto">
                        <div className="space-y-2">
                          <div>
                            <strong>Error:</strong> {error?.message}
                          </div>
                          {error?.stack && (
                            <div>
                              <strong>Stack Trace:</strong>
                              <pre className="whitespace-pre-wrap mt-1">
                                {error.stack}
                              </pre>
                            </div>
                          )}
                          {errorInfo?.componentStack && (
                            <div>
                              <strong>Component Stack:</strong>
                              <pre className="whitespace-pre-wrap mt-1">
                                {errorInfo.componentStack}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={this.copyErrorDetails}
                        className="flex items-center space-x-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copy Error Details</span>
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={this.handleReset}
                  variant="default"
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="flex items-center space-x-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Reload Page</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleGoHome}
                  className="flex items-center space-x-2"
                >
                  <Home className="h-4 w-4" />
                  <span>Go Home</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different contexts
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary context="dashboard">
      {children}
    </ErrorBoundary>
  );
}

export function AIErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      context="ai"
      fallback={
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>AI Service Error</AlertTitle>
          <AlertDescription>
            The AI service is temporarily unavailable. Please try again later.
          </AlertDescription>
        </Alert>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function TemplateErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      context="template"
      fallback={
        <Card className="p-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold">Template Loading Error</h3>
            <p className="text-sm text-muted-foreground">
              We couldn't load this template. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </div>
        </Card>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for wrapping components with error boundary
export function withErrorBoundary<T extends {}>(
  Component: React.ComponentType<T>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WithErrorBoundaryComponent(props: T) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}