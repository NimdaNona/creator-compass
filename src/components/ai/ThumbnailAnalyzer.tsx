'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Upload,
  Image as ImageIcon,
  Sparkles,
  BarChart3,
  AlertCircle,
  Check,
  X,
  TrendingUp,
  Eye,
  Type,
  Palette,
  Grid3x3,
  Zap,
  Download,
  RefreshCw,
  Trophy,
  Lightbulb,
  Target,
  Wand2
} from 'lucide-react';
import { ThumbnailAnalysis, GeneratedThumbnail } from '@/lib/ai/thumbnail-analyzer';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';

export function ThumbnailAnalyzer() {
  const { selectedPlatform } = useAppStore();
  const [activeTab, setActiveTab] = useState<'analyze' | 'generate' | 'compare'>('analyze');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ThumbnailAnalysis | null>(null);
  const [concepts, setConcepts] = useState<GeneratedThumbnail[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<GeneratedThumbnail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate form state
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState<'minimalist' | 'bold' | 'professional' | 'playful' | 'dramatic'>('bold');
  const [colorScheme, setColorScheme] = useState<'vibrant' | 'muted' | 'monochrome' | 'complementary' | 'analogous'>('vibrant');
  const [includeText, setIncludeText] = useState(true);
  const [includeFace, setIncludeFace] = useState(false);

  // Compare state
  const [compareImages, setCompareImages] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (activeTab === 'analyze') {
          setUploadedImage(result);
          setAnalysis(null);
        } else if (activeTab === 'compare') {
          setCompareImages(prev => [...prev, result].slice(0, 5));
        }
      };
      reader.readAsDataURL(file);
    }
  }, [activeTab]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    maxFiles: activeTab === 'compare' ? 5 : 1
  });

  const analyzeThumbnail = async () => {
    if (!uploadedImage || !selectedPlatform) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/thumbnails/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: uploadedImage,
          platform: selectedPlatform.id
        })
      });

      if (!response.ok) throw new Error('Failed to analyze thumbnail');

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error analyzing thumbnail:', error);
      setError('Failed to analyze thumbnail. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateConcepts = async () => {
    if (!title || !selectedPlatform) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/thumbnails/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          style,
          platform: selectedPlatform.id,
          elements: {
            includeText,
            includeFace,
            includeGraphics: true,
            includeBackground: true
          },
          colorScheme
        })
      });

      if (!response.ok) throw new Error('Failed to generate concepts');

      const data = await response.json();
      setConcepts(data.concepts);
    } catch (error) {
      console.error('Error generating concepts:', error);
      setError('Failed to generate concepts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const compareThumbnails = async () => {
    if (compareImages.length < 2 || !selectedPlatform) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/thumbnails/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thumbnailUrls: compareImages,
          platform: selectedPlatform.id
        })
      });

      if (!response.ok) throw new Error('Failed to compare thumbnails');

      const data = await response.json();
      setComparison(data.comparison);
    } catch (error) {
      console.error('Error comparing thumbnails:', error);
      setError('Failed to compare thumbnails. Please try again.');
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

  const getScoreBgColor = (score: number): string => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    if (score >= 40) return 'bg-orange-100';
    return 'bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Thumbnail Studio</h2>
        <p className="text-muted-foreground">
          Analyze, generate, and optimize thumbnails for maximum click-through rates
        </p>
      </div>

      {/* Platform Badge */}
      <div className="flex items-center space-x-2">
        <Badge variant="secondary">{selectedPlatform?.displayName}</Badge>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analyze">Analyze</TabsTrigger>
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="compare">Compare</TabsTrigger>
        </TabsList>

        {/* Analyze Tab */}
        <TabsContent value="analyze" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Thumbnail</CardTitle>
                  <CardDescription>
                    Upload a thumbnail to analyze its effectiveness
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                      isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25",
                      uploadedImage && "p-4"
                    )}
                  >
                    <input {...getInputProps()} />
                    {uploadedImage ? (
                      <div className="space-y-4">
                        <img
                          src={uploadedImage}
                          alt="Uploaded thumbnail"
                          className="w-full rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedImage(null);
                            setAnalysis(null);
                          }}
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">
                            {isDragActive ? 'Drop the image here' : 'Drag & drop or click to upload'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG, JPEG, WEBP up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {uploadedImage && !analysis && (
                    <Button
                      className="w-full mt-4"
                      onClick={analyzeThumbnail}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-4 h-4 mr-2" />
                          Analyze Thumbnail
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div className={cn(
                        "text-6xl font-bold",
                        getScoreColor(analysis.scores.overall)
                      )}>
                        {analysis.scores.overall}
                      </div>
                      <Progress value={analysis.scores.overall} className="h-3" />
                      <p className="text-sm text-muted-foreground">
                        {analysis.scores.overall >= 80 ? 'Excellent thumbnail!' :
                         analysis.scores.overall >= 60 ? 'Good, but room for improvement' :
                         analysis.scores.overall >= 40 ? 'Needs significant improvements' :
                         'Consider redesigning this thumbnail'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Scores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries({
                        'Eye-Catch Factor': { score: analysis.scores.eyeCatch, icon: Eye },
                        'Clarity': { score: analysis.scores.clarity, icon: Target },
                        'Emotion': { score: analysis.scores.emotion, icon: Sparkles },
                        'Text Readability': { score: analysis.scores.textReadability, icon: Type },
                        'Color Contrast': { score: analysis.scores.colorContrast, icon: Palette },
                        'Composition': { score: analysis.scores.composition, icon: Grid3x3 }
                      }).map(([name, { score, icon: Icon }]) => (
                        <div key={name} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{name}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Progress value={score} className="w-24 h-2" />
                            <span className={cn("text-sm font-medium w-8 text-right", getScoreColor(score))}>
                              {score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Recommendations */}
          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border",
                        rec.priority === 'high' && "border-red-200 bg-red-50",
                        rec.priority === 'medium' && "border-yellow-200 bg-yellow-50",
                        rec.priority === 'low' && "border-green-200 bg-green-50"
                      )}
                    >
                      <div className="flex items-start space-x-3">
                        <Badge
                          variant={rec.priority === 'high' ? 'destructive' : 
                                  rec.priority === 'medium' ? 'secondary' : 'outline'}
                          className="mt-0.5"
                        >
                          {rec.priority}
                        </Badge>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">{rec.suggestion}</p>
                          <p className="text-xs text-muted-foreground">{rec.impact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Generation Form */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Design Parameters</CardTitle>
                <CardDescription>
                  Configure your thumbnail design preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Content Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your content title..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">Design Style</Label>
                  <Select value={style} onValueChange={(value: any) => setStyle(value)}>
                    <SelectTrigger id="style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minimalist">Minimalist</SelectItem>
                      <SelectItem value="bold">Bold & Eye-catching</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="playful">Playful & Fun</SelectItem>
                      <SelectItem value="dramatic">Dramatic & Intense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="colorScheme">Color Scheme</Label>
                  <Select value={colorScheme} onValueChange={(value: any) => setColorScheme(value)}>
                    <SelectTrigger id="colorScheme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vibrant">Vibrant & Bright</SelectItem>
                      <SelectItem value="muted">Muted & Subtle</SelectItem>
                      <SelectItem value="monochrome">Monochrome</SelectItem>
                      <SelectItem value="complementary">Complementary</SelectItem>
                      <SelectItem value="analogous">Analogous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Elements to Include</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeText}
                        onChange={(e) => setIncludeText(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Text overlay</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includeFace}
                        onChange={(e) => setIncludeFace(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Human face/expression</span>
                    </label>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={generateConcepts}
                  disabled={loading || !title}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Generate Concepts
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Generated Concepts */}
            <div className="lg:col-span-2 space-y-4">
              {concepts.length > 0 ? (
                <>
                  <h3 className="text-lg font-semibold">Generated Concepts</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {concepts.map((concept) => (
                      <Card
                        key={concept.id}
                        className={cn(
                          "cursor-pointer transition-all",
                          selectedConcept?.id === concept.id && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedConcept(concept)}
                      >
                        <CardContent className="p-4">
                          <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-muted-foreground" />
                          </div>
                          <h4 className="font-medium text-sm mb-1">{concept.concept}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {concept.description}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Configure your design preferences and generate concepts
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Selected Concept Details */}
          {selectedConcept && (
            <Card>
              <CardHeader>
                <CardTitle>{selectedConcept.concept}</CardTitle>
                <CardDescription>{selectedConcept.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="layout">
                  <TabsList>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="production">Production</TabsTrigger>
                  </TabsList>

                  <TabsContent value="layout" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Background</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedConcept.layout.background.description}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Main Element</h4>
                        <p className="text-sm text-muted-foreground">
                          {selectedConcept.layout.foreground.mainElement} - {selectedConcept.layout.foreground.position}
                        </p>
                      </div>
                      {selectedConcept.layout.text && (
                        <div>
                          <h4 className="font-medium mb-2">Text</h4>
                          <p className="text-sm text-muted-foreground">
                            Primary: "{selectedConcept.layout.text.primary}"
                          </p>
                          {selectedConcept.layout.text.secondary && (
                            <p className="text-sm text-muted-foreground">
                              Secondary: "{selectedConcept.layout.text.secondary}"
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="colors" className="space-y-4">
                    <div className="grid grid-cols-5 gap-3">
                      {Object.entries(selectedConcept.colorPalette).map(([name, color]) => (
                        <div key={name} className="text-center">
                          <div
                            className="w-full aspect-square rounded-lg mb-2 border"
                            style={{ backgroundColor: color }}
                          />
                          <p className="text-xs font-medium capitalize">{name}</p>
                          <p className="text-xs text-muted-foreground">{color}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="production" className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium mb-2">Production Notes</h4>
                        <ul className="space-y-1">
                          {selectedConcept.productionNotes.map((note, index) => (
                            <li key={index} className="text-sm text-muted-foreground">
                              • {note}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Design Principles</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedConcept.designPrinciples.map((principle, index) => (
                            <Badge key={index} variant="secondary">
                              {principle}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Compare Tab */}
        <TabsContent value="compare" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Thumbnails to Compare</CardTitle>
              <CardDescription>
                Upload 2-5 thumbnails to compare their effectiveness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm">
                    {isDragActive ? 'Drop images here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {compareImages.length}/5 images uploaded
                  </p>
                </div>

                {compareImages.length > 0 && (
                  <div className="grid grid-cols-5 gap-3">
                    {compareImages.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full aspect-video object-cover rounded-lg"
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setCompareImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {compareImages.length >= 2 && (
                  <Button
                    className="w-full"
                    onClick={compareThumbnails}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Comparing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Compare Thumbnails
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comparison Results */}
          {comparison && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                    Winner: Thumbnail {comparison.rankings[0].rank}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {comparison.rankings.map((result: any, index: number) => (
                      <div
                        key={index}
                        className={cn(
                          "p-4 rounded-lg border",
                          result.rank === 1 && "border-yellow-500 bg-yellow-50"
                        )}
                      >
                        <div className="flex items-start space-x-4">
                          <img
                            src={result.url}
                            alt={`Thumbnail ${result.rank}`}
                            className="w-32 aspect-video object-cover rounded"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                Rank #{result.rank}
                              </h4>
                              <div className={cn(
                                "text-2xl font-bold",
                                getScoreColor(result.score)
                              )}>
                                {result.score}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="font-medium text-green-600 mb-1">Strengths</p>
                                <ul className="space-y-0.5">
                                  {result.strengths.map((strength: string, i: number) => (
                                    <li key={i} className="text-muted-foreground">• {strength}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="font-medium text-red-600 mb-1">Weaknesses</p>
                                <ul className="space-y-0.5">
                                  {result.weaknesses.map((weakness: string, i: number) => (
                                    <li key={i} className="text-muted-foreground">• {weakness}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Key Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {comparison.insights.map((insight: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}