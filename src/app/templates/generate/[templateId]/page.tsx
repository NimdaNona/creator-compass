'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { AITemplateGenerator } from '@/components/templates/AITemplateGenerator';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  History, 
  Star,
  Wand2,
  Clock,
  Target,
  Zap
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ContentGenerationType } from '@/lib/ai/types';

// Template type mapping
const templateTypeMap: Record<string, ContentGenerationType[]> = {
  'content-calendar': ['content-idea', 'title', 'description', 'hashtags'],
  'video-script': ['script-outline', 'hook', 'call-to-action'],
  'social-post': ['caption', 'hashtags', 'call-to-action'],
  'thumbnail-ideas': ['thumbnail-concept', 'title'],
  'channel-branding': ['bio', 'channel-description', 'video-tags'],
  'content-series': ['content-idea', 'title', 'description'],
  'viral-hooks': ['hook', 'title', 'thumbnail-concept'],
  'audience-engagement': ['caption', 'call-to-action', 'hashtags'],
};

// Template info
const templateInfo: Record<string, { name: string; description: string; tips: string[] }> = {
  'content-calendar': {
    name: 'Content Calendar',
    description: 'Generate a complete content calendar with ideas, titles, and descriptions',
    tips: [
      'Start with broad topics and let AI refine them',
      'Consider seasonal trends and events',
      'Mix different content types for variety',
    ],
  },
  'video-script': {
    name: 'Video Script',
    description: 'Create engaging video scripts with hooks and CTAs',
    tips: [
      'Focus on a strong hook in the first 3 seconds',
      'Keep your target audience in mind',
      'End with a clear call-to-action',
    ],
  },
  'social-post': {
    name: 'Social Media Post',
    description: 'Craft compelling social media posts with optimized captions',
    tips: [
      'Use platform-specific best practices',
      'Include relevant hashtags for discovery',
      'Keep captions concise but engaging',
    ],
  },
  'thumbnail-ideas': {
    name: 'Thumbnail Concepts',
    description: 'Generate eye-catching thumbnail ideas and titles',
    tips: [
      'Use contrasting colors and clear text',
      'Include emotional expressions when relevant',
      'Test different concepts for best CTR',
    ],
  },
  'channel-branding': {
    name: 'Channel Branding',
    description: 'Create consistent branding elements for your channel',
    tips: [
      'Maintain consistent tone across all elements',
      'Highlight your unique value proposition',
      'Use keywords for better discoverability',
    ],
  },
  'content-series': {
    name: 'Content Series',
    description: 'Plan engaging content series with connected themes',
    tips: [
      'Create a consistent format for recognition',
      'Plan 5-10 episodes in advance',
      'Leave room for audience feedback',
    ],
  },
  'viral-hooks': {
    name: 'Viral Hooks',
    description: 'Generate attention-grabbing hooks for viral potential',
    tips: [
      'Create curiosity gaps',
      'Use pattern interrupts',
      'Test multiple variations',
    ],
  },
  'audience-engagement': {
    name: 'Audience Engagement',
    description: 'Build community with engagement-focused content',
    tips: [
      'Ask questions to encourage comments',
      'Create content that sparks discussion',
      'Respond to comments promptly',
    ],
  },
};

interface GeneratedItem {
  type: ContentGenerationType;
  content: string;
  timestamp: Date;
}

export default function TemplateGeneratorPage({
  params,
}: {
  params: { templateId: string };
}) {
  const router = useRouter();
  const { selectedPlatform, subscription } = useAppStore();
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('generate');
  const [savedTemplates, setSavedTemplates] = useState<GeneratedItem[]>([]);

  const templateId = params.templateId;
  const templateTypes = templateTypeMap[templateId] || ['content-idea'];
  const templateDetails = templateInfo[templateId];
  const platform = selectedPlatform?.id || 'youtube';
  const niche = selectedPlatform?.name || 'general';

  useEffect(() => {
    // Load saved templates from localStorage
    const saved = localStorage.getItem(`saved-templates-${templateId}`);
    if (saved) {
      setSavedTemplates(JSON.parse(saved));
    }
  }, [templateId]);

  const handleGenerated = (content: { content: string; type: ContentGenerationType }) => {
    const newItem: GeneratedItem = {
      type: content.type,
      content: content.content,
      timestamp: new Date(),
    };
    setGeneratedItems([newItem, ...generatedItems]);
  };

  const handleSave = (item: GeneratedItem) => {
    const newSaved = [item, ...savedTemplates];
    setSavedTemplates(newSaved);
    localStorage.setItem(`saved-templates-${templateId}`, JSON.stringify(newSaved));
    toast.success('Template saved!');
  };

  const handleExportAll = () => {
    const content = generatedItems.map(item => 
      `${item.type.toUpperCase()}\n${'-'.repeat(50)}\n${item.content}\n\n`
    ).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateId}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Templates exported!');
  };

  if (!templateDetails) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Template Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The template you're looking for doesn't exist.
          </p>
          <Button onClick={() => router.push('/templates/generate')}>
            Back to Templates
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              onClick={() => router.push('/templates/generate')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Templates
            </Button>

            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">{templateDetails.name}</h1>
                <p className="text-muted-foreground">{templateDetails.description}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Wand2 className="h-3 w-3" />
                  AI Powered
                </Badge>
                <Badge variant="outline">
                  {platform}
                </Badge>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <span className="font-medium">Pro Tips</span>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {templateDetails.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Zap className="h-3 w-3 mt-0.5 text-primary/60" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="generate">Generate</TabsTrigger>
              <TabsTrigger value="history">
                History ({generatedItems.length})
              </TabsTrigger>
              <TabsTrigger value="saved">
                Saved ({savedTemplates.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generate" className="mt-6">
              <div className="grid gap-6">
                {templateTypes.map((type) => (
                  <AITemplateGenerator
                    key={type}
                    type={type}
                    platform={platform}
                    niche={niche}
                    onGenerated={handleGenerated}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              {generatedItems.length === 0 ? (
                <Card className="p-8 text-center">
                  <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No generated content yet</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button onClick={handleExportAll} variant="outline">
                      <Download className="mr-2 h-4 w-4" />
                      Export All
                    </Button>
                  </div>
                  {generatedItems.map((item, index) => (
                    <Card key={index}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline">{item.type}</Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSave(item)}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm">
                          {item.content}
                        </pre>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="saved" className="mt-6">
              {savedTemplates.length === 0 ? (
                <Card className="p-8 text-center">
                  <Star className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No saved templates yet</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {savedTemplates.map((item, index) => (
                    <Card key={index}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <Badge variant="outline">{item.type}</Badge>
                            <span className="text-xs text-muted-foreground ml-2">
                              <Clock className="inline h-3 w-3 mr-1" />
                              {new Date(item.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <pre className="whitespace-pre-wrap text-sm">
                          {item.content}
                        </pre>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}