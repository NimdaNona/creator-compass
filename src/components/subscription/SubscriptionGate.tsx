'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionFeatures } from '@/lib/subscription';
import { 
  Crown, 
  Lock, 
  Zap, 
  ArrowRight,
  Star,
  Shield
} from 'lucide-react';

interface SubscriptionGateProps {
  children: ReactNode;
  feature: keyof SubscriptionFeatures;
  fallback?: ReactNode;
  requiredPlan?: 'premium' | 'enterprise';
  title?: string;
  description?: string;
  showUpgradeButton?: boolean;
}

export function SubscriptionGate({
  children,
  feature,
  fallback,
  requiredPlan = 'premium',
  title,
  description,
  showUpgradeButton = true,
}: SubscriptionGateProps) {
  const router = useRouter();
  const { hasFeature, subscription, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <SubscriptionUpsell
      requiredPlan={requiredPlan}
      title={title}
      description={description}
      showUpgradeButton={showUpgradeButton}
    />
  );
}

interface SubscriptionUpsellProps {
  requiredPlan: 'premium' | 'enterprise';
  title?: string;
  description?: string;
  showUpgradeButton?: boolean;
}

export function SubscriptionUpsell({
  requiredPlan,
  title,
  description,
  showUpgradeButton = true,
}: SubscriptionUpsellProps) {
  const router = useRouter();

  const planConfig = {
    premium: {
      name: 'Pro Creator',
      price: '$9.99/month',
      icon: Crown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      features: [
        'All platform roadmaps',
        'Full 90-day tracking',
        'Premium templates',
        'Advanced analytics',
        'Priority support'
      ]
    },
    enterprise: {
      name: 'Creator Studio',
      price: '$29.99/month',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Multi-account management',
        'White-label options',
        'Dedicated support'
      ]
    }
  };

  const config = planConfig[requiredPlan];
  const Icon = config.icon;

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  return (
    <Card className={`${config.borderColor} ${config.bgColor} border-2`}>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <div className={`p-2 rounded-full ${config.bgColor} ${config.color}`}>
            <Icon className="w-6 h-6" />
          </div>
          <Badge variant="secondary" className={`${config.color} font-medium`}>
            {config.name} Feature
          </Badge>
        </div>
        
        <CardTitle className="text-xl mb-2">
          {title || 'Upgrade to Access This Feature'}
        </CardTitle>
        
        <p className="text-muted-foreground text-sm">
          {description || `This feature requires the ${config.name} plan. Upgrade now to unlock advanced capabilities.`}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-2">
            <span className="text-2xl font-bold">{config.price}</span>
            <span className="text-muted-foreground text-sm">starting at</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm text-center mb-3">
            What you'll get:
          </h4>
          {config.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {showUpgradeButton && (
          <div className="space-y-2">
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              size="lg"
            >
              Upgrade to {config.name}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => router.push('/pricing')}
              className="w-full"
              size="sm"
            >
              View All Plans
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FeatureLockProps {
  feature: keyof SubscriptionFeatures;
  requiredPlan?: 'premium' | 'enterprise';
  children: ReactNode;
  className?: string;
}

export function FeatureLock({ 
  feature, 
  requiredPlan = 'premium', 
  children, 
  className = '' 
}: FeatureLockProps) {
  const { hasFeature } = useSubscription();

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-black/5 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-5 h-5 text-muted-foreground" />
            <Badge variant="secondary">
              {requiredPlan === 'premium' ? 'Pro Feature' : 'Enterprise Feature'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Upgrade to unlock this feature
          </p>
        </div>
      </div>
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
    </div>
  );
}