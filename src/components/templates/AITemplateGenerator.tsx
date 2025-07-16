'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Download, 
  RefreshCw,
  Wand2,
  Settings2,
  Zap
} from 'lucide-react';
import { ContentGenerationType } from '@/lib/ai/types';

interface GeneratedContent {
  content: string;
  type: ContentGenerationType;
  metadata?: Record<string, any>;
}

interface AITemplateGeneratorProps {
  type: ContentGenerationType;
  platform?: string;
  niche?: string;
  onGenerated?: (content: GeneratedContent) => void;
}

export function AITemplateGenerator({ 
  type, 
  platform = 'youtube', 
  niche = 'general',
  onGenerated 
}: AITemplateGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Form state
  const [topic, setTopic] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'humorous' | 'educational' | 'inspirational'>('casual');
  const [keywords, setKeywords] = useState('');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [additionalContext, setAdditionalContext] = useState('');

  const handleGenerate = async () => {
    if (!topic) {
      toast.error('Please provide a topic for generation');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          context: {
            platform,
            niche,
            topic,
            targetAudience,
            tone,
            keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
            length,
            additionalContext,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate content');
      }

      const data = await response.json();
      const generated: GeneratedContent = {
        content: data.content,
        type,
        metadata: {
          platform,
          niche,
          topic,
          remainingCredits: data.remainingCredits,
        },
      };

      setGeneratedContent(generated);
      onGenerated?.(generated);

      toast.success('Content generated successfully!');
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Failed to generate content');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedContent) {
      navigator.clipboard.writeText(generatedContent.content);
      toast.success('Copied to clipboard!');
    }
  };

  const handleDownload = () => {
    if (generatedContent) {
      const blob = new Blob([generatedContent.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Downloaded!');
    }
  };

  const getContentTypeDisplay = () => {
    const displays: Record<ContentGenerationType, string> = {
      bio: 'Bio/About Section',
      'content-idea': 'Content Idea',
      caption: 'Caption',
      'script-outline': 'Script Outline',
      'thumbnail-concept': 'Thumbnail Concept',
      title: 'Title',
      description: 'Description',
      hashtags: 'Hashtags',
      hook: 'Hook',
      'call-to-action': 'Call to Action',
      'channel-description': 'Channel Description',
      'video-tags': 'Video Tags',
    };
    return displays[type] || type;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          AI {getContentTypeDisplay()} Generator
        </CardTitle>
        <CardDescription>
          Generate {getContentTypeDisplay().toLowerCase()} tailored to your {platform} content
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!generatedContent ? (
          <div className="space-y-4">
            {/* Main inputs */}
            <div className="space-y-2">
              <Label htmlFor="topic">Topic or Subject *</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={`What's your ${type === 'content-idea' ? 'content about' : 'topic'}?`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">Target Audience</Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Who is this for? (e.g., beginners, professionals)"
              />
            </div>

            <div className="space-y-2">
              <Label>Tone</Label>
              <RadioGroup value={tone} onValueChange={(v: any) => setTone(v)}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="casual" id="casual" />
                    <Label htmlFor="casual" className="cursor-pointer">Casual</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="professional" id="professional" />
                    <Label htmlFor="professional" className="cursor-pointer">Professional</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="humorous" id="humorous" />
                    <Label htmlFor="humorous" className="cursor-pointer">Humorous</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="educational" id="educational" />
                    <Label htmlFor="educational" className="cursor-pointer">Educational</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inspirational" id="inspirational" />
                    <Label htmlFor="inspirational" className="cursor-pointer">Inspirational</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Advanced options */}
            <div className="pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-between"
              >
                Advanced Options
                <Settings2 className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
              
              {showAdvanced && (
                <div className="space-y-4 mt-4 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                    <Input
                      id="keywords"
                      value={keywords}
                      onChange={(e) => setKeywords(e.target.value)}
                      placeholder="SEO, optimization, growth"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Length</Label>
                    <Select value={length} onValueChange={(v: any) => setLength(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="context">Additional Context</Label>
                    <Textarea
                      id="context"
                      value={additionalContext}
                      onChange={(e) => setAdditionalContext(e.target.value)}
                      placeholder="Any specific requirements or style notes..."
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Generate button */}
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating || !topic}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate {getContentTypeDisplay()}
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Generated content display */}
            <div className="relative p-4 bg-muted rounded-lg">
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-8 w-8"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="h-8 w-8"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans">
                  {generatedContent.content}
                </pre>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  <Zap className="mr-1 h-3 w-3" />
                  AI Generated
                </Badge>
                <span>{platform} • {niche}</span>
              </div>
              {generatedContent.metadata?.remainingCredits !== undefined && (
                <span>
                  Credits: {generatedContent.metadata.remainingCredits === 'unlimited' 
                    ? '∞' 
                    : generatedContent.metadata.remainingCredits}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setGeneratedContent(null);
                  setTopic('');
                }}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generate New
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Regenerate
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}