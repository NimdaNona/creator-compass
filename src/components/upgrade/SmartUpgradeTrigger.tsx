'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  X, 
  AlertCircle, 
  TrendingUp,
  Zap,
  Trophy,
  Sparkles,
  ArrowRight,
  Star
} from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface TriggerConfig {
  id: string;
  type: 'usage' | 'achievement' | 'milestone' | 'feature';
  title: string;
  message: string;
  icon: React.ElementType;
  color: string;
  cta: string;
  delay?: number;
}

export function SmartUpgradeTrigger() {
  const router = useRouter();
  const { subscription, isActive } = useSubscription();
  const { usage } = useUsageTracking();
  const [currentTrigger, setCurrentTrigger] = useState<TriggerConfig | null>(null);
  const [dismissedTriggers, setDismissedTriggers] = useState<string[]>([]);
  const [showTrigger, setShowTrigger] = useState(false);

  // Don't show for paid users
  if (isActive || subscription?.plan !== 'free') {
    return null;
  }

  useEffect(() => {
    if (!usage) return;

    const checkTriggers = () => {
      // Check usage-based triggers
      const templatesUsage = usage.usage.templates;
      if (templatesUsage.percentage >= 80 && !dismissedTriggers.includes('templates-80')) {
        setCurrentTrigger({
          id: 'templates-80',
          type: 'usage',
          title: 'Running Low on Templates!',
          message: `You've used ${templatesUsage.count} of ${templatesUsage.limit} templates this month. Upgrade for unlimited access.`,
          icon: AlertCircle,
          color: 'text-orange-500',
          cta: 'Upgrade for Unlimited',
          delay: 2000
        });
        return;
      }

      // Check if at 100% usage
      if (templatesUsage.count >= templatesUsage.limit && !dismissedTriggers.includes('templates-100')) {
        setCurrentTrigger({
          id: 'templates-100',
          type: 'usage',
          title: 'Template Limit Reached!',
          message: "You've used all your free templates this month. Upgrade now to continue creating.",
          icon: X,
          color: 'text-red-500',
          cta: 'Upgrade Now',
          delay: 1000
        });
        return;
      }

      // Check platform usage
      if (usage.usage.platforms.count >= 1 && !dismissedTriggers.includes('platforms-switch')) {
        // Check if user has been active for at least 7 days
        const daysSinceStart = 7; // This would come from actual user data
        if (daysSinceStart >= 7) {
          setCurrentTrigger({
            id: 'platforms-switch',
            type: 'feature',
            title: 'Ready to Expand?',
            message: "You're making great progress! Unlock all platforms to reach more audiences.",
            icon: TrendingUp,
            color: 'text-blue-500',
            cta: 'Unlock All Platforms',
            delay: 3000
          });
          return;
        }
      }
    };

    checkTriggers();
  }, [usage, dismissedTriggers]);

  useEffect(() => {
    if (currentTrigger && !showTrigger) {
      const timer = setTimeout(() => {
        setShowTrigger(true);
      }, currentTrigger.delay || 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTrigger, showTrigger]);

  const handleDismiss = () => {
    if (currentTrigger) {
      setDismissedTriggers(prev => [...prev, currentTrigger.id]);
    }
    setShowTrigger(false);
    setCurrentTrigger(null);
  };

  const handleUpgrade = () => {
    router.push('/pricing');
    handleDismiss();
  };

  if (!currentTrigger) return null;

  const Icon = currentTrigger.icon;

  return (
    <AnimatePresence>
      {showTrigger && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-4 right-4 z-50 max-w-sm"
        >
          <Card className="shadow-lg border-2 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
            
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={cn(
                  "p-2 rounded-full bg-muted",
                  currentTrigger.color
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold">{currentTrigger.title}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 -mt-1 -mr-2"
                      onClick={handleDismiss}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {currentTrigger.message}
                  </p>
                  
                  <div className="flex items-center space-x-2 pt-1">
                    <Button
                      size="sm"
                      onClick={handleUpgrade}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Crown className="w-3 h-3 mr-1" />
                      {currentTrigger.cta}
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                    
                    <Badge variant="secondary" className="text-xs">
                      Limited Time Offer
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Achievement-based trigger component
interface AchievementUpgradeTriggerProps {
  achievementName: string;
  onDismiss?: () => void;
}

export function AchievementUpgradeTrigger({ 
  achievementName, 
  onDismiss 
}: AchievementUpgradeTriggerProps) {
  const router = useRouter();
  const { subscription, isActive } = useSubscription();
  const [show, setShow] = useState(false);

  // Don't show for paid users
  if (isActive || subscription?.plan !== 'free') {
    return null;
  }

  useEffect(() => {
    // Show after a delay to not interfere with achievement celebration
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleUpgrade = () => {
    router.push('/pricing');
    setShow(false);
    onDismiss?.();
  };

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
        >
          <Card className="border-2 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
            <CardContent className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <Trophy className="w-12 h-12 text-yellow-500" />
                  <Sparkles className="w-6 h-6 text-purple-500 absolute -top-2 -right-2" />
                </div>
              </div>
              
              <h3 className="text-lg font-bold mb-2">
                Congratulations on "{achievementName}"! 🎉
              </h3>
              
              <p className="text-sm text-muted-foreground mb-4">
                You're making amazing progress! Unlock premium features to accelerate your growth even more.
              </p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span>Unlimited Achievements</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="w-4 h-4 text-purple-500" />
                    <span>Exclusive Badges</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span>Advanced Analytics</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Crown className="w-4 h-4 text-pink-500" />
                    <span>Premium Rewards</span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpgrade}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Premium
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={handleDismiss}
                  >
                    Maybe Later
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}