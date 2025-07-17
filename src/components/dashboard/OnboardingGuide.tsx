'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  X,
  Compass,
  Calendar,
  Target,
  BarChart3,
  FileText,
  Users,
  Lightbulb,
  PlayCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  completed: boolean;
  video?: string;
  tips?: string[];
}

export function OnboardingGuide() {
  const router = useRouter();
  const { progress, subscription } = useAppStore();
  const [isVisible, setIsVisible] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  // Load completed steps from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('onboarding-completed-steps');
    if (stored) {
      setCompletedSteps(JSON.parse(stored));
    }
  }, []);

  // Hide guide if user has been active for more than 7 days or completed all steps
  useEffect(() => {
    if (progress) {
      const daysActive = Math.floor((Date.now() - new Date(progress.startDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysActive > 7 || completedSteps.length >= 8) {
        setIsVisible(false);
      }
    }
  }, [progress, completedSteps]);

  const steps: GuideStep[] = [
    {
      id: 'explore-dashboard',
      title: 'Explore Your Dashboard',
      description: 'Get familiar with your personalized creator dashboard and key metrics',
      icon: <Compass className="h-5 w-5" />,
      action: {
        label: 'Take a Tour',
        onClick: () => startDashboardTour()
      },
      completed: completedSteps.includes('explore-dashboard'),
      tips: [
        'Check your daily tasks in the overview',
        'Track your progress with the stats',
        'Use AI insights for personalized advice'
      ]
    },
    {
      id: 'complete-first-task',
      title: 'Complete Your First Task',
      description: 'Start your creator journey by completing your first roadmap task',
      icon: <CheckCircle2 className="h-5 w-5" />,
      action: {
        label: 'View Tasks',
        onClick: () => {
          setCurrentStep(1);
          document.querySelector('[data-today-tasks]')?.scrollIntoView({ behavior: 'smooth' });
        }
      },
      completed: completedSteps.includes('complete-first-task') || (progress?.completedTasks || 0) > 0,
      video: '/tutorials/complete-task.mp4'
    },
    {
      id: 'plan-content',
      title: 'Plan Your First Content',
      description: 'Use the content calendar to schedule your upcoming posts',
      icon: <Calendar className="h-5 w-5" />,
      action: {
        label: 'Open Calendar',
        onClick: () => {
          const calendarTab = document.querySelector('[data-calendar-tab]');
          if (calendarTab) {
            (calendarTab as HTMLElement).click();
          }
        }
      },
      completed: completedSteps.includes('plan-content')
    },
    {
      id: 'create-template',
      title: 'Create with AI Templates',
      description: 'Generate your first content using our AI-powered templates',
      icon: <FileText className="h-5 w-5" />,
      action: {
        label: 'Browse Templates',
        href: '/templates'
      },
      completed: completedSteps.includes('create-template')
    },
    {
      id: 'track-analytics',
      title: 'Set Up Analytics',
      description: 'Connect your accounts to track performance (Premium feature)',
      icon: <BarChart3 className="h-5 w-5" />,
      action: {
        label: subscription?.tier === 'free' ? 'Upgrade to Access' : 'View Analytics',
        href: subscription?.tier === 'free' ? '/pricing' : '/analytics'
      },
      completed: completedSteps.includes('track-analytics')
    },
    {
      id: 'set-goals',
      title: 'Define Your Goals',
      description: 'Set specific targets for followers, views, and engagement',
      icon: <Target className="h-5 w-5" />,
      action: {
        label: 'Set Goals',
        onClick: () => openGoalsModal()
      },
      completed: completedSteps.includes('set-goals')
    },
    {
      id: 'join-community',
      title: 'Join the Community',
      description: 'Connect with other creators for support and collaboration',
      icon: <Users className="h-5 w-5" />,
      action: {
        label: 'Coming Soon',
        onClick: () => {}
      },
      completed: false
    },
    {
      id: 'explore-resources',
      title: 'Explore Resources',
      description: 'Access guides, tools, and equipment recommendations',
      icon: <Lightbulb className="h-5 w-5" />,
      action: {
        label: 'View Resources',
        href: '/resources'
      },
      completed: completedSteps.includes('explore-resources')
    }
  ];

  const activeSteps = steps.filter(step => !step.completed);
  const completionPercentage = (completedSteps.length / steps.length) * 100;

  const markStepComplete = (stepId: string) => {
    const newCompleted = [...completedSteps, stepId];
    setCompletedSteps(newCompleted);
    localStorage.setItem('onboarding-completed-steps', JSON.stringify(newCompleted));
  };

  const startDashboardTour = () => {
    // This would trigger an interactive tour
    markStepComplete('explore-dashboard');
    // In a real implementation, this would start a guided tour library like Shepherd.js
  };

  const openGoalsModal = () => {
    // This would open a goals setting modal
    markStepComplete('set-goals');
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6"
      >
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          
          <CardHeader className="relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-lg">Welcome to Creator Compass!</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVisible(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Getting Started Progress
                </span>
                <span className="text-sm font-medium">
                  {completedSteps.length} of {steps.length} completed
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>
          </CardHeader>
          
          <CardContent className="relative pb-6">
            <div className="space-y-3">
              {activeSteps.slice(0, 3).map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all",
                    currentStep === index && "border-purple-500 bg-purple-50 dark:bg-purple-950/20"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-full",
                    currentStep === index 
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-600" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {step.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium text-sm mb-1">{step.title}</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      {step.description}
                    </p>
                    
                    {step.tips && currentStep === index && (
                      <div className="mb-2 space-y-1">
                        {step.tips.map((tip, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Circle className="h-2 w-2" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={currentStep === index ? "default" : "outline"}
                        onClick={() => {
                          if (step.action.onClick) {
                            step.action.onClick();
                          } else if (step.action.href) {
                            router.push(step.action.href);
                          }
                          markStepComplete(step.id);
                        }}
                        className="h-7 text-xs"
                      >
                        {step.action.label}
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                      
                      {step.video && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowVideo(true)}
                          className="h-7 text-xs"
                        >
                          <PlayCircle className="mr-1 h-3 w-3" />
                          Watch Tutorial
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {activeSteps.length > 3 && (
              <div className="mt-4 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // This would expand to show all steps
                  }}
                >
                  View {activeSteps.length - 3} more steps
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}
            
            {completionPercentage === 100 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg text-center"
              >
                <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Congratulations! You've completed the onboarding guide!
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}