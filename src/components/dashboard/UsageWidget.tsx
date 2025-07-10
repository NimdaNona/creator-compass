'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Layout, 
  Download, 
  BarChart3,
  AlertCircle,
  Crown,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface UsageData {
  usage: {
    templates: { count: number; limit: number; resetAt: string; percentage: number };
    platforms: { count: number; limit: number; resetAt: string; percentage: number };
    exports: { count: number; limit: number; resetAt: string; percentage: number };
    analytics: { count: number; limit: number; resetAt: string; percentage: number };
  };
  limits: {
    templates: number;
    platforms: number;
    exports: number;
    analytics: number;
  };
  plan: string;
}

const featureIcons = {
  templates: FileText,
  platforms: Layout,
  exports: Download,
  analytics: BarChart3,
};

const featureNames = {
  templates: 'Templates',
  platforms: 'Platforms',
  exports: 'Exports',
  analytics: 'Analytics',
};

export function UsageWidget() {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/usage');
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      
      const data = await response.json();
      setUsageData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching usage:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Usage Overview</span>
            <RefreshCw className="w-4 h-4 animate-spin" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !usageData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p>Unable to load usage data</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchUsageData}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { usage, plan } = usageData;
  const features = Object.keys(usage) as Array<keyof typeof usage>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Usage Overview</span>
          <Badge variant={plan === 'free' ? 'outline' : 'default'}>
            {plan === 'free' && 'Free Plan'}
            {plan === 'premium' && (
              <>
                <Crown className="w-3 h-3 mr-1" />
                Pro Plan
              </>
            )}
            {plan === 'enterprise' && (
              <>
                <Crown className="w-3 h-3 mr-1" />
                Studio Plan
              </>
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature) => {
            const data = usage[feature];
            const Icon = featureIcons[feature];
            const isUnlimited = data.limit === -1;
            const isNearLimit = !isUnlimited && data.percentage >= 80;
            const isAtLimit = !isUnlimited && data.count >= data.limit;
            const isLocked = data.limit === 0;
            
            return (
              <div key={feature} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {featureNames[feature]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isLocked ? (
                      <Badge variant="outline" className="text-xs">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium Only
                      </Badge>
                    ) : isUnlimited ? (
                      <span className="text-sm text-muted-foreground">
                        Unlimited
                      </span>
                    ) : (
                      <span className={cn(
                        "text-sm",
                        isAtLimit && "text-red-500 font-medium",
                        isNearLimit && !isAtLimit && "text-orange-500"
                      )}>
                        {data.count} / {data.limit}
                      </span>
                    )}
                    {isNearLimit && !isAtLimit && (
                      <AlertCircle className="w-3 h-3 text-orange-500" />
                    )}
                  </div>
                </div>
                
                {!isLocked && !isUnlimited && (
                  <>
                    <Progress 
                      value={data.percentage} 
                      className={cn(
                        "h-2",
                        isAtLimit && "bg-red-100",
                        isNearLimit && !isAtLimit && "bg-orange-100"
                      )}
                    />
                    {data.resetAt && (
                      <p className="text-xs text-muted-foreground">
                        Resets {format(new Date(data.resetAt), 'MMM d, yyyy')}
                      </p>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {plan === 'free' && (
          <div className="mt-6 pt-4 border-t">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Unlock more with Premium
              </p>
              <Button 
                variant="default" 
                size="sm"
                className="w-full"
                asChild
              >
                <a href="/pricing">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </a>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}