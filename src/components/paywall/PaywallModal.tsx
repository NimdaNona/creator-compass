'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { 
  Crown,
  Sparkles,
  X,
  ArrowRight,
  Star,
  TrendingUp,
  Target,
  Calendar
} from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  title?: string;
  description?: string;
  benefits?: string[];
}

export function PaywallModal({ 
  isOpen, 
  onClose, 
  feature, 
  title,
  description,
  benefits = []
}: PaywallModalProps) {
  const { setSubscription } = useAppStore();

  const defaultBenefits = [
    'Access to all platform roadmaps',
    'Advanced analytics dashboard',
    'Premium templates library',
    'Priority customer support',
    'Export progress reports'
  ];

  const featureBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  const handleUpgrade = () => {
    setSubscription('premium');
    onClose();
    // In a real app, this would redirect to Stripe checkout
    console.log('Redirecting to checkout...');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-left">
                  {title || 'Upgrade to Premium'}
                </DialogTitle>
                <Badge variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <DialogDescription className="text-left">
            {description || `Unlock ${feature} and many more premium features to accelerate your creator journey.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>What you'll get:</span>
            </h4>
            <div className="space-y-2">
              {featureBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold">$9.99</span>
                  <span className="text-muted-foreground">/month</span>
                  <Badge variant="outline" className="text-xs">
                    Most Popular
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Or $8.33/month billed annually
                </div>
              </div>
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button 
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade Now
            </Button>
            
            <Button variant="outline" className="w-full" asChild>
              <Link href="/pricing">
                <TrendingUp className="w-4 h-4 mr-2" />
                See All Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
              <span>✓ 30-day money back</span>
              <span>✓ Cancel anytime</span>
              <span>✓ Secure payment</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}