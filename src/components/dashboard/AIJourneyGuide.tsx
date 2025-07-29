'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Compass, 
  TrendingUp, 
  Target, 
  Sparkles, 
  ArrowRight,
  Clock,
  Zap,
  CheckCircle2,
  Info,
  X,
  Rocket,
  Brain,
  Map,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface NextStep {
  title: string;
  description: string;
  type: 'task' | 'milestone' | 'feature' | 'learning';
  priority: 'high' | 'medium' | 'low';
  actionUrl?: string;
  estimatedTime?: string;
}

interface Recommendation {
  title: string;
  description: string;
  rationale: string;
  type: 'content' | 'tool' | 'strategy' | 'community';
  impact: 'high' | 'medium' | 'low';
}

interface JourneyData {
  stage: string;
  currentFocus: string;
  nextSteps: NextStep[];
  recommendations: Recommendation[];
  motivationalMessage?: string;
}

interface JourneyContext {
  platform?: string;
  niche?: string;
  daysActive: number;
  tasksCompleted: number;
  currentStreak: number;
}

export function AIJourneyGuide() {
  const [journeyData, setJourneyData] = useState<JourneyData | null>(null);
  const [context, setContext] = useState<JourneyContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchJourneyInsights();
  }, []);

  const fetchJourneyInsights = async () => {
    try {
      const response = await fetch('/api/ai/journey');
      if (!response.ok) throw new Error('Failed to fetch journey insights');
      
      const data = await response.json();
      setJourneyData(data.journey);
      setContext(data.context);
    } catch (error) {
      console.error('Error fetching journey insights:', error);
      toast.error('Failed to load journey insights');
    } finally {
      setLoading(false);
    }
  };

  const handleStepAction = async (step: NextStep) => {
    if (step.actionUrl) {
      // Track the action
      await fetch('/api/ai/journey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept_next_step',
          data: { nextStepId: step.title }
        })
      });
      
      // Navigate to the action URL
      window.location.href = step.actionUrl;
    }
  };

  const dismissRecommendation = async (recommendation: Recommendation) => {
    setDismissedRecommendations(prev => new Set(prev).add(recommendation.title));
    
    await fetch('/api/ai/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dismiss_recommendation',
        data: { recommendationId: recommendation.title }
      })
    });
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'discovery':
        return <Compass className="h-5 w-5" />;
      case 'foundation':
        return <Target className="h-5 w-5" />;
      case 'growth':
        return <TrendingUp className="h-5 w-5" />;
      case 'scale':
        return <Rocket className="h-5 w-5" />;
      case 'mastery':
        return <Sparkles className="h-5 w-5" />;
      default:
        return <Map className="h-5 w-5" />;
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'discovery':
        return 'bg-blue-500';
      case 'foundation':
        return 'bg-purple-500';
      case 'growth':
        return 'bg-green-500';
      case 'scale':
        return 'bg-orange-500';
      case 'mastery':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStepIcon = (type: NextStep['type']) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'milestone':
        return <Target className="h-4 w-4" />;
      case 'feature':
        return <Zap className="h-4 w-4" />;
      case 'learning':
        return <Brain className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!journeyData || !context) {
    return null;
  }

  const visibleRecommendations = journeyData.recommendations.filter(
    rec => !dismissedRecommendations.has(rec.title)
  );

  return (
    <div className="space-y-6 ai-journey-guide">
      {/* Journey Stage Card */}
      <Card className="overflow-hidden">
        <div className={cn("h-2", getStageColor(journeyData.stage))} />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", getStageColor(journeyData.stage), "bg-opacity-20")}>
                {getStageIcon(journeyData.stage)}
              </div>
              <div>
                <CardTitle className="capitalize">
                  {journeyData.stage} Stage
                </CardTitle>
                <CardDescription>
                  {journeyData.currentFocus}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Day {context.daysActive}</div>
              <div className="text-xs text-muted-foreground">{context.tasksCompleted} tasks completed</div>
            </div>
          </div>
        </CardHeader>
        
        {journeyData.motivationalMessage && (
          <CardContent className="pt-0">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                {journeyData.motivationalMessage}
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* What Should I Do Next? */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Map className="h-5 w-5 text-purple-600" />
            <CardTitle>What Should I Do Next?</CardTitle>
          </div>
          <CardDescription>
            AI-powered guidance based on your current progress
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3">
            {journeyData.nextSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all",
                  expandedStep === step.title ? "border-purple-500 shadow-md" : "hover:border-gray-300"
                )}
                onClick={() => setExpandedStep(expandedStep === step.title ? null : step.title)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-1.5 rounded mt-0.5", getPriorityColor(step.priority))}>
                    {getStepIcon(step.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <div className="flex items-center gap-2">
                        {step.estimatedTime && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {step.estimatedTime}
                          </Badge>
                        )}
                        <Badge className={cn("text-xs", getPriorityColor(step.priority))}>
                          {step.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {step.description}
                    </p>
                    
                    <AnimatePresence>
                      {expandedStep === step.title && step.actionUrl && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3"
                        >
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStepAction(step);
                            }}
                          >
                            Start Now
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      {visibleRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle>AI Recommendations</CardTitle>
            </div>
            <CardDescription>
              Personalized suggestions to accelerate your growth
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {visibleRecommendations.map((rec, index) => (
                <motion.div
                  key={rec.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium">{rec.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getImpactColor(rec.impact)} variant="secondary">
                        {rec.impact} impact
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => dismissRecommendation(rec)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {rec.description}
                  </p>
                  
                  <div className="bg-muted/50 rounded p-2">
                    <p className="text-xs text-muted-foreground">
                      <strong>Why this matters:</strong> {rec.rationale}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}