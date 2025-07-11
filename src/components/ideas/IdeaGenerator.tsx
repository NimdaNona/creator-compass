'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Sparkles, 
  RefreshCw, 
  Save, 
  Copy,
  Calendar,
  TrendingUp,
  Lightbulb,
  Video,
  Film,
  Radio,
  FileText,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface IdeaGeneratorProps {
  platform: any;
  niche: any;
  hasFullAccess: boolean;
  dailyLimit: number;
  generatedToday: number;
  onGenerate: () => void;
  onLimitReached: () => void;
}

interface GeneratedIdea {
  id: string;
  title: string;
  description: string;
  hook: string;
  contentType: string;
  category: string;
  estimatedEngagement: 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  keywords: string[];
  format: string;
}

export function IdeaGenerator({
  platform,
  niche,
  hasFullAccess,
  dailyLimit,
  generatedToday,
  onGenerate,
  onLimitReached
}: IdeaGeneratorProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedContentType, setSelectedContentType] = useState('all');

  const contentTypes = {
    youtube: [
      { value: 'video', label: 'Long-form Video', icon: Video },
      { value: 'short', label: 'YouTube Short', icon: Film },
      { value: 'series', label: 'Video Series', icon: FileText },
      { value: 'tutorial', label: 'Tutorial', icon: Lightbulb }
    ],
    tiktok: [
      { value: 'short', label: 'Short Video', icon: Film },
      { value: 'trend', label: 'Trend Video', icon: TrendingUp },
      { value: 'series', label: 'Series', icon: FileText },
      { value: 'duet', label: 'Duet/Stitch', icon: Video }
    ],
    twitch: [
      { value: 'stream', label: 'Stream Idea', icon: Radio },
      { value: 'series', label: 'Stream Series', icon: FileText },
      { value: 'event', label: 'Special Event', icon: Calendar },
      { value: 'collab', label: 'Collaboration', icon: Video }
    ]
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'trending', label: 'Trending Now' },
    { value: 'evergreen', label: 'Evergreen Content' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'series', label: 'Series Ideas' },
    { value: 'beginner', label: 'Beginner Friendly' }
  ];

  const generateIdeas = async () => {
    if (!hasFullAccess && generatedToday >= dailyLimit) {
      onLimitReached();
      return;
    }

    setIsGenerating(true);
    onGenerate();

    try {
      // Call the API to generate ideas
      const response = await fetch('/api/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform?.id,
          niche: niche?.id,
          category: selectedCategory,
          contentType: selectedContentType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedIdeas(data.ideas);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate ideas. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate ideas. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveIdea = async (idea: GeneratedIdea) => {
    try {
      const response = await fetch('/api/ideas/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idea)
      });

      if (response.ok) {
        toast({
          title: 'Idea saved!',
          description: 'You can find it in your saved ideas.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save idea. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Idea copied to clipboard.'
    });
  };

  const getEngagementColor = (engagement: string) => {
    switch (engagement) {
      case 'high': return 'text-green-600 bg-green-50 dark:bg-green-950/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20';
      case 'low': return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950/20';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const currentContentTypes = platform ? contentTypes[platform.id as keyof typeof contentTypes] || [] : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Content Ideas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Content Type</Label>
              <Select value={selectedContentType} onValueChange={setSelectedContentType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {currentContentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="w-4 h-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Additional Context (Optional)</Label>
            <Textarea 
              placeholder="Add any specific requirements or themes you want to explore..."
              className="resize-none"
              rows={3}
            />
          </div>

          <Button 
            onClick={generateIdeas} 
            disabled={isGenerating || (!hasFullAccess && generatedToday >= dailyLimit)}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating Ideas...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Ideas */}
      {generatedIdeas.length > 0 && (
        <div className="space-y-4">
          {generatedIdeas.map((idea) => {
            const ContentIcon = currentContentTypes.find(t => t.value === idea.contentType)?.icon || FileText;
            
            return (
              <Card key={idea.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <ContentIcon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{idea.title}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {idea.format}
                          </Badge>
                          <Badge className={cn("text-xs", getEngagementColor(idea.estimatedEngagement))}>
                            {idea.estimatedEngagement} engagement
                          </Badge>
                          <Badge className={cn("text-xs", getDifficultyColor(idea.difficulty))}>
                            {idea.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(`${idea.title}\n\n${idea.description}\n\nHook: ${idea.hook}`)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => saveIdea(idea)}
                      >
                        <Save className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-3">{idea.description}</p>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="text-sm font-medium mb-1">Hook Idea:</p>
                      <p className="text-sm italic">"{idea.hook}"</p>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      {idea.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          #{keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}