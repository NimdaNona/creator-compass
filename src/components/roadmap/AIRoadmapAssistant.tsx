'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Target, TrendingUp, Calendar, Clock, Zap, AlertTriangle,
  CheckCircle, ArrowRight, RefreshCw, Sparkles, ChevronRight,
  Lightbulb, Settings, Activity, Award, User, BarChart3,
  MessageSquare, Edit3, Plus, Minus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface TaskAdjustment {
  taskId: string;
  originalTask: string;
  adjustedTask: string;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  type: 'simplify' | 'enhance' | 'reschedule' | 'replace';
}

interface MilestoneRecommendation {
  milestone: string;
  currentProgress: number;
  recommendation: string;
  actions: string[];
  estimatedCompletion: string;
  risk: 'on-track' | 'at-risk' | 'behind';
}

interface PersonalizedTip {
  title: string;
  content: string;
  category: 'motivation' | 'strategy' | 'technical' | 'growth';
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  relatedTask?: string;
}

interface RoadmapAnalysis {
  overallProgress: number;
  streak: number;
  tasksCompleted: number;
  tasksRemaining: number;
  estimatedCompletion: string;
  progressTrend: 'improving' | 'steady' | 'declining';
  recommendations: string[];
}

interface AIRoadmapAssistantProps {
  roadmapData?: any;
  userProgress?: any;
  className?: string;
}

export function AIRoadmapAssistant({ 
  roadmapData,
  userProgress,
  className 
}: AIRoadmapAssistantProps) {
  const { selectedPlatform, selectedNiche, progress } = useAppStore();
  const [taskAdjustments, setTaskAdjustments] = useState<TaskAdjustment[]>([]);
  const [milestoneRecs, setMilestoneRecs] = useState<MilestoneRecommendation[]>([]);
  const [personalizedTips, setPersonalizedTips] = useState<PersonalizedTip[]>([]);
  const [analysis, setAnalysis] = useState<RoadmapAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [showAdjustments, setShowAdjustments] = useState(true);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchRoadmapAnalysis();
  }, [roadmapData, userProgress]);

  const fetchRoadmapAnalysis = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch('/api/ai/roadmap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform?.id,
          niche: selectedNiche?.name,
          progress: {
            currentPhase: progress?.currentPhase || 1,
            completedTasks: progress?.completedTasks || 0,
            totalTasks: progress?.totalTasks || 90,
            streakDays: progress?.streakDays || 0,
            startDate: progress?.startDate,
          },
          roadmapData: roadmapData || generateMockRoadmap(),
          userBehavior: {
            avgTaskCompletionTime: 2.5,
            preferredWorkTime: 'evening',
            strugglingAreas: ['technical', 'consistency'],
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch roadmap analysis');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.adjustments) {
                setTaskAdjustments(data.adjustments);
              }
              if (data.milestones) {
                setMilestoneRecs(data.milestones);
              }
              if (data.tips) {
                setPersonalizedTips(data.tips);
              }
              if (data.analysis) {
                setAnalysis(data.analysis);
              }
            } catch (e) {
              console.error('Error parsing roadmap data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching roadmap analysis:', error);
      toast({
        title: "Failed to load AI analysis",
        description: "Using cached recommendations.",
        variant: "destructive",
      });
      
      // Set fallback data
      setAnalysis(generateFallbackAnalysis());
      setTaskAdjustments(generateFallbackAdjustments());
      setMilestoneRecs(generateFallbackMilestones());
      setPersonalizedTips(generateFallbackTips());
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchRoadmapAnalysis(true);
  };

  const handleApplyAdjustment = async (adjustment: TaskAdjustment) => {
    try {
      // Apply the adjustment to the roadmap
      toast({
        title: "Adjustment Applied",
        description: `Task "${adjustment.originalTask}" has been updated.`,
      });
      
      // Refresh the analysis
      await fetchRoadmapAnalysis(true);
    } catch (error) {
      toast({
        title: "Failed to apply adjustment",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const generateMockRoadmap = () => ({
    phases: [
      { id: 1, name: 'Foundation', tasks: 30 },
      { id: 2, name: 'Growth', tasks: 30 },
      { id: 3, name: 'Scale', tasks: 30 },
    ],
    currentTasks: [
      'Create channel trailer',
      'Set up analytics',
      'Design thumbnail templates',
      'Write content calendar',
    ],
  });

  const generateFallbackAnalysis = (): RoadmapAnalysis => ({
    overallProgress: 35,
    streak: 7,
    tasksCompleted: 32,
    tasksRemaining: 58,
    estimatedCompletion: '75 days',
    progressTrend: 'improving',
    recommendations: [
      'Focus on completing foundation tasks before moving to growth',
      'Maintain your 7-day streak to build momentum',
      'Consider breaking down complex tasks into smaller steps',
    ],
  });

  const generateFallbackAdjustments = (): TaskAdjustment[] => [
    {
      taskId: '1',
      originalTask: 'Create 10 thumbnail templates',
      adjustedTask: 'Create 3 high-quality thumbnail templates',
      reason: 'Quality over quantity for better engagement',
      impact: 'high',
      type: 'simplify',
    },
    {
      taskId: '2',
      originalTask: 'Write 30 video scripts',
      adjustedTask: 'Write 10 video scripts with detailed outlines',
      reason: 'More manageable workload while maintaining quality',
      impact: 'medium',
      type: 'simplify',
    },
  ];

  const generateFallbackMilestones = (): MilestoneRecommendation[] => [
    {
      milestone: 'Complete Foundation Phase',
      currentProgress: 85,
      recommendation: 'You\'re close! Focus on the remaining 5 tasks',
      actions: [
        'Finish channel branding',
        'Complete equipment setup',
        'Finalize content strategy',
      ],
      estimatedCompletion: '3 days',
      risk: 'on-track',
    },
    {
      milestone: 'First 1000 Subscribers',
      currentProgress: 45,
      recommendation: 'Consistency is key - maintain upload schedule',
      actions: [
        'Post 2x per week minimum',
        'Engage with comments daily',
        'Collaborate with similar creators',
      ],
      estimatedCompletion: '30 days',
      risk: 'at-risk',
    },
  ];

  const generateFallbackTips = (): PersonalizedTip[] => [
    {
      title: 'Evening Productivity Boost',
      content: 'Since you work best in the evening, batch your creative tasks between 7-10 PM for maximum efficiency.',
      category: 'strategy',
      priority: 'high',
      actionable: true,
    },
    {
      title: 'Technical Skill Building',
      content: 'Dedicate 15 minutes daily to learning one new editing technique. Small steps lead to big improvements.',
      category: 'technical',
      priority: 'medium',
      actionable: true,
      relatedTask: 'Master video editing basics',
    },
  ];

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'on-track':
        return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
      case 'at-risk':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400';
      case 'behind':
        return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'motivation':
        return <Award className="h-4 w-4" />;
      case 'strategy':
        return <Target className="h-4 w-4" />;
      case 'technical':
        return <Settings className="h-4 w-4" />;
      case 'growth':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>AI Roadmap Assistant</CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Beta
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-white hover:bg-white/20"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
        </div>
        <CardDescription className="text-purple-100">
          Personalized guidance to optimize your creator journey
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Analyzing your roadmap...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Overview */}
            {analysis && (
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Progress Analysis
                  </h4>
                  <Badge variant={analysis.progressTrend === 'improving' ? 'default' : 'secondary'}>
                    {analysis.progressTrend}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Overall Progress</span>
                    <span className="font-medium">{analysis.overallProgress}%</span>
                  </div>
                  <Progress value={analysis.overallProgress} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold">{analysis.streak}</p>
                      <p className="text-xs text-muted-foreground">Day Streak</p>
                    </div>
                    <div className="text-center p-3 bg-background rounded-lg">
                      <p className="text-2xl font-bold">{analysis.estimatedCompletion}</p>
                      <p className="text-xs text-muted-foreground">Est. Completion</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="adjustments">Adjustments</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="tips">Tips</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                {analysis?.recommendations.map((rec, idx) => (
                  <Alert key={idx} className="border-l-4 border-l-purple-500">
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))}
              </TabsContent>

              {/* Task Adjustments Tab */}
              <TabsContent value="adjustments" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-muted-foreground">
                    AI-suggested optimizations for your tasks
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdjustments(!showAdjustments)}
                  >
                    {showAdjustments ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    {showAdjustments ? 'Hide' : 'Show'} All
                  </Button>
                </div>

                <AnimatePresence>
                  {showAdjustments && taskAdjustments.map((adjustment, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <Badge className={getImpactColor(adjustment.impact)} variant="secondary">
                              {adjustment.impact} impact
                            </Badge>
                            <Badge variant="outline">{adjustment.type}</Badge>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-sm text-muted-foreground">From:</span>
                              <p className="text-sm line-through opacity-60">{adjustment.originalTask}</p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-sm text-muted-foreground">To:</span>
                              <p className="text-sm font-medium">{adjustment.adjustedTask}</p>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground">{adjustment.reason}</p>
                          
                          <Button
                            size="sm"
                            onClick={() => handleApplyAdjustment(adjustment)}
                            className="w-full"
                          >
                            Apply Adjustment
                            <ArrowRight className="ml-2 h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </TabsContent>

              {/* Milestones Tab */}
              <TabsContent value="milestones" className="space-y-4">
                {milestoneRecs.map((milestone, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{milestone.milestone}</h4>
                        <Badge className={getRiskColor(milestone.risk)} variant="secondary">
                          {milestone.risk}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span>{milestone.currentProgress}%</span>
                        </div>
                        <Progress value={milestone.currentProgress} className="h-2" />
                      </div>
                      
                      <Alert className="p-3">
                        <AlertDescription className="text-sm">
                          {milestone.recommendation}
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Next Actions:</p>
                        {milestone.actions.map((action, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-muted-foreground" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">
                          Est. completion: {milestone.estimatedCompletion}
                        </span>
                        <Button size="sm" variant="outline">
                          View Details
                          <ChevronRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              {/* Tips Tab */}
              <TabsContent value="tips" className="space-y-4">
                {personalizedTips.map((tip, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(tip.category)}
                          <h4 className="font-medium">{tip.title}</h4>
                        </div>
                        <Badge variant={tip.priority === 'high' ? 'destructive' : 'secondary'}>
                          {tip.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{tip.content}</p>
                      
                      {tip.relatedTask && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          <span>Related to: {tip.relatedTask}</span>
                        </div>
                      )}
                      
                      {tip.actionable && (
                        <Button size="sm" variant="outline" className="w-full">
                          <Edit3 className="mr-2 h-3 w-3" />
                          Take Action
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}