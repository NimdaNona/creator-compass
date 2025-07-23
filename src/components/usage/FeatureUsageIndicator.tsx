'use client';

import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureUsageIndicatorProps {
  feature: 'templates' | 'ai' | 'exports' | 'platforms';
  className?: string;
  showLabel?: boolean;
  showButton?: boolean;
  compact?: boolean;
}

export function FeatureUsageIndicator({
  feature,
  className,
  showLabel = true,
  showButton = true,
  compact = false
}: FeatureUsageIndicatorProps) {
  const { usage, limits, loading } = useUsageTracking();
  const { subscription, isActive } = useSubscription();
  
  const isFreeTier = !isActive || subscription?.plan === 'free';
  const used = usage[feature] || 0;
  const limit = limits[feature];
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  const remaining = Math.max(0, limit - used);
  const isAtLimit = used >= limit;
  
  // Don't show for premium users with unlimited features
  if (!isFreeTier && (feature === 'ai' || feature === 'templates')) {
    return null;
  }
  
  if (loading) {
    return null;
  }
  
  const getFeatureLabel = () => {
    switch (feature) {
      case 'templates':
        return 'Template Generations';
      case 'ai':
        return 'AI Messages';
      case 'exports':
        return 'Exports';
      case 'platforms':
        return 'Platform Slots';
      default:
        return feature;
    }
  };
  
  const getWarningMessage = () => {
    if (isAtLimit) {
      return `You've reached your ${getFeatureLabel().toLowerCase()} limit`;
    }
    if (percentage >= 80) {
      return `${remaining} ${getFeatureLabel().toLowerCase()} remaining`;
    }
    return null;
  };
  
  const warningMessage = getWarningMessage();
  
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <span className="text-muted-foreground">
          {used}/{limit}
        </span>
        {isAtLimit && (
          <AlertCircle className="h-3 w-3 text-destructive" />
        )}
      </div>
    );
  }
  
  return (
    <div className={cn("space-y-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{getFeatureLabel()}</span>
          <span className="text-muted-foreground">
            {used} / {limit} used
          </span>
        </div>
      )}
      
      <div className="space-y-2">
        <Progress 
          value={percentage} 
          className={cn(
            "h-2",
            isAtLimit && "bg-destructive/20",
            percentage >= 80 && !isAtLimit && "bg-warning/20"
          )}
          indicatorClassName={cn(
            isAtLimit && "bg-destructive",
            percentage >= 80 && !isAtLimit && "bg-warning"
          )}
        />
        
        {warningMessage && (
          <div className={cn(
            "flex items-center gap-2 text-xs",
            isAtLimit ? "text-destructive" : "text-warning"
          )}>
            <AlertCircle className="h-3 w-3" />
            <span>{warningMessage}</span>
          </div>
        )}
      </div>
      
      {showButton && isAtLimit && (
        <Button
          size="sm"
          variant={isAtLimit ? "default" : "outline"}
          className="w-full"
          onClick={() => {
            window.location.href = '/pricing';
          }}
        >
          Upgrade for unlimited {getFeatureLabel().toLowerCase()}
          <ChevronRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}