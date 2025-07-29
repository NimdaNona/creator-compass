'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Users, 
  Hash,
  Sparkles,
  RefreshCw,
  ChevronRight,
  Target,
  BarChart3,
  Zap,
  AlertCircle,
  Copy,
  Check,
  BookOpen,
  Image
} from 'lucide-react';
import { ContentIdea } from '@/lib/ai/content-idea-generator';
import { cn } from '@/lib/utils';

export function ContentIdeaGenerator() {
  const { selectedPlatform, selectedNiche } = useAppStore();
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateIdeas = async () => {
    if (!selectedPlatform || !selectedNiche) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/content-ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.id,
          niche: selectedNiche.id,
          experienceLevel: 'intermediate',
          preferences: {
            style: 'mixed',
            contentLength: 'medium'
          }
        })
      });

      if (!response.ok) throw new Error('Failed to generate ideas');

      const data = await response.json();
      setIdeas(data.ideas);
      
      // Fetch trends if not already loaded
      if (trends.length === 0) {
        fetchTrends();
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
      setError('Failed to generate content ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrends = async () => {
    if (!selectedPlatform || !selectedNiche) return;

    setLoadingTrends(true);

    try {
      const response = await fetch(
        `/api/ai/content-ideas/trends?platform=${selectedPlatform.id}&niche=${selectedNiche.id}`
      );

      if (!response.ok) throw new Error('Failed to fetch trends');

      const data = await response.json();
      setTrends(data.trends);
    } catch (error) {
      console.error('Error fetching trends:', error);
    } finally {
      setLoadingTrends(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-50';
      case 'intermediate': return 'text-yellow-600 bg-yellow-50';
      case 'advanced': return 'text-red-600 bg-red-50';
      default: return '';
    }
  };

  const getCompetitionColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Content Idea Generator</h2>
        <p className="text-muted-foreground">
          Generate trending content ideas tailored to your platform and niche
        </p>
      </div>

      {/* Generate Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">{selectedPlatform?.displayName}</Badge>
          <Badge variant="outline">{selectedNiche?.name}</Badge>
        </div>
        <Button 
          onClick={generateIdeas}
          disabled={loading || !selectedPlatform || !selectedNiche}
          className="relative"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Generating Ideas...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate New Ideas
            </>
          )}
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ideas List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Generated Ideas
                </span>
                {ideas.length > 0 && (
                  <Badge variant="secondary">{ideas.length} ideas</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  ))}
                </div>
              ) : ideas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center animate-fadeIn">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center animate-pulse">
                    <Lightbulb className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    Ready to spark some ideas?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Generate content ideas tailored to your {selectedPlatform} audience and {selectedNiche} niche
                  </p>
                  <Button onClick={generateIdeas}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Your First Ideas
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {ideas.map((idea) => (
                      <motion.div
                        key={idea.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "p-4 border rounded-lg cursor-pointer transition-all",
                          selectedIdea?.id === idea.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-primary/50"
                        )}
                        onClick={() => setSelectedIdea(idea)}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-lg flex-1 pr-2">
                              {idea.title}
                            </h4>
                            <Badge 
                              variant="secondary"
                              className={getDifficultyColor(idea.difficulty)}
                            >
                              {idea.difficulty}
                            </Badge>
                          </div>

                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {idea.description}
                          </p>

                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center text-muted-foreground">
                              <Clock className="w-3 h-3 mr-1" />
                              {idea.productionTime}
                            </span>
                            <span className="flex items-center text-muted-foreground">
                              <Users className="w-3 h-3 mr-1" />
                              {idea.targetAudience}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {idea.trendingTopics.slice(0, 3).map((topic, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {topic}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center space-x-2 text-sm">
                              <BarChart3 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {idea.estimatedEngagement.views.min.toLocaleString()} - {' '}
                                {idea.estimatedEngagement.views.max.toLocaleString()} views
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trends Sidebar */}
        <div className="space-y-4">
          {/* Trending Topics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending Now
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={fetchTrends}
                  disabled={loadingTrends}
                >
                  <RefreshCw className={cn(
                    "w-3 h-3",
                    loadingTrends && "animate-spin"
                  )} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrends ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : trends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 px-4 text-center animate-fadeIn">
                  <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-sm font-medium mb-1">No trends yet</p>
                  <p className="text-xs text-muted-foreground">
                    Generate ideas to discover trending topics
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trends.slice(0, 5).map((trend, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{trend.topic}</p>
                        <p className="text-xs text-muted-foreground">
                          {trend.searchVolume.toLocaleString()} searches
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant="outline"
                          className={cn("text-xs", getCompetitionColor(trend.competitionLevel))}
                        >
                          {trend.competitionLevel}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {trend.growthRate > 0 ? '+' : ''}{trend.growthRate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Platform Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {selectedPlatform?.id === 'youtube' && (
                  <>
                    <p>• Optimal video length: 8-12 minutes</p>
                    <p>• Best upload times: Tue-Thu 2-4 PM</p>
                    <p>• Focus on retention in first 15 seconds</p>
                  </>
                )}
                {selectedPlatform?.id === 'tiktok' && (
                  <>
                    <p>• Hook viewers in first 3 seconds</p>
                    <p>• Use trending sounds and effects</p>
                    <p>• Post 3-4 times daily for growth</p>
                  </>
                )}
                {selectedPlatform?.id === 'twitch' && (
                  <>
                    <p>• Stream consistently same days/times</p>
                    <p>• Engage with chat every 30 seconds</p>
                    <p>• Host/raid others in your niche</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Selected Idea Detail Modal */}
      <AnimatePresence>
        {selectedIdea && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedIdea(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <CardTitle className="text-2xl mb-2">
                        {selectedIdea.title}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {selectedIdea.description}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIdea(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                  <Tabs defaultValue="overview" className="h-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="structure">Structure</TabsTrigger>
                      <TabsTrigger value="keywords">Keywords</TabsTrigger>
                      <TabsTrigger value="thumbnails">Thumbnails</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="mt-4 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Target Audience
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedIdea.targetAudience}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <Clock className="w-4 h-4 mr-2" />
                            Production Details
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            Time: {selectedIdea.productionTime}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Format: {selectedIdea.format}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Unique Angle
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedIdea.uniqueAngle}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center">
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Estimated Performance
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-muted">
                            <p className="text-sm font-medium">Views</p>
                            <p className="text-lg font-bold">
                              {selectedIdea.estimatedEngagement.views.min.toLocaleString()} - {' '}
                              {selectedIdea.estimatedEngagement.views.max.toLocaleString()}
                            </p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted">
                            <p className="text-sm font-medium">Engagement Rate</p>
                            <p className="text-lg font-bold">
                              {selectedIdea.estimatedEngagement.engagement.min}% - {' '}
                              {selectedIdea.estimatedEngagement.engagement.max}%
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-semibold">Content Hooks</h4>
                        <div className="space-y-2">
                          {selectedIdea.hooks.map((hook, index) => (
                            <div
                              key={index}
                              className="flex items-start justify-between p-3 rounded-lg bg-muted"
                            >
                              <p className="text-sm flex-1">{hook}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(hook, `hook-${index}`)}
                              >
                                {copiedId === `hook-${index}` ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="structure" className="mt-4 space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Content Structure
                          </h4>
                        </div>

                        <div className="space-y-3">
                          <div className="p-4 rounded-lg bg-muted">
                            <h5 className="font-medium mb-2">Introduction</h5>
                            <p className="text-sm text-muted-foreground">
                              {selectedIdea.contentStructure.introduction}
                            </p>
                          </div>

                          <div className="p-4 rounded-lg bg-muted">
                            <h5 className="font-medium mb-2">Main Points</h5>
                            <ul className="space-y-2">
                              {selectedIdea.contentStructure.mainPoints.map((point, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-sm text-muted-foreground">
                                    {index + 1}. {point}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="p-4 rounded-lg bg-muted">
                            <h5 className="font-medium mb-2">Call to Action</h5>
                            <p className="text-sm text-muted-foreground">
                              {selectedIdea.contentStructure.callToAction}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold">Required Resources</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedIdea.requiredResources.map((resource, index) => (
                              <Badge key={index} variant="outline">
                                {resource}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="keywords" className="mt-4 space-y-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <Hash className="w-4 h-4 mr-2" />
                            Keywords & Tags
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedIdea.keywords.map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => copyToClipboard(keyword, `keyword-${index}`)}
                              >
                                {copiedId === `keyword-${index}` ? (
                                  <Check className="w-3 h-3 mr-1" />
                                ) : (
                                  <Copy className="w-3 h-3 mr-1" />
                                )}
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-semibold flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Trending Topics to Include
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedIdea.trendingTopics.map((topic, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-muted flex items-center justify-between"
                              >
                                <span className="text-sm">{topic}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(topic, `trend-${index}`)}
                                >
                                  {copiedId === `trend-${index}` ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="thumbnails" className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center">
                          <Image className="w-4 h-4 mr-2" />
                          Thumbnail Concepts
                        </h4>
                        <div className="space-y-3">
                          {selectedIdea.thumbnailConcepts.map((concept, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-lg bg-muted space-y-2"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h5 className="font-medium mb-1">Concept {index + 1}</h5>
                                  <p className="text-sm text-muted-foreground">
                                    {concept}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(concept, `thumbnail-${index}`)}
                                >
                                  {copiedId === `thumbnail-${index}` ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}