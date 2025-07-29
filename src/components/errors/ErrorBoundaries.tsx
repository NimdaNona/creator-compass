'use client';

import { Component, ReactNode, ErrorInfo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  Bug, 
  WifiOff,
  ServerCrash,
  ShieldAlert
} from 'lucide-react';

interface ErrorDetails {
  message: string;
  stack?: string;
  statusCode?: number;
  type?: 'network' | 'chunk' | 'runtime' | 'api' | 'unknown';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorDetails?: ErrorDetails;
  errorCount: number;
}

interface BaseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: 'page' | 'section' | 'component';
}

// Base error boundary class
export class BaseErrorBoundary extends Component<BaseErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: BaseErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      errorCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorDetails = BaseErrorBoundary.getErrorDetails(error);
    
    return { 
      hasError: true, 
      error,
      errorDetails
    };
  }

  static getErrorDetails(error: Error): ErrorDetails {
    const details: ErrorDetails = {
      message: error.message,
      stack: error.stack,
      type: 'unknown'
    };

    // Detect error type
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      details.type = 'chunk';
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      details.type = 'network';
    } else if (error.message.includes('API') || error.message.includes('401') || error.message.includes('403')) {
      details.type = 'api';
    } else {
      details.type = 'runtime';
    }

    return details;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[${this.props.level || 'component'}] Error caught:`, error, errorInfo);
    
    // Increment error count
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
    
    // Call custom error handler
    this.props.onError?.(error, errorInfo);
    
    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: BaseErrorBoundaryProps) {
    if (this.props.resetOnPropsChange && this.state.hasError) {
      if (this.props.resetKeys?.some((key, index) => key !== prevProps.resetKeys?.[index])) {
        this.resetError();
      }
    }
  }

  reportError(error: Error, errorInfo: ErrorInfo) {
    // Send to error tracking service (e.g., Sentry, LogRocket)
    try {
      fetch('/api/errors/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          errorBoundary: this.props.level || 'component',
          errorType: this.state.errorDetails?.type,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorDetails: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Return error-specific UI based on error type
      return this.renderError();
    }

    return this.props.children;
  }

  renderError() {
    const { error, errorDetails, errorCount } = this.state;
    const { level = 'component' } = this.props;

    // Too many errors - suggest page reload
    if (errorCount > 3) {
      return (
        <Alert variant="destructive" className="m-4">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Multiple Errors Detected</AlertTitle>
          <AlertDescription>
            The application is experiencing issues. Please reload the page.
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    // Chunk loading error - auto-retry
    if (errorDetails?.type === 'chunk') {
      setTimeout(() => window.location.reload(), 3000);
      return (
        <Alert className="m-4">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertTitle>Loading Resources</AlertTitle>
          <AlertDescription>
            Loading application resources. Page will refresh automatically...
          </AlertDescription>
        </Alert>
      );
    }

    // Network error
    if (errorDetails?.type === 'network') {
      return (
        <Card className="m-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5" />
              Network Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Unable to connect to the server. Please check your internet connection.
            </p>
            <Button onClick={this.resetError} variant="outline" size="sm">
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    // API error
    if (errorDetails?.type === 'api') {
      return (
        <Alert variant="destructive" className="m-4">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Server Error</AlertTitle>
          <AlertDescription>
            {error?.message || 'An error occurred while communicating with the server.'}
            <div className="mt-2 space-x-2">
              <Button onClick={this.resetError} variant="outline" size="sm">
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline" size="sm">
                Go Home
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    // Default error UI
    return (
      <Card className={`${level === 'page' ? 'max-w-2xl mx-auto mt-20' : 'm-4'}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            {level === 'page' ? 'Page Error' : 'Something went wrong'}
          </CardTitle>
          <CardDescription>
            {process.env.NODE_ENV === 'development' && error?.message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We apologize for the inconvenience. Please try again or contact support if the problem persists.
          </p>
          
          {/* Development mode - show stack trace */}
          {process.env.NODE_ENV === 'development' && error?.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground">
                Error Details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.stack}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2">
            <Button onClick={this.resetError} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            {level === 'page' && (
              <Button 
                onClick={() => window.location.href = '/'} 
                variant="outline" 
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            )}
            {process.env.NODE_ENV === 'development' && (
              <Button 
                onClick={() => console.log('Error details:', { error, errorDetails })} 
                variant="ghost" 
                size="sm"
              >
                <Bug className="h-4 w-4 mr-2" />
                Log Error
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
}

// Page-level error boundary
export class PageErrorBoundary extends BaseErrorBoundary {
  constructor(props: BaseErrorBoundaryProps) {
    super({ ...props, level: 'page' });
  }
}

// Section-level error boundary
export class SectionErrorBoundary extends BaseErrorBoundary {
  constructor(props: BaseErrorBoundaryProps) {
    super({ ...props, level: 'section' });
  }
}

// Component-level error boundary
export class ComponentErrorBoundary extends BaseErrorBoundary {
  constructor(props: BaseErrorBoundaryProps) {
    super({ ...props, level: 'component' });
  }
}

// Async error boundary for handling promise rejections
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      // You can add custom handling here
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  return <>{children}</>;
}

// Error boundary provider for global error handling
export function ErrorBoundaryProvider({ children }: { children: ReactNode }) {
  return (
    <PageErrorBoundary
      onError={(error, errorInfo) => {
        // Global error handling
        console.error('Global error:', error, errorInfo);
      }}
    >
      <AsyncErrorBoundary>
        {children}
      </AsyncErrorBoundary>
    </PageErrorBoundary>
  );
}

// Hook for error handling in components
export function useErrorHandler() {
  return useCallback((error: Error, errorInfo?: any) => {
    console.error('Error handled by hook:', error, errorInfo);
    
    // You can add custom error handling logic here
    if (process.env.NODE_ENV === 'production') {
      // Report to error tracking service
    }
  }, []);
}