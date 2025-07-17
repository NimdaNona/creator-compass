'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Search, Filter, DollarSign, Target, Package, 
  Lightbulb, Settings, Code, Mic, Monitor, HelpCircle,
  ChevronRight, Sparkles, MessageSquare, ShoppingCart,
  CheckCircle, AlertCircle, TrendingUp, Zap, Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

interface ResourceRecommendation {
  id: string;
  name: string;
  type: string;
  category: string;
  price: number;
  rating: number;
  reason: string;
  matchScore: number;
  alternatives?: string[];
  bestFor: string[];
  considerations: string[];
}

interface BudgetBreakdown {
  essential: {
    items: string[];
    total: number;
  };
  recommended: {
    items: string[];
    total: number;
  };
  optional: {
    items: string[];
    total: number;
  };
}

interface SetupGuide {
  title: string;
  description: string;
  steps: {
    step: number;
    title: string;
    description: string;
    tips?: string[];
  }[];
  estimatedTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface AIResourceAssistantProps {
  activeCategory?: string;
  budget?: number;
  userLevel?: string;
  className?: string;
}

export function AIResourceAssistant({ 
  activeCategory = 'equipment',
  budget,
  userLevel = 'beginner',
  className 
}: AIResourceAssistantProps) {
  const { selectedPlatform, selectedNiche } = useAppStore();
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [budgetBreakdown, setBudgetBreakdown] = useState<BudgetBreakdown | null>(null);
  const [setupGuides, setSetupGuides] = useState<SetupGuide[]>([]);
  const [userQuestion, setUserQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('recommendations');
  const [showChat, setShowChat] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchResourceRecommendations();
  }, [activeCategory, budget, userLevel, selectedPlatform]);

  const fetchResourceRecommendations = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/resource-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform?.id || 'youtube',
          niche: selectedNiche?.name || 'general',
          category: activeCategory,
          budget: budget || 500,
          userLevel,
          preferences: {
            prioritizeQuality: true,
            needPortability: false,
            preferBrands: [],
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
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
              
              if (data.recommendations) {
                setRecommendations(data.recommendations);
              }
              if (data.budgetBreakdown) {
                setBudgetBreakdown(data.budgetBreakdown);
              }
              if (data.setupGuides) {
                setSetupGuides(data.setupGuides);
              }
            } catch (e) {
              console.error('Error parsing resource data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Failed to load AI recommendations",
        description: "Using default suggestions.",
        variant: "destructive",
      });
      
      // Set fallback data
      setRecommendations(generateFallbackRecommendations());
      setBudgetBreakdown(generateFallbackBudget());
      setSetupGuides(generateFallbackGuides());
    } finally {
      setIsLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/resource-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQuestion,
          context: {
            category: activeCategory,
            budget,
            platform: selectedPlatform?.id,
            niche: selectedNiche?.name,
            userLevel,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get answer');
      }

      const data = await response.json();
      
      toast({
        title: "AI Answer",
        description: data.answer,
      });
      
      setUserQuestion('');
    } catch (error) {
      toast({
        title: "Failed to get answer",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateFallbackRecommendations = (): ResourceRecommendation[] => {
    const categoryRecs = {
      equipment: [
        {
          id: '1',
          name: 'Blue Yeti USB Microphone',
          type: 'Microphone',
          category: 'Audio',
          price: 100,
          rating: 4.5,
          reason: 'Perfect starter mic with excellent quality for the price',
          matchScore: 95,
          alternatives: ['Audio-Technica AT2020USB+', 'Samson Q2U'],
          bestFor: ['Podcasting', 'Streaming', 'Voice-overs'],
          considerations: ['Picks up background noise', 'Heavy and bulky'],
        },
        {
          id: '2',
          name: 'Logitech C920 HD Pro',
          type: 'Webcam',
          category: 'Video',
          price: 80,
          rating: 4.3,
          reason: 'Reliable 1080p webcam trusted by millions of creators',
          matchScore: 90,
          alternatives: ['Razer Kiyo', 'Logitech Brio'],
          bestFor: ['Streaming', 'Video calls', 'Basic recording'],
          considerations: ['No 4K support', 'Fixed focus'],
        },
      ],
      software: [
        {
          id: '3',
          name: 'OBS Studio',
          type: 'Streaming Software',
          category: 'Production',
          price: 0,
          rating: 4.8,
          reason: 'Free, powerful, and industry-standard streaming software',
          matchScore: 100,
          alternatives: ['Streamlabs OBS', 'XSplit'],
          bestFor: ['Live streaming', 'Screen recording', 'Multi-camera setups'],
          considerations: ['Steep learning curve', 'Resource intensive'],
        },
      ],
    };

    return categoryRecs[activeCategory as keyof typeof categoryRecs] || [];
  };

  const generateFallbackBudget = (): BudgetBreakdown => ({
    essential: {
      items: ['Microphone', 'Basic lighting', 'Editing software'],
      total: 250,
    },
    recommended: {
      items: ['Webcam', 'Green screen', 'Audio interface'],
      total: 400,
    },
    optional: {
      items: ['DSLR camera', 'Professional lighting', 'Stream deck'],
      total: 800,
    },
  });

  const generateFallbackGuides = (): SetupGuide[] => [
    {
      title: 'Basic Home Studio Setup',
      description: 'Get started with a professional-looking setup on a budget',
      steps: [
        {
          step: 1,
          title: 'Choose Your Recording Space',
          description: 'Find a quiet room with minimal echo',
          tips: ['Add soft furnishings to reduce echo', 'Face away from windows'],
        },
        {
          step: 2,
          title: 'Set Up Your Audio',
          description: 'Position your microphone correctly',
          tips: ['Keep mic 6-8 inches from mouth', 'Use a pop filter'],
        },
        {
          step: 3,
          title: 'Optimize Lighting',
          description: 'Create flattering, even lighting',
          tips: ['Use natural light when possible', 'Avoid harsh shadows'],
        },
      ],
      estimatedTime: '2 hours',
      difficulty: 'beginner',
    },
  ];

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 dark:bg-green-950 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400';
    return 'text-red-600 bg-red-50 dark:bg-red-950 dark:text-red-400';
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            <CardTitle>AI Resource Assistant</CardTitle>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Beta
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowChat(!showChat)}
            className="text-white hover:bg-white/20"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription className="text-blue-100">
          Personalized equipment and software recommendations
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        {showChat && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex gap-2">
              <Input
                placeholder="Ask about equipment, software, or setup..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                disabled={isLoading}
              />
              <Button 
                onClick={handleAskQuestion} 
                disabled={isLoading || !userQuestion.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recommendations">Recommended</TabsTrigger>
            <TabsTrigger value="budget">Budget Plan</TabsTrigger>
            <TabsTrigger value="guides">Setup Guides</TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Analyzing your needs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, idx) => (
                  <motion.div
                    key={rec.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{rec.name}</h4>
                            <p className="text-sm text-muted-foreground">{rec.type}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold">
                              ${rec.price}
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{rec.rating}</span>
                            </div>
                          </div>
                        </div>

                        <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm", getMatchScoreColor(rec.matchScore))}>
                          <Target className="h-3 w-3" />
                          {rec.matchScore}% match
                        </div>

                        <p className="text-sm">{rec.reason}</p>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs font-medium mb-1">Best for:</p>
                            <div className="flex flex-wrap gap-1">
                              {rec.bestFor.map((use) => (
                                <Badge key={use} variant="secondary" className="text-xs">
                                  {use}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          {rec.considerations.length > 0 && (
                            <Alert className="p-2">
                              <AlertCircle className="h-3 w-3" />
                              <AlertDescription className="text-xs ml-2">
                                {rec.considerations.join(' • ')}
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1">
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            View Details
                          </Button>
                          {rec.alternatives && rec.alternatives.length > 0 && (
                            <Button size="sm" variant="outline">
                              Alternatives
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Budget Plan Tab */}
          <TabsContent value="budget" className="space-y-4">
            {budgetBreakdown && (
              <div className="space-y-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Your Budget</p>
                  <p className="text-2xl font-bold">${budget || 500}</p>
                </div>

                {Object.entries(budgetBreakdown).map(([tier, data]) => (
                  <Card key={tier} className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium capitalize flex items-center gap-2">
                          {tier === 'essential' && <Zap className="h-4 w-4 text-yellow-500" />}
                          {tier === 'recommended' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          {tier === 'optional' && <Sparkles className="h-4 w-4 text-purple-500" />}
                          {tier}
                        </h4>
                        <span className="font-bold">${data.total}</span>
                      </div>
                      <div className="space-y-1">
                        {data.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <ChevronRight className="h-3 w-3" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Start with essentials and upgrade gradually as you grow
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>

          {/* Setup Guides Tab */}
          <TabsContent value="guides" className="space-y-4">
            {setupGuides.map((guide, idx) => (
              <Card key={idx} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{guide.title}</h4>
                      <p className="text-sm text-muted-foreground">{guide.description}</p>
                    </div>
                    <Badge variant={guide.difficulty === 'beginner' ? 'default' : 'secondary'}>
                      {guide.difficulty}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Settings className="h-3 w-3" />
                      {guide.steps.length} steps
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {guide.estimatedTime}
                    </div>
                  </div>

                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {guide.steps.map((step) => (
                        <div key={step.step} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">
                            {step.step}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{step.title}</p>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <Button className="w-full">
                    View Full Guide
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}