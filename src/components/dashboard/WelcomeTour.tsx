'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  Sparkles, 
  ArrowRight, 
  Map,
  Target,
  Brain,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Compass,
  Rocket
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  icon: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Your Creator Dashboard! 🎉',
    description: 'Congratulations on completing your onboarding! Let me show you around your new AI-powered command center.',
    icon: <Rocket className="h-5 w-5" />
  },
  {
    id: 'journey-guide',
    title: 'Your AI Journey Guide',
    description: 'This is your personal AI assistant that analyzes your progress and tells you exactly what to do next. No more guessing!',
    target: '.ai-journey-guide',
    position: 'top',
    icon: <Map className="h-5 w-5" />
  },
  {
    id: 'todays-tasks',
    title: "Today's Tasks",
    description: 'Your daily action items are here. The AI personalizes these based on your current stage and progress.',
    target: '[data-today-tasks]',
    position: 'right',
    icon: <CheckCircle2 className="h-5 w-5" />
  },
  {
    id: 'calendar',
    title: 'Content Calendar',
    description: 'Plan and schedule your content with AI suggestions. Click the Calendar tab to see your content pipeline.',
    target: '[data-calendar-tab]',
    position: 'bottom',
    icon: <Calendar className="h-5 w-5" />
  },
  {
    id: 'finish',
    title: "You're All Set! 🚀",
    description: "Your AI Journey Guide will adapt as you grow. Follow the daily tasks, check your progress, and watch your channel thrive!",
    icon: <Sparkles className="h-5 w-5" />
  }
];

export function WelcomeTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    // Check if this is the first dashboard visit
    const firstVisit = localStorage.getItem('firstDashboardVisit');
    const tourCompleted = localStorage.getItem('dashboardTourCompleted');
    
    if (firstVisit === 'true' && tourCompleted !== 'true') {
      // Small delay to ensure page elements are rendered
      setTimeout(() => {
        setIsOpen(true);
        // Fire confetti for celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 500);
      
      // Clear the first visit flag
      localStorage.removeItem('firstDashboardVisit');
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      
      // Scroll to target element if specified
      const nextStep = tourSteps[currentStep + 1];
      if (nextStep.target) {
        const element = document.querySelector(nextStep.target);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleComplete = () => {
    localStorage.setItem('dashboardTourCompleted', 'true');
    setIsOpen(false);
    
    // Final celebration
    confetti({
      particleCount: 200,
      spread: 100,
      origin: { y: 0.5 }
    });

    // Track tour completion
    fetch('/api/ai/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete_tour',
        data: { tourType: 'dashboard_welcome' }
      })
    });
  };

  const handleSkip = () => {
    localStorage.setItem('dashboardTourCompleted', 'true');
    setIsOpen(false);
  };

  const currentStepData = tourSteps[currentStep];
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleSkip}
          />
        )}
      </AnimatePresence>

      {/* Tour Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={cn(
              "fixed z-50",
              currentStepData.target ? "pointer-events-none" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            )}
          >
            <Card className={cn(
              "w-[400px] shadow-2xl pointer-events-auto",
              currentStepData.target && "absolute"
            )}
            style={currentStepData.target ? getPositionStyles(currentStepData) : {}}>
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      {currentStepData.icon}
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {currentStepData.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          Step {currentStep + 1} of {tourSteps.length}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={handleSkip}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {currentStepData.description}
                </p>

                {/* Progress dots */}
                <div className="flex items-center justify-center gap-1.5">
                  {tourSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        index === currentStep 
                          ? "w-8 bg-purple-600" 
                          : index < currentStep
                          ? "w-1.5 bg-purple-400"
                          : "w-1.5 bg-gray-300"
                      )}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    Skip tour
                  </Button>
                  
                  {isLastStep ? (
                    <Button
                      size="sm"
                      onClick={handleComplete}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Start Creating
                      <Sparkles className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleNext}>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Spotlight effect for target elements */}
            {currentStepData.target && (
              <Spotlight target={currentStepData.target} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Access Button to Restart Tour */}
      <AnimatePresence>
        {!isOpen && hasSeenTour && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed bottom-4 right-4 z-30"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentStep(0);
                setIsOpen(true);
              }}
              className="shadow-lg"
            >
              <Compass className="h-4 w-4 mr-2" />
              Tour Dashboard
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Helper component for spotlight effect
function Spotlight({ target }: { target: string }) {
  const [bounds, setBounds] = useState<DOMRect | null>(null);

  useEffect(() => {
    const element = document.querySelector(target);
    if (element) {
      setBounds(element.getBoundingClientRect());
    }
  }, [target]);

  if (!bounds) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-45"
      style={{
        background: `radial-gradient(circle at ${bounds.left + bounds.width / 2}px ${bounds.top + bounds.height / 2}px, transparent 120px, rgba(0,0,0,0.4) 180px)`,
      }}
    >
      <div
        className="absolute border-2 border-purple-500 rounded-lg animate-pulse"
        style={{
          top: bounds.top - 4,
          left: bounds.left - 4,
          width: bounds.width + 8,
          height: bounds.height + 8,
        }}
      />
    </div>
  );
}

// Helper function to calculate position styles
function getPositionStyles(step: TourStep): React.CSSProperties {
  if (!step.target) return {};

  const element = document.querySelector(step.target);
  if (!element) return {};

  const bounds = element.getBoundingClientRect();
  const cardWidth = 400;
  const cardHeight = 250; // Approximate
  const padding = 20;

  switch (step.position) {
    case 'top':
      return {
        top: bounds.top - cardHeight - padding,
        left: Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, bounds.left + (bounds.width - cardWidth) / 2))
      };
    case 'bottom':
      return {
        top: bounds.bottom + padding,
        left: Math.max(padding, Math.min(window.innerWidth - cardWidth - padding, bounds.left + (bounds.width - cardWidth) / 2))
      };
    case 'left':
      return {
        top: Math.max(padding, Math.min(window.innerHeight - cardHeight - padding, bounds.top + (bounds.height - cardHeight) / 2)),
        left: bounds.left - cardWidth - padding
      };
    case 'right':
      return {
        top: Math.max(padding, Math.min(window.innerHeight - cardHeight - padding, bounds.top + (bounds.height - cardHeight) / 2)),
        left: bounds.right + padding
      };
    default:
      return {};
  }
}