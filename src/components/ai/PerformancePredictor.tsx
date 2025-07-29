'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Users,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Target,
  Calendar,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Trophy,
  Lightbulb,
  Sparkles
} from 'lucide-react';
import { PerformancePrediction, OptimizationTip } from '@/lib/ai/performance-predictor';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { format } from 'date-fns';

export function PerformancePredictor() {
  const { selectedPlatform, selectedNiche } = useAppStore();
  const [activeTab, setActiveTab] = useState<'predict' | 'compare' | 'optimize'>('predict');
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Predict form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [contentType, setContentType] = useState('video');
  const [publishDate, setPublishDate] = useState('');
  const [tags, setTags] = useState('');

  // Compare state
  const [scenarios, setScenarios] = useState([
    { title: '', description: '', tags: '' },
    { title: '', description: '', tags: '' }
  ]);
  const [comparison, setComparison] = useState<any>(null);

  // Optimize state
  const [targetMetric, setTargetMetric] = useState<'views' | 'engagement' | 'retention' | 'growth'>('views');
  const [optimization, setOptimization] = useState<any>(null);

  const predictPerformance = async () => {
    if (!title || !selectedPlatform || !selectedNiche) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/performance/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          thumbnail: thumbnail || undefined,
          contentType,
          platform: selectedPlatform.id,
          niche: selectedNiche.id,
          publishDate: publishDate || undefined,
          tags: tags ? tags.split(',').map(t => t.trim()) : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to predict performance');

      const data = await response.json();
      setPrediction(data.prediction);
    } catch (error) {
      console.error('Error predicting performance:', error);
      setError('Failed to predict performance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const compareScenarios = async () => {
    const validScenarios = scenarios.filter(s => s.title);
    if (validScenarios.length < 2 || !selectedPlatform || !selectedNiche) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/performance/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarios: validScenarios.map(s => ({
            title: s.title,
            description: s.description || undefined,
            tags: s.tags ? s.tags.split(',').map(t => t.trim()) : undefined
          })),
          baseParams: {
            contentType,
            platform: selectedPlatform.id,
            niche: selectedNiche.id
          }
        })
      });

      if (!response.ok) throw new Error('Failed to compare scenarios');

      const data = await response.json();
      setComparison(data.comparison);
    } catch (error) {
      console.error('Error comparing scenarios:', error);
      setError('Failed to compare scenarios. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const optimizeContent = async () => {
    if (!title || !selectedPlatform || !selectedNiche) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/performance/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: {
            title,
            description: description || undefined,
            thumbnail: thumbnail || undefined,
            tags: tags ? tags.split(',').map(t => t.trim()) : undefined,
            contentType,
            platform: selectedPlatform.id,
            niche: selectedNiche.id
          },
          targetMetric
        })
      });

      if (!response.ok) throw new Error('Failed to optimize content');

      const data = await response.json();
      setOptimization(data.optimization);
    } catch (error) {
      console.error('Error optimizing content:', error);
      setError('Failed to optimize content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    if (score >= 40) return 'outline';
    return 'destructive';
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Performance Predictor</h2>
        <p className="text-muted-foreground">
          Predict content performance, compare scenarios, and get optimization recommendations
        </p>
      </div>

      {/* Platform & Niche Badges */}
      <div className="flex items-center space-x-2">
        <Badge variant="secondary">{selectedPlatform?.displayName}</Badge>
        <Badge variant="secondary">{selectedNiche?.displayName}</Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="predict">Predict</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
        </TabsList>

        {/* Predict Tab */}
        <TabsContent value="predict" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Prediction Form */}
            <Card>
              <CardHeader>
                <CardTitle>Content Details</CardTitle>
                <CardDescription>
                  Provide details about your content for performance prediction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Content Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your content title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter content description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                    placeholder="https://..."
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <Select value={contentType} onValueChange={setContentType}>
                    <SelectTrigger id="contentType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="short">Short/Reel</SelectItem>
                      <SelectItem value="live">Live Stream</SelectItem>
                      <SelectItem value="post">Post/Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishDate">Publish Date (Optional)</Label>
                  <Input
                    id="publishDate"
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="gaming, tutorial, tips..."
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={predictPerformance}
                  disabled={loading || !title}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Predicting...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Predict Performance
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Prediction Results */}
            {prediction && (
              <div className="space-y-4">
                {/* Overall Score */}
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-2">
                      <div className={cn(
                        "text-5xl font-bold",
                        getScoreColor(prediction.confidenceScore)
                      )}>
                        {prediction.confidenceScore}%
                      </div>
                      <p className="text-sm text-muted-foreground">Confidence Score</p>
                      <Badge 
                        variant={getScoreBadgeVariant(prediction.performance.viralityScore)}
                        className="mt-2"
                      >
                        Virality Score: {prediction.performance.viralityScore}/100
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Expected Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle>Expected Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Views</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatNumber(prediction.performance.expectedViews.min)} - {formatNumber(prediction.performance.expectedViews.max)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Avg: {formatNumber(prediction.performance.expectedViews.average)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Heart className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Likes</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatNumber(prediction.performance.expectedEngagement.likes.min)} - {formatNumber(prediction.performance.expectedEngagement.likes.max)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Comments</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatNumber(prediction.performance.expectedEngagement.comments.min)} - {formatNumber(prediction.performance.expectedEngagement.comments.max)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Subscriber Gain</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            +{prediction.performance.growthPotential.subscriberGain.min} - {prediction.performance.growthPotential.subscriberGain.max}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Factors Analysis */}
          {prediction && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Positive Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Positive Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prediction.factors.positive.map((factor, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{factor.factor}</p>
                          <Badge variant="secondary" className="text-xs">
                            +{factor.score}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{factor.explanation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Negative Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prediction.factors.negative.map((factor, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{factor.factor}</p>
                          <Badge variant="outline" className="text-xs">
                            {factor.score}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{factor.explanation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Opportunities */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {prediction.factors.opportunities.map((factor, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">{factor.factor}</p>
                          <Badge variant="secondary" className="text-xs">
                            +{factor.score}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{factor.explanation}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Optimization Tips */}
          {prediction && prediction.optimizationTips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {prediction.optimizationTips.map((tip, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="capitalize">
                          {tip.area}
                        </Badge>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-muted-foreground">Potential:</span>
                          <span className="font-medium text-green-600">
                            +{tip.estimatedImpact.views}% views
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-1">{tip.suggestion}</p>
                      <p className="text-xs text-muted-foreground">{tip.implementation}</p>
                      <div className="mt-2">
                        <Progress 
                          value={tip.potentialScore} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compare Scenarios</CardTitle>
              <CardDescription>
                Compare up to 5 different content scenarios to find the best performer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {scenarios.map((scenario, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Scenario {index + 1}</h4>
                    {scenarios.length < 5 && index === scenarios.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setScenarios([...scenarios, { title: '', description: '', tags: '' }])}
                      >
                        Add Scenario
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={scenario.title}
                        onChange={(e) => {
                          const newScenarios = [...scenarios];
                          newScenarios[index].title = e.target.value;
                          setScenarios(newScenarios);
                        }}
                        placeholder="Content title..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Input
                        value={scenario.description}
                        onChange={(e) => {
                          const newScenarios = [...scenarios];
                          newScenarios[index].description = e.target.value;
                          setScenarios(newScenarios);
                        }}
                        placeholder="Brief description..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tags</Label>
                      <Input
                        value={scenario.tags}
                        onChange={(e) => {
                          const newScenarios = [...scenarios];
                          newScenarios[index].tags = e.target.value;
                          setScenarios(newScenarios);
                        }}
                        placeholder="tag1, tag2..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                className="w-full"
                onClick={compareScenarios}
                disabled={loading || scenarios.filter(s => s.title).length < 2}
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Compare Scenarios
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Comparison Results */}
          {comparison && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    Best Performer: Scenario {comparison.winner + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comparison.scenarios.map((scenario: PerformancePrediction, index: number) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border",
                          index === comparison.winner && "border-yellow-500 bg-yellow-50/50"
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{scenario.title}</h4>
                            <p className="text-sm text-muted-foreground">Scenario {index + 1}</p>
                          </div>
                          <div className="text-right">
                            <div className={cn(
                              "text-2xl font-bold",
                              getScoreColor(scenario.confidenceScore)
                            )}>
                              {scenario.confidenceScore}%
                            </div>
                            <p className="text-xs text-muted-foreground">Confidence</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">Views</p>
                            <p className="font-medium">
                              {formatNumber(scenario.performance.expectedViews.average)}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Engagement</p>
                            <p className="font-medium">
                              {formatNumber(
                                (scenario.performance.expectedEngagement.likes.max +
                                scenario.performance.expectedEngagement.comments.max) / 2
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Virality</p>
                            <p className="font-medium">
                              {scenario.performance.viralityScore}/100
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Growth</p>
                            <p className="font-medium">
                              +{scenario.performance.growthPotential.subscriberGain.max}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {comparison.insights.map((insight: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <Sparkles className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Optimize Tab */}
        <TabsContent value="optimize" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Optimization Form */}
            <Card>
              <CardHeader>
                <CardTitle>Content to Optimize</CardTitle>
                <CardDescription>
                  Enter your current content details for optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opt-title">Content Title *</Label>
                  <Input
                    id="opt-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your content title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opt-description">Description</Label>
                  <Textarea
                    id="opt-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter content description..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opt-tags">Tags</Label>
                  <Input
                    id="opt-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="tag1, tag2, tag3..."
                  />
                </div>

                <div className="space-y-3">
                  <Label>Optimization Goal</Label>
                  <RadioGroup value={targetMetric} onValueChange={(value: any) => setTargetMetric(value)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="views" id="views" />
                      <Label htmlFor="views" className="cursor-pointer">
                        Maximize Views
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="engagement" id="engagement" />
                      <Label htmlFor="engagement" className="cursor-pointer">
                        Maximize Engagement
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="retention" id="retention" />
                      <Label htmlFor="retention" className="cursor-pointer">
                        Maximize Retention
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="growth" id="growth" />
                      <Label htmlFor="growth" className="cursor-pointer">
                        Maximize Growth
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button
                  className="w-full"
                  onClick={optimizeContent}
                  disabled={loading || !title}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Optimize Content
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Optimization Results */}
            {optimization && (
              <Card>
                <CardHeader>
                  <CardTitle>Optimization Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Improvements Summary */}
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Expected Improvements</h4>
                      <div className="space-y-1">
                        {optimization.improvements.map((imp: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="text-green-700">{imp.metric}</span>
                            <span className="font-medium text-green-900">
                              +{imp.increase}% ({imp.before} → {imp.after})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optimized Elements */}
                    {optimization.optimized.title && (
                      <div className="space-y-2">
                        <Label>Optimized Title</Label>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{optimization.optimized.title}</p>
                        </div>
                      </div>
                    )}

                    {optimization.optimized.description && (
                      <div className="space-y-2">
                        <Label>Optimized Description</Label>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm">{optimization.optimized.description}</p>
                        </div>
                      </div>
                    )}

                    {optimization.optimized.tags && (
                      <div className="space-y-2">
                        <Label>Optimized Tags</Label>
                        <div className="flex flex-wrap gap-2">
                          {optimization.optimized.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {optimization.optimized.timing && (
                      <div className="space-y-2">
                        <Label>Optimal Publishing Time</Label>
                        <div className="p-3 bg-muted rounded-lg flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {optimization.optimized.timing.dayOfWeek} at {optimization.optimized.timing.hourOfDay}:00
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}