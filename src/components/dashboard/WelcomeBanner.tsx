'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { X, Sparkles, Rocket, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const { selectedPlatform, selectedNiche, progress } = useAppStore();

  if (!isVisible) return null;

  const dismissBanner = () => {
    setIsVisible(false);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardContent className="p-6">
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 text-white hover:bg-white/20"
                onClick={dismissBanner}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-6">
                <div className="hidden sm:block">
                  <div className="relative">
                    <Rocket className="h-16 w-16 animate-bounce" />
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-300" />
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    Welcome to Your Creator Journey! 🎉
                  </h2>
                  <p className="text-white/90 mb-4">
                    You're on your way to becoming a successful {selectedPlatform?.displayName} creator 
                    in the {selectedNiche?.name} niche. Let's make your first week amazing!
                  </p>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant="secondary" 
                      size="sm"
                      onClick={() => {
                        const element = document.querySelector('[data-today-tasks]');
                        element?.scrollIntoView({ behavior: 'smooth' });
                        dismissBanner();
                      }}
                    >
                      Start First Task
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-white border-white hover:bg-white/20"
                      onClick={() => window.location.href = '/roadmap'}
                    >
                      View Your Roadmap
                    </Button>
                  </div>
                </div>

                <div className="hidden lg:flex flex-col items-center text-center">
                  <TrendingUp className="h-8 w-8 mb-2" />
                  <div className="text-sm font-medium">Your Goal</div>
                  <div className="text-2xl font-bold">1K Followers</div>
                  <div className="text-xs opacity-80">in 90 days</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}