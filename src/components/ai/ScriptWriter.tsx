'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText,
  Clock,
  Sparkles,
  Download,
  Copy,
  Check,
  RefreshCw,
  Play,
  Pause,
  SkipForward,
  ChevronRight,
  Mic,
  Video,
  Eye,
  MessageSquare,
  Zap,
  Target,
  AlertCircle,
  Settings,
  Wand2
} from 'lucide-react';
import { GeneratedScript, ScriptSection } from '@/lib/ai/script-writer';
import { cn } from '@/lib/utils';

interface ScriptWriterProps {
  ideaTitle?: string;
  ideaDescription?: string;
}

export function ScriptWriter({ ideaTitle, ideaDescription }: ScriptWriterProps) {
  const { selectedPlatform } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [script, setScript] = useState<GeneratedScript | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState(0);
  
  // Form state
  const [topic, setTopic] = useState(ideaTitle || '');
  const [duration, setDuration] = useState(300); // 5 minutes default
  const [style, setStyle] = useState<'casual' | 'professional' | 'energetic' | 'educational' | 'inspirational'>('casual');
  const [targetAudience, setTargetAudience] = useState('');
  const [outline, setOutline] = useState('');
  const [keywords, setKeywords] = useState('');
  const [includeHooks, setIncludeHooks] = useState(true);
  const [includeCTA, setIncludeCTA] = useState(true);

  const generateScript = async () => {
    if (!selectedPlatform || !topic) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/scripts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform.id,
          topic,
          duration,
          style,
          targetAudience: targetAudience || undefined,
          outline: outline ? outline.split('\n').filter(l => l.trim()) : undefined,
          keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
          includeHooks,
          includeCTA
        })
      });

      if (!response.ok) throw new Error('Failed to generate script');

      const data = await response.json();
      setScript(data.script);
      setActiveSection(0);
    } catch (error) {
      console.error('Error generating script:', error);
      setError('Failed to generate script. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const optimizeScript = async (type: 'engagement' | 'retention' | 'conversion') => {
    if (!script) return;

    setOptimizing(true);

    try {
      const response = await fetch(`/api/ai/scripts/${script.id}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optimizationType: type })
      });

      if (!response.ok) throw new Error('Failed to optimize script');

      const data = await response.json();
      setScript(data.script);
    } catch (error) {
      console.error('Error optimizing script:', error);
      setError('Failed to optimize script. Please try again.');
    } finally {
      setOptimizing(false);
    }
  };

  const exportScript = async (format: 'text' | 'teleprompter') => {
    if (!script) return;

    try {
      const response = await fetch(`/api/ai/scripts/${script.id}/export?format=${format}`);
      if (!response.ok) throw new Error('Failed to export script');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `script-${script.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting script:', error);
      setError('Failed to export script. Please try again.');
    }
  };

  const copyToClipboard = async (text: string, sectionId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const getSectionIcon = (type: string) => {
    const icons = {
      hook: Zap,
      intro: Play,
      main: FileText,
      transition: SkipForward,
      cta: Target,
      outro: Pause
    };
    return icons[type as keyof typeof icons] || FileText;
  };

  const getPlatformDurationLimits = () => {
    switch (selectedPlatform?.id) {
      case 'youtube':
        return { min: 15, max: 3600, step: 15, default: 480 };
      case 'tiktok':
        return { min: 15, max: 180, step: 15, default: 60 };
      case 'twitch':
        return { min: 300, max: 14400, step: 300, default: 3600 };
      default:
        return { min: 30, max: 1800, step: 30, default: 300 };
    }
  };

  const durationLimits = getPlatformDurationLimits();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Script Writer</h2>
        <p className="text-muted-foreground">
          Generate platform-optimized scripts with AI assistance
        </p>
      </div>

      {/* Script Generation Form */}
      {!script && (
        <Card>
          <CardHeader>
            <CardTitle>Create Your Script</CardTitle>
            <CardDescription>
              Fill in the details below to generate a custom script
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic">Topic or Title</Label>
                <Input
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What's your content about?"
                  disabled={loading}
                />
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Input
                  id="audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Who are you speaking to?"
                  disabled={loading}
                />
              </div>

              {/* Style */}
              <div className="space-y-2">
                <Label htmlFor="style">Script Style</Label>
                <Select value={style} onValueChange={(value: any) => setStyle(value)} disabled={loading}>
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual & Conversational</SelectItem>
                    <SelectItem value="professional">Professional & Polished</SelectItem>
                    <SelectItem value="energetic">Energetic & Exciting</SelectItem>
                    <SelectItem value="educational">Educational & Informative</SelectItem>
                    <SelectItem value="inspirational">Inspirational & Motivating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration */}
              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration: {formatDuration(duration)}
                </Label>
                <Slider
                  id="duration"
                  value={[duration]}
                  onValueChange={([value]) => setDuration(value)}
                  min={durationLimits.min}
                  max={durationLimits.max}
                  step={durationLimits.step}
                  disabled={loading}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatDuration(durationLimits.min)}</span>
                  <span>{formatDuration(durationLimits.max)}</span>
                </div>
              </div>
            </div>

            {/* Outline */}
            <div className="space-y-2">
              <Label htmlFor="outline">Content Outline (Optional)</Label>
              <Textarea
                id="outline"
                value={outline}
                onChange={(e) => setOutline(e.target.value)}
                placeholder="Enter main points, one per line..."
                rows={4}
                disabled={loading}
              />
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (Optional)</Label>
              <Input
                id="keywords"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Enter keywords separated by commas..."
                disabled={loading}
              />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="hooks">Include Attention Hooks</Label>
                  <p className="text-sm text-muted-foreground">
                    Add compelling hooks to capture viewer attention
                  </p>
                </div>
                <Switch
                  id="hooks"
                  checked={includeHooks}
                  onCheckedChange={setIncludeHooks}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="cta">Include Call-to-Actions</Label>
                  <p className="text-sm text-muted-foreground">
                    Add strategic CTAs for engagement and growth
                  </p>
                </div>
                <Switch
                  id="cta"
                  checked={includeCTA}
                  onCheckedChange={setIncludeCTA}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Generate Button */}
            <Button 
              onClick={generateScript}
              disabled={loading || !topic || !selectedPlatform}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generating Script...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Script
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Generated Script Display */}
      {script && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Script Content */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{script.title}</CardTitle>
                    <CardDescription>
                      {formatDuration(script.totalDuration)} • {script.format} • {script.metadata.wordCount} words
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => exportScript('text')}
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Export
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setScript(null)}
                    >
                      New Script
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="script" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="script">Script</TabsTrigger>
                    <TabsTrigger value="teleprompter">Teleprompter</TabsTrigger>
                    <TabsTrigger value="notes">Notes & Tips</TabsTrigger>
                  </TabsList>

                  <TabsContent value="script">
                    <ScrollArea className="h-[600px] pr-4">
                      <div className="space-y-4">
                        {script.sections.map((section, index) => {
                          const Icon = getSectionIcon(section.type);
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={cn(
                                "p-4 rounded-lg border transition-all cursor-pointer",
                                activeSection === index
                                  ? "border-primary bg-primary/5"
                                  : "hover:border-primary/50"
                              )}
                              onClick={() => setActiveSection(index)}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Icon className="w-4 h-4 text-primary" />
                                    <span className="font-medium capitalize">
                                      {section.type}
                                    </span>
                                    {section.duration && (
                                      <Badge variant="secondary" className="text-xs">
                                        {section.duration}s
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(section.content, `section-${index}`);
                                    }}
                                  >
                                    {copiedSection === `section-${index}` ? (
                                      <Check className="w-3 h-3" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>

                                <p className="text-sm whitespace-pre-wrap">
                                  {section.content}
                                </p>

                                {section.notes && section.notes.length > 0 && (
                                  <div className="space-y-1 pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground">Notes:</p>
                                    {section.notes.map((note, noteIndex) => (
                                      <p key={noteIndex} className="text-xs text-muted-foreground">
                                        • {note}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {section.visualCues && section.visualCues.length > 0 && (
                                  <div className="space-y-1 pt-2 border-t">
                                    <p className="text-xs font-medium text-muted-foreground flex items-center">
                                      <Eye className="w-3 h-3 mr-1" />
                                      Visual Cues:
                                    </p>
                                    {section.visualCues.map((cue, cueIndex) => (
                                      <p key={cueIndex} className="text-xs text-muted-foreground">
                                        • {cue}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="teleprompter">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Optimized for teleprompter reading
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => exportScript('teleprompter')}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Export Teleprompter
                        </Button>
                      </div>
                      <ScrollArea className="h-[500px] pr-4">
                        <div className="space-y-6 text-lg leading-relaxed font-medium">
                          {script.sections.map((section, index) => (
                            <div key={index} className="space-y-4">
                              <p className="text-sm text-muted-foreground uppercase">
                                [{section.type}]
                              </p>
                              <div className="space-y-3">
                                {section.content.split(/(?<=[.!?])\s+/).map((sentence, sentIndex) => (
                                  <p key={sentIndex} className="text-foreground">
                                    {sentence}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>

                  <TabsContent value="notes">
                    <ScrollArea className="h-[500px] pr-4">
                      <div className="space-y-6">
                        {/* Speaking Notes */}
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center">
                            <Mic className="w-4 h-4 mr-2" />
                            Speaking Tips
                          </h4>
                          {script.speakingNotes.map((note, index) => (
                            <div key={index} className="p-3 rounded-lg bg-muted">
                              <p className="text-sm font-medium">{note.section}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {note.tip}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Platform Optimizations */}
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            Platform Optimizations
                          </h4>
                          {script.platformOptimizations.map((opt, index) => (
                            <div key={index} className="p-3 rounded-lg bg-muted">
                              <p className="text-sm font-medium">{opt.feature}</p>
                              <p className="text-sm text-muted-foreground mt-1">
                                {opt.description}
                              </p>
                              <p className="text-xs text-primary mt-2">
                                {opt.implementation}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Call to Actions */}
                        <div className="space-y-3">
                          <h4 className="font-semibold flex items-center">
                            <Target className="w-4 h-4 mr-2" />
                            Call to Actions
                          </h4>
                          <div className="space-y-2">
                            {script.callToActions.map((cta, index) => (
                              <div
                                key={index}
                                className="p-3 rounded-lg bg-muted flex items-center justify-between"
                              >
                                <p className="text-sm">{cta}</p>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => copyToClipboard(cta, `cta-${index}`)}
                                >
                                  {copiedSection === `cta-${index}` ? (
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
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Script Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Script Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Platform</span>
                  <Badge variant="secondary">{selectedPlatform?.displayName}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Style</span>
                  <span className="text-sm font-medium capitalize">{script.tone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pacing</span>
                  <span className="text-sm font-medium capitalize">{script.pacing}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Complexity</span>
                  <span className="text-sm font-medium capitalize">{script.metadata.complexity}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reading Time</span>
                  <span className="text-sm font-medium">
                    {Math.ceil(script.metadata.readingTime / 60)} min
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Optimization Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  Script Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => optimizeScript('engagement')}
                  disabled={optimizing}
                >
                  <MessageSquare className="w-3 h-3 mr-2" />
                  Optimize for Engagement
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => optimizeScript('retention')}
                  disabled={optimizing}
                >
                  <Eye className="w-3 h-3 mr-2" />
                  Optimize for Retention
                </Button>
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  size="sm"
                  onClick={() => optimizeScript('conversion')}
                  disabled={optimizing}
                >
                  <Target className="w-3 h-3 mr-2" />
                  Optimize for Conversion
                </Button>
              </CardContent>
            </Card>

            {/* Keywords */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {script.keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => copyToClipboard(keyword, `keyword-${index}`)}
                    >
                      {copiedSection === `keyword-${index}` ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : null}
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}