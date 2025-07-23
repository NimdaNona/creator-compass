import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Bug, 
  Clock, 
  TrendingUp,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Error Monitoring | CreatorCompass Admin',
  description: 'Monitor and track application errors',
};

// This would typically be stored in a database table
// For now, we'll use a mock data structure
interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  context: {
    userId?: string;
    action?: string;
    metadata?: Record<string, any>;
    stackTrace?: string;
  };
  resolved: boolean;
}

async function getErrorLogs(): Promise<ErrorLog[]> {
  // In a real implementation, this would query an error logs table
  // For now, return mock data that represents what the logging system would capture
  return [
    {
      id: '1',
      timestamp: new Date(Date.now() - 3600000),
      level: 'ERROR',
      message: 'Failed to complete task',
      context: {
        userId: 'user123',
        action: 'task_completion',
        metadata: {
          taskId: 'task456',
          error: 'Database connection timeout'
        }
      },
      resolved: false
    },
    {
      id: '2',
      timestamp: new Date(Date.now() - 7200000),
      level: 'WARN',
      message: 'Slow API response',
      context: {
        action: 'api_response',
        metadata: {
          endpoint: '/api/templates/generate',
          duration: 5234,
          threshold: 3000
        }
      },
      resolved: true
    },
    {
      id: '3',
      timestamp: new Date(Date.now() - 10800000),
      level: 'FATAL',
      message: 'Payment processing failed',
      context: {
        userId: 'user789',
        action: 'payment_event',
        metadata: {
          amount: 29.99,
          error: 'Stripe API error',
          stripeError: 'card_declined'
        }
      },
      resolved: false
    }
  ];
}

async function getErrorStats() {
  const logs = await getErrorLogs();
  const now = Date.now();
  const last24h = logs.filter(log => 
    log.timestamp.getTime() > now - 24 * 60 * 60 * 1000
  );

  return {
    total: logs.length,
    last24h: last24h.length,
    byLevel: {
      fatal: logs.filter(l => l.level === 'FATAL').length,
      error: logs.filter(l => l.level === 'ERROR').length,
      warn: logs.filter(l => l.level === 'WARN').length,
      info: logs.filter(l => l.level === 'INFO').length,
      debug: logs.filter(l => l.level === 'DEBUG').length,
    },
    unresolved: logs.filter(l => !l.resolved).length,
    topErrors: logs
      .filter(l => l.level === 'ERROR' || l.level === 'FATAL')
      .slice(0, 5)
  };
}

export default async function ErrorMonitoringPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Check if user is admin (you might want to add an isAdmin field to your user model)
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true }
  });

  // For now, only allow specific admin emails
  const adminEmails = ['admin@creatorsaicompass.com', 'support@creatorsaicompass.com'];
  if (!user || !adminEmails.includes(user.email)) {
    redirect('/dashboard');
  }

  const stats = await getErrorStats();
  const recentErrors = await getErrorLogs();

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Error Monitoring</h1>
        <p className="text-muted-foreground">
          Track and manage application errors in real-time
        </p>
      </div>

      {/* Error Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Errors
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Last 24 Hours
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.last24h}</div>
            <p className="text-xs text-muted-foreground">
              Recent errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unresolved
            </CardTitle>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats.unresolved}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Error Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.last24h > 10 ? '↑' : '↓'} {stats.last24h}
            </div>
            <p className="text-xs text-muted-foreground">
              vs yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Level Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Error Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive">FATAL</Badge>
                <span className="text-sm">{stats.byLevel.fatal} errors</span>
              </div>
              <div className="w-full max-w-xs bg-secondary rounded-full h-2">
                <div 
                  className="bg-destructive h-2 rounded-full"
                  style={{ width: `${(stats.byLevel.fatal / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="destructive" className="bg-red-500">ERROR</Badge>
                <span className="text-sm">{stats.byLevel.error} errors</span>
              </div>
              <div className="w-full max-w-xs bg-secondary rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(stats.byLevel.error / stats.total) * 100}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge className="bg-yellow-500">WARN</Badge>
                <span className="text-sm">{stats.byLevel.warn} warnings</span>
              </div>
              <div className="w-full max-w-xs bg-secondary rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(stats.byLevel.warn / stats.total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Errors */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Errors</CardTitle>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentErrors.map((error) => (
              <div 
                key={error.id} 
                className="border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={
                          error.level === 'FATAL' ? 'destructive' :
                          error.level === 'ERROR' ? 'destructive' :
                          error.level === 'WARN' ? 'default' :
                          'secondary'
                        }
                      >
                        {error.level}
                      </Badge>
                      <span className="font-medium">{error.message}</span>
                      {error.resolved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={error.resolved}
                  >
                    {error.resolved ? 'Resolved' : 'Mark Resolved'}
                  </Button>
                </div>
                
                {error.context.metadata && (
                  <div className="text-sm bg-muted p-2 rounded font-mono">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(error.context.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Notice */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This dashboard shows a sample of error monitoring capabilities. 
          In production, connect to your actual logging infrastructure 
          (e.g., Sentry, LogRocket, or custom error tracking).
        </AlertDescription>
      </Alert>
    </div>
  );
}