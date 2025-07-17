'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Sparkles, TrendingUp, Target, Lightbulb, RefreshCw, 
  ChevronRight, Clock, Users, Zap, Brain, Star,
  Youtube, Music2, Gamepad2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface TemplateSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  platform: string;
  relevanceScore: number;
  trendingScore?: number;
  reason: string;
  estimatedTime?: string;
  potentialReach?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  aiGenerated?: boolean;
}

interface TrendingTopic {
  topic: string;
  platform: string;
  score: number;
  templates: string[];
}

interface AITemplateSuggestionsProps {
  userLevel?: string;
  platform?: string;
  niche?: string;
  onSelectTemplate?: (templateId: string) => void;
  className?: string;
}

const PLATFORM_ICONS = {
  youtube: <Youtube className="h-4 w-4" />,
  tiktok: <Music2 className="h-4 w-4" />,
  twitch: <Gamepad2 className="h-4 w-4" />,
};

const DIFFICULTY_COLORS = {
  beginner: 'text-green-600 dark:text-green-400',
  intermediate: 'text-yellow-600 dark:text-yellow-400',
  advanced: 'text-red-600 dark:text-red-400',
};

export function AITemplateSuggestions({
  userLevel,
  platform,
  niche,
  onSelectTemplate,
  className
}: AITemplateSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<TemplateSuggestion[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchSuggestions();
  }, [userLevel, platform, niche]);

  const fetchSuggestions = async (refresh = false) => {
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch('/api/ai/template-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userLevel,
          platform,
          niche,
          includetrends: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let suggestions: TemplateSuggestion[] = [];
      let topics: TrendingTopic[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.suggestions) {
                suggestions = data.suggestions;
                setSuggestions(suggestions);
              }
              
              if (data.trending) {
                topics = data.trending;
                setTrendingTopics(topics);
              }
            } catch (e) {
              console.error('Error parsing suggestion data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: "Failed to load suggestions",
        description: "We'll try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchSuggestions(true);
  };

  const handleSelectTemplate = (templateId: string) => {
    if (onSelectTemplate) {
      onSelectTemplate(templateId);
    } else {
      window.location.href = `/templates/generate/${templateId}`;
    }
  };

  const categories = ['all', ...new Set(suggestions.map(s => s.category))];
  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-semibold">AI-Powered Suggestions</h3>
            <Badge variant="secondary" className="text-xs">
              Personalized for You
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>

        {/* Trending Topics */}
        {trendingTopics.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Trending Now</span>
            </div>
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2">
                {trendingTopics.map((topic, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => {
                      // Filter suggestions by trending topic
                      const topicSuggestions = suggestions.filter(s => 
                        topic.templates.includes(s.type)
                      );
                      if (topicSuggestions.length > 0) {
                        setSuggestions(topicSuggestions);
                      }
                    }}
                  >
                    {PLATFORM_ICONS[topic.platform as keyof typeof PLATFORM_ICONS]}
                    <span className="ml-1">{topic.topic}</span>
                    <span className="ml-2 text-xs opacity-70">+{topic.score}%</span>
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs"
            >
              {category === 'all' ? 'All' : category.replace('_', ' ')}
            </Button>
          ))}
        </div>

        {/* Suggestions List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              No suggestions available right now
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredSuggestions.map((suggestion, idx) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card 
                    className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                    onClick={() => handleSelectTemplate(suggestion.id)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium group-hover:text-primary transition-colors">
                              {suggestion.title}
                            </h4>
                            {suggestion.aiGenerated && (
                              <Badge variant="secondary" className="text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI
                              </Badge>
                            )}
                            {suggestion.trendingScore && suggestion.trendingScore > 70 && (
                              <Badge variant="destructive" className="text-xs">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Hot
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {suggestion.estimatedTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {suggestion.estimatedTime}
                          </div>
                        )}
                        {suggestion.potentialReach && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {suggestion.potentialReach}
                          </div>
                        )}
                        {suggestion.difficulty && (
                          <div className={cn("flex items-center gap-1", DIFFICULTY_COLORS[suggestion.difficulty])}>
                            <Zap className="h-3 w-3" />
                            {suggestion.difficulty}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {PLATFORM_ICONS[suggestion.platform as keyof typeof PLATFORM_ICONS]}
                          {suggestion.platform}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.reason}
                        </span>
                      </div>

                      {/* Relevance Score Indicator */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                            style={{ width: `${suggestion.relevanceScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.relevanceScore}% match
                        </span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">Pro Tip</p>
              <p className="text-muted-foreground">
                Templates marked with <Star className="inline h-3 w-3" /> are trending in your niche. 
                Using them can help you ride current content waves!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}