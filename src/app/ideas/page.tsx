'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IdeaGenerator, GeneratedIdea } from '@/components/ideas/IdeaGenerator';
import { SavedIdeas } from '@/components/ideas/SavedIdeas';
import { TrendingTopics } from '@/components/ideas/TrendingTopics';
import { IdeaFilters } from '@/components/ideas/IdeaFilters';
import { ScheduleIdeaModal } from '@/components/ideas/ScheduleIdeaModal';
import { 
  Lightbulb,
  Sparkles,
  TrendingUp,
  Save,
  Filter,
  Plus,
  RefreshCw,
  Zap
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { Badge } from '@/components/ui/badge';

export default function IdeasPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { selectedPlatform, selectedNiche, subscription } = useAppStore();
  const [activeTab, setActiveTab] = useState('generate');
  const [showPaywall, setShowPaywall] = useState(false);
  const [generatedToday, setGeneratedToday] = useState(0);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);

  // Free tier limits
  const freeUserDailyLimit = 5;
  const hasFullAccess = subscription !== 'free';

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, router]);

  const handleGenerateIdea = () => {
    if (!hasFullAccess && generatedToday >= freeUserDailyLimit) {
      setShowPaywall(true);
      return;
    }
    // Idea generation logic handled in IdeaGenerator component
  };

  const handleScheduleIdea = (idea: GeneratedIdea) => {
    setSelectedIdea(idea);
    setScheduleModalOpen(true);
  };

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Lightbulb className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading ideas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                <Lightbulb className="w-8 h-8" />
                Content Ideas
              </h1>
              <p className="text-muted-foreground">
                Never run out of content ideas with AI-powered suggestions
              </p>
              {!hasFullAccess && (
                <Badge variant="secondary" className="mt-2">
                  Free plan: {freeUserDailyLimit - generatedToday} ideas left today
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button onClick={handleGenerateIdea}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Ideas Section */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="generate" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="hidden sm:inline">Generate</span>
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  <span className="hidden sm:inline">Saved</span>
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Trending</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generate" className="mt-6">
                <IdeaGenerator 
                  platform={selectedPlatform}
                  niche={selectedNiche}
                  hasFullAccess={hasFullAccess}
                  dailyLimit={freeUserDailyLimit}
                  generatedToday={generatedToday}
                  onGenerate={() => setGeneratedToday(prev => prev + 1)}
                  onLimitReached={() => setShowPaywall(true)}
                  onScheduleIdea={handleScheduleIdea}
                />
              </TabsContent>

              <TabsContent value="saved" className="mt-6">
                <SavedIdeas />
              </TabsContent>

              <TabsContent value="trending" className="mt-6">
                <TrendingTopics 
                  platform={selectedPlatform}
                  niche={selectedNiche}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Filters */}
            <IdeaFilters />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Idea Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Generated Today</span>
                  <span className="font-medium">{generatedToday}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Saved Ideas</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Implemented</span>
                  <span className="font-medium">12</span>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p className="text-muted-foreground">
                    • Generate ideas when you're feeling creative, not pressured
                  </p>
                  <p className="text-muted-foreground">
                    • Save multiple variations to test later
                  </p>
                  <p className="text-muted-foreground">
                    • Check trending topics weekly for fresh inspiration
                  </p>
                  <p className="text-muted-foreground">
                    • Mix evergreen content with trending topics
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Premium Upsell for Free Users */}
            {!hasFullAccess && (
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="text-center space-y-3">
                    <Sparkles className="w-8 h-8 mx-auto text-purple-500" />
                    <h3 className="font-semibold">Unlimited Ideas</h3>
                    <p className="text-sm text-muted-foreground">
                      Generate unlimited content ideas and access AI-powered suggestions
                    </p>
                    <Button 
                      className="w-full" 
                      onClick={() => router.push('/pricing')}
                    >
                      Upgrade to Premium
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Paywall Modal */}
      <PaywallModal 
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Unlimited Idea Generation"
        description="Generate unlimited content ideas with AI-powered suggestions tailored to your niche and platform."
      />

      {/* Schedule Idea Modal */}
      <ScheduleIdeaModal
        isOpen={scheduleModalOpen}
        onClose={() => {
          setScheduleModalOpen(false);
          setSelectedIdea(null);
        }}
        idea={selectedIdea}
        platform={selectedPlatform?.id}
      />
    </div>
  );
}