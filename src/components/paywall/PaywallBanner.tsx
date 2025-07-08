'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PaywallModal } from './PaywallModal';
import { useAppStore } from '@/store/useAppStore';
import { 
  Crown,
  Sparkles,
  X,
  ArrowRight,
  Lock,
  Zap
} from 'lucide-react';

interface PaywallBannerProps {
  feature: string;
  title?: string;
  description?: string;
  benefits?: string[];
  dismissible?: boolean;
  variant?: 'default' | 'compact' | 'prominent';
  className?: string;
}

export function PaywallBanner({ 
  feature,
  title,
  description,
  benefits = [],
  dismissible = true,
  variant = 'default',
  className = ''
}: PaywallBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { subscription, setSubscription } = useAppStore();

  // Don't show if user is already premium or banner is dismissed
  if (subscription === 'premium' || isDismissed) {
    return null;
  }

  const handleUpgrade = () => {
    setSubscription('premium');
    // In a real app, this would redirect to Stripe checkout
    console.log('Redirecting to checkout...');
  };

  if (variant === 'compact') {
    return (
      <>
        <div className={`flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border border-purple-200 dark:border-purple-800 rounded-lg ${className}`}>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="font-medium text-sm">
                {title || `Unlock ${feature}`}
              </div>
              <div className="text-xs text-muted-foreground">
                Upgrade to Premium for full access
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button size="sm" onClick={() => setShowModal(true)}>
              Upgrade
            </Button>
            {dismissible && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-6 h-6"
                onClick={() => setIsDismissed(true)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>

        <PaywallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
          title={title}
          description={description}
          benefits={benefits}
        />
      </>
    );
  }

  if (variant === 'prominent') {
    return (
      <>
        <Card className={`border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 ${className}`}>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto">
                <Crown className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-2">
                  {title || `Unlock ${feature}`}
                </h3>
                <p className="text-muted-foreground">
                  {description || 'Get access to premium features and accelerate your creator journey.'}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
                
                <Button variant="outline" asChild>
                  <Link href="/pricing">
                    View Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                <span>✓ 30-day guarantee</span>
                <span>✓ Cancel anytime</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <PaywallModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          feature={feature}
          title={title}
          description={description}
          benefits={benefits}
        />
      </>
    );
  }

  // Default variant
  return (
    <>
      <Card className={`border border-purple-200 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">
                    {title || `${feature} is a Premium Feature`}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {description || `Upgrade to Premium to unlock ${feature} and accelerate your creator growth.`}
                  </p>
                </div>
                
                {dismissible && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-6 h-6 ml-2"
                    onClick={() => setIsDismissed(true)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <Button size="sm" onClick={() => setShowModal(true)}>
                  <Sparkles className="w-3 h-3 mr-1" />
                  Learn More
                </Button>
                
                <Button size="sm" variant="outline" onClick={handleUpgrade}>
                  <Zap className="w-3 h-3 mr-1" />
                  Upgrade Now
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PaywallModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        feature={feature}
        title={title}
        description={description}
        benefits={benefits}
      />
    </>
  );
}