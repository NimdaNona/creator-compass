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
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Flask,
  TrendingUp,
  BarChart3,
  Target,
  Beaker,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  RefreshCw,
  FileText,
  Zap,
  ArrowRight,
  Activity,
  Trophy,
  Layers,
  GitBranch,
  Sparkles,
  Calculator,
  Calendar
} from 'lucide-react';
import { ABTestRecommendation, TestResult, OptimizationPath } from '@/lib/ai/ab-testing-advisor';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export function ABTestingAdvisor() {
  const { selectedPlatform, selectedNiche } = useAppStore();
  const [activeTab, setActiveTab] = useState<'recommendations' | 'analyze' | 'optimization'>('recommendations');
  const [recommendations, setRecommendations] = useState<ABTestRecommendation[]>([]);
  const [selectedTest, setSelectedTest] = useState<ABTestRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recommendations form state
  const [contentType, setContentType] = useState('video');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [currentViews, setCurrentViews] = useState('');
  const [currentEngagement, setCurrentEngagement] = useState('');
  const [currentRetention, setCurrentRetention] = useState('');
  const [goals, setGoals] = useState('');

  // Analysis form state
  const [testId, setTestId] = useState('');
  const [variants, setVariants] = useState([
    { name: 'Control', views: '', engagement: '', retention: '', sampleSize: '' },
    { name: 'Variant A', views: '', engagement: '', retention: '', sampleSize: '' }
  ]);
  const [testDuration, setTestDuration] = useState('7');
  const [analysisResult, setAnalysisResult] = useState<TestResult | null>(null);

  // Optimization form state
  const [targetViews, setTargetViews] = useState('');
  const [targetEngagement, setTargetEngagement] = useState('');
  const [targetRetention, setTargetRetention] = useState('');
  const [timeframe, setTimeframe] = useState('90');
  const [optimizationPath, setOptimizationPath] = useState<OptimizationPath | null>(null);

  const generateRecommendations = async () => {
    if (!selectedPlatform || !selectedNiche) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/ab-testing/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentType,
          title: title || undefined,
          description: description || undefined,
          currentMetrics: currentViews ? {
            views: parseInt(currentViews),
            engagement: parseFloat(currentEngagement || '0'),
            retention: parseFloat(currentRetention || '0')
          } : undefined,
          platform: selectedPlatform.id,
          niche: selectedNiche.id,
          goals: goals ? goals.split(',').map(g => g.trim()) : undefined
        })
      });

      if (!response.ok) throw new Error('Failed to generate recommendations');

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      setError('Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const analyzeResults = async () => {
    if (!testId || variants.filter(v => v.views && v.sampleSize).length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/ab-testing/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testId,
          variants: variants
            .filter(v => v.views && v.sampleSize)
            .map(v => ({
              name: v.name,
              metrics: {
                views: parseInt(v.views),
                engagement: parseFloat(v.engagement || '0'),
                retention: parseFloat(v.retention || '0')
              },
              sampleSize: parseInt(v.sampleSize)
            })),
          duration: parseInt(testDuration)
        })
      });

      if (!response.ok) throw new Error('Failed to analyze results');

      const data = await response.json();
      setAnalysisResult(data.analysis);
    } catch (error) {
      console.error('Error analyzing results:', error);
      setError('Failed to analyze results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateOptimizationPath = async () => {
    if (!title || !currentViews || !selectedPlatform || !selectedNiche) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/ab-testing/optimization-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentContent: {
            title,
            description: description || undefined,
            metrics: {
              views: parseInt(currentViews),
              engagement: parseFloat(currentEngagement || '0'),
              retention: parseFloat(currentRetention || '0')
            }
          },
          goals: {
            targetViews: targetViews ? parseInt(targetViews) : undefined,
            targetEngagement: targetEngagement ? parseFloat(targetEngagement) : undefined,
            targetRetention: targetRetention ? parseFloat(targetRetention) : undefined,
            timeframe: parseInt(timeframe)
          },
          platform: selectedPlatform.id,
          niche: selectedNiche.id
        })
      });

      if (!response.ok) throw new Error('Failed to generate optimization path');

      const data = await response.json();
      setOptimizationPath(data.optimizationPath);
    } catch (error) {
      console.error('Error generating optimization path:', error);
      setError('Failed to generate optimization path. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadgeVariant = (priority: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'medium': return <Activity className="w-4 h-4" />;
      case 'low': return <BarChart3 className="w-4 h-4" />;
      default: return null;
    }
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
        <h2 className="text-2xl font-bold mb-2">A/B Testing Advisor</h2>
        <p className="text-muted-foreground">
          Get data-driven test recommendations, analyze results, and create optimization roadmaps
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
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analyze">Analyze Results</TabsTrigger>
          <TabsTrigger value="optimization">Optimization Path</TabsTrigger>
        </TabsList>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recommendation Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Test Parameters</CardTitle>
                <CardDescription>
                  Provide details about your content for personalized test recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type</Label>
                  <select
                    id="contentType"
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="video">Video</option>
                    <option value="short">Short/Reel</option>
                    <option value="live">Live Stream</option>
                    <option value="post">Post/Update</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Content Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter content title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Current Metrics (Optional)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Views"
                      value={currentViews}
                      onChange={(e) => setCurrentViews(e.target.value)}
                      type="number"
                    />
                    <Input
                      placeholder="Engage %"
                      value={currentEngagement}
                      onChange={(e) => setCurrentEngagement(e.target.value)}
                      type="number"
                      step="0.1"
                    />
                    <Input
                      placeholder="Retain %"
                      value={currentRetention}
                      onChange={(e) => setCurrentRetention(e.target.value)}
                      type="number"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">Goals (comma-separated)</Label>
                  <Input
                    id="goals"
                    value={goals}
                    onChange={(e) => setGoals(e.target.value)}
                    placeholder="increase views, improve CTR..."
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={generateRecommendations}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Flask className="w-4 h-4 mr-2" />
                      Generate Recommendations
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="lg:col-span-2 space-y-4">
              {recommendations.length > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Recommended Tests</h3>
                    <Badge variant="secondary">{recommendations.length} tests</Badge>
                  </div>
                  
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                      {recommendations.map((test, index) => (
                        <Card
                          key={test.id}
                          className={cn(
                            "cursor-pointer transition-colors",
                            selectedTest?.id === test.id && "border-primary"
                          )}
                          onClick={() => setSelectedTest(test)}
                        >
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">{test.testName}</CardTitle>
                                <CardDescription>{test.description}</CardDescription>
                              </div>
                              <Badge variant={getPriorityBadgeVariant(test.priority)}>
                                {test.priority}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Duration</p>
                                <p className="font-medium">{test.estimatedDuration} days</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Sample Size</p>
                                <p className="font-medium">{formatNumber(test.minimumSampleSize)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Variables</p>
                                <p className="font-medium">{test.variables.length}</p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center text-sm text-muted-foreground">
                              <Target className="w-4 h-4 mr-1" />
                              Primary: {test.successMetrics.primary}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Flask className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">No recommendations yet</p>
                    <p className="text-sm text-muted-foreground text-center">
                      Fill in the test parameters to get personalized A/B test recommendations
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Selected Test Details */}
          {selectedTest && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {selectedTest.testName}
                  <Badge variant={getPriorityBadgeVariant(selectedTest.priority)}>
                    {selectedTest.priority} priority
                  </Badge>
                </CardTitle>
                <CardDescription>{selectedTest.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="variables">
                  <TabsList>
                    <TabsTrigger value="variables">Variables</TabsTrigger>
                    <TabsTrigger value="methodology">Methodology</TabsTrigger>
                    <TabsTrigger value="implementation">Implementation</TabsTrigger>
                    <TabsTrigger value="risks">Risks</TabsTrigger>
                  </TabsList>

                  <TabsContent value="variables" className="space-y-4">
                    {selectedTest.variables.map((variable, index) => (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center">
                            {getImpactIcon(variable.impact)}
                            <span className="ml-2">{variable.name}</span>
                          </h4>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary">
                              {variable.impact} impact
                            </Badge>
                            <Badge variant="outline">
                              {variable.difficulty} setup
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{variable.description}</p>
                        
                        <div className="space-y-2">
                          {variable.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="p-3 bg-muted/30 rounded-lg">
                              <p className="font-medium text-sm">{option.value}</p>
                              <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                              <p className="text-xs italic mt-2">Hypothesis: {option.hypothesis}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {option.expectedImpact.map((impact, impactIndex) => (
                                  <Badge key={impactIndex} variant="outline" className="text-xs">
                                    {impact.metric}: {impact.change} ({impact.confidence}% conf)
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="methodology" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Test Setup</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Split Type:</span>
                            <span className="font-medium">{selectedTest.methodology.splitType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Control Group:</span>
                            <span className="font-medium">{selectedTest.methodology.controlGroup}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">{selectedTest.estimatedDuration} days</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Min Sample:</span>
                            <span className="font-medium">{formatNumber(selectedTest.minimumSampleSize)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Success Metrics</h4>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Primary:</span>
                            <p className="font-medium">{selectedTest.successMetrics.primary}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Secondary:</span>
                            <ul className="mt-1 space-y-1">
                              {selectedTest.successMetrics.secondary.map((metric, index) => (
                                <li key={index} className="font-medium">• {metric}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Min Detectable Effect:</span>
                            <p className="font-medium">{selectedTest.successMetrics.minimumDetectableEffect}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="implementation" className="space-y-3">
                    {selectedTest.implementation.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{step.step}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                          {step.tools && step.tools.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {step.tools.map((tool, toolIndex) => (
                                <Badge key={toolIndex} variant="outline" className="text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {step.timeEstimate && (
                            <p className="text-xs text-muted-foreground mt-2">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {step.timeEstimate}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="risks" className="space-y-3">
                    {selectedTest.risks.map((risk, index) => (
                      <Alert key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <div className="ml-2">
                          <h4 className="font-medium">{risk.type}</h4>
                          <AlertDescription className="mt-1">
                            <p className="text-sm">{risk.description}</p>
                            <p className="text-sm mt-2">
                              <strong>Mitigation:</strong> {risk.mitigation}
                            </p>
                          </AlertDescription>
                        </div>
                      </Alert>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analyze Results Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Analysis Form */}
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Enter your A/B test results for statistical analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testId">Test ID</Label>
                  <Input
                    id="testId"
                    value={testId}
                    onChange={(e) => setTestId(e.target.value)}
                    placeholder="Enter test identifier..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Test Duration (days)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={testDuration}
                    onChange={(e) => setTestDuration(e.target.value)}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Variants</Label>
                    {variants.length < 5 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setVariants([...variants, { 
                          name: `Variant ${String.fromCharCode(65 + variants.length - 1)}`, 
                          views: '', 
                          engagement: '', 
                          retention: '', 
                          sampleSize: '' 
                        }])}
                      >
                        Add Variant
                      </Button>
                    )}
                  </div>

                  {variants.map((variant, index) => (
                    <div key={index} className="p-3 border rounded-lg space-y-3">
                      <Input
                        value={variant.name}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[index].name = e.target.value;
                          setVariants(newVariants);
                        }}
                        placeholder="Variant name..."
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Views"
                          value={variant.views}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].views = e.target.value;
                            setVariants(newVariants);
                          }}
                        />
                        <Input
                          type="number"
                          placeholder="Sample Size"
                          value={variant.sampleSize}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].sampleSize = e.target.value;
                            setVariants(newVariants);
                          }}
                        />
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Engagement %"
                          value={variant.engagement}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].engagement = e.target.value;
                            setVariants(newVariants);
                          }}
                        />
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Retention %"
                          value={variant.retention}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].retention = e.target.value;
                            setVariants(newVariants);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={analyzeResults}
                  disabled={loading || !testId || variants.filter(v => v.views && v.sampleSize).length < 2}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Analyze Results
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            {analysisResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Test Analysis
                    <Badge variant="default" className="text-base">
                      <Trophy className="w-4 h-4 mr-1" />
                      Winner: {analysisResult.variant}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Metrics Comparison */}
                    <div className="space-y-3">
                      <h4 className="font-medium">Performance Metrics</h4>
                      {analysisResult.metrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <p className="font-medium">{metric.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {metric.significant ? (
                                <CheckCircle className="w-3 h-3 inline mr-1 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-600" />
                              )}
                              {metric.significant ? 'Statistically significant' : 'Not significant'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{metric.value}</p>
                            <p className={cn(
                              "text-sm font-medium",
                              metric.change > 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {metric.change > 0 ? '+' : ''}{metric.change}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {metric.confidence}% confidence
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Insights */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Key Insights</h4>
                      <ul className="space-y-2">
                        {analysisResult.insights.map((insight, index) => (
                          <li key={index} className="flex items-start">
                            <Sparkles className="w-4 h-4 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Sample Size</p>
                        <p className="text-lg font-medium">{formatNumber(analysisResult.sampleSize)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Test Duration</p>
                        <p className="text-lg font-medium">{analysisResult.duration} days</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Optimization Path Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Optimization Form */}
            <Card>
              <CardHeader>
                <CardTitle>Current & Target</CardTitle>
                <CardDescription>
                  Define your current performance and goals
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="opt-title">Content Title *</Label>
                  <Input
                    id="opt-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter content title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="opt-description">Description</Label>
                  <Textarea
                    id="opt-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description..."
                    rows={2}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Current Metrics *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Views"
                      value={currentViews}
                      onChange={(e) => setCurrentViews(e.target.value)}
                      type="number"
                    />
                    <Input
                      placeholder="Engage %"
                      value={currentEngagement}
                      onChange={(e) => setCurrentEngagement(e.target.value)}
                      type="number"
                      step="0.1"
                    />
                    <Input
                      placeholder="Retain %"
                      value={currentRetention}
                      onChange={(e) => setCurrentRetention(e.target.value)}
                      type="number"
                      step="0.1"
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Target Goals</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Views"
                      value={targetViews}
                      onChange={(e) => setTargetViews(e.target.value)}
                      type="number"
                    />
                    <Input
                      placeholder="Engage %"
                      value={targetEngagement}
                      onChange={(e) => setTargetEngagement(e.target.value)}
                      type="number"
                      step="0.1"
                    />
                    <Input
                      placeholder="Retain %"
                      value={targetRetention}
                      onChange={(e) => setTargetRetention(e.target.value)}
                      type="number"
                      step="0.1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeframe">Timeframe (days)</Label>
                  <Input
                    id="timeframe"
                    type="number"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={generateOptimizationPath}
                  disabled={loading || !title || !currentViews}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <GitBranch className="w-4 h-4 mr-2" />
                      Generate Path
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Optimization Path Results */}
            {optimizationPath && (
              <div className="lg:col-span-2 space-y-4">
                {/* Projected Outcomes */}
                <Card>
                  <CardHeader>
                    <CardTitle>Projected Outcomes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Realistic Scenario</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Views</span>
                            <span className="font-medium">
                              {formatNumber(optimizationPath.projectedOutcome.realistic.views)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Engagement</span>
                            <span className="font-medium">
                              {optimizationPath.projectedOutcome.realistic.engagement}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Retention</span>
                            <span className="font-medium">
                              {optimizationPath.projectedOutcome.realistic.retention}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm text-muted-foreground">Best Case Scenario</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm">Views</span>
                            <span className="font-medium text-green-600">
                              {formatNumber(optimizationPath.projectedOutcome.bestCase.views)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Engagement</span>
                            <span className="font-medium text-green-600">
                              {optimizationPath.projectedOutcome.bestCase.engagement}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Retention</span>
                            <span className="font-medium text-green-600">
                              {optimizationPath.projectedOutcome.bestCase.retention}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Time to Achieve</span>
                        <span className="font-medium flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {optimizationPath.projectedOutcome.timeToAchieve} days
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Optimization Roadmap */}
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Roadmap</CardTitle>
                    <CardDescription>
                      Step-by-step testing phases to reach your goals
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {optimizationPath.roadmap.map((phase, index) => (
                        <div key={index} className="relative">
                          {index < optimizationPath.roadmap.length - 1 && (
                            <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-border" />
                          )}
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                              {phase.phase}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{phase.name}</h4>
                                <Badge variant="outline">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {phase.duration} days
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {phase.expectedImprovement}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {phase.tests.map((testName, testIndex) => (
                                  <Badge key={testIndex} variant="secondary" className="text-xs">
                                    {testName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Tests */}
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="tests">
                    <AccordionTrigger>
                      View All {optimizationPath.recommendedTests.length} Recommended Tests
                    </AccordionTrigger>
                    <AccordionContent>
                      <ScrollArea className="h-[400px]">
                        <div className="space-y-3 pr-4">
                          {optimizationPath.recommendedTests.map((test, index) => (
                            <Card key={test.id}>
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">{test.testName}</CardTitle>
                                  <Badge variant={getPriorityBadgeVariant(test.priority)}>
                                    {test.priority}
                                  </Badge>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">{test.description}</p>
                                <div className="flex items-center space-x-4 text-sm">
                                  <span className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {test.estimatedDuration}d
                                  </span>
                                  <span className="flex items-center">
                                    <Users className="w-3 h-3 mr-1" />
                                    {formatNumber(test.minimumSampleSize)}
                                  </span>
                                  <span className="flex items-center">
                                    <Layers className="w-3 h-3 mr-1" />
                                    {test.variables.length} vars
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
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