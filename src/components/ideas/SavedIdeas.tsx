'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BulkScheduleIdeas } from './BulkScheduleIdeas';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Save, 
  Search,
  Calendar,
  Copy,
  Trash2,
  FileText,
  Video,
  Film,
  Radio,
  ExternalLink,
  Filter,
  MoreVertical,
  CalendarDays
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAppStore } from '@/store/useAppStore';

interface SavedIdea {
  id: string;
  title: string;
  description: string;
  hook: string;
  contentType: string;
  category: string;
  platform: string;
  keywords: string[];
  savedAt: Date;
  implemented: boolean;
  notes?: string;
}

export function SavedIdeas() {
  const { toast } = useToast();
  const { subscription } = useAppStore();
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [bulkScheduleOpen, setBulkScheduleOpen] = useState(false);
  
  const hasFullAccess = subscription !== 'free';

  useEffect(() => {
    fetchSavedIdeas();
  }, []);

  const fetchSavedIdeas = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterPlatform !== 'all') params.append('platform', filterPlatform);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/ideas/saved?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setSavedIdeas(data.ideas || []);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load saved ideas',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load saved ideas',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteIdea = async (id: string) => {
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSavedIdeas(prev => prev.filter(idea => idea.id !== id));
        toast({
          title: 'Idea deleted',
          description: 'The idea has been removed from your saved list.'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete idea',
        variant: 'destructive'
      });
    }
  };

  const markAsImplemented = async (id: string) => {
    try {
      const response = await fetch(`/api/ideas/${id}/implement`, {
        method: 'PUT'
      });

      if (response.ok) {
        setSavedIdeas(prev => 
          prev.map(idea => 
            idea.id === id ? { ...idea, implemented: true } : idea
          )
        );
        toast({
          title: 'Marked as implemented',
          description: 'Great job turning this idea into content!'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update idea status',
        variant: 'destructive'
      });
    }
  };

  const copyToClipboard = (idea: SavedIdea) => {
    const text = `${idea.title}\n\n${idea.description}\n\nHook: ${idea.hook}\n\nKeywords: ${idea.keywords.join(', ')}`;
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Idea details copied to clipboard.'
    });
  };

  const addToCalendar = (idea: SavedIdea) => {
    // Navigate to calendar with idea pre-filled
    const params = new URLSearchParams({
      title: idea.title,
      description: idea.description,
      platform: idea.platform,
      contentType: idea.contentType
    });
    window.location.href = `/calendar?new=true&${params.toString()}`;
  };

  // Filter and sort ideas
  const filteredIdeas = savedIdeas
    .filter(idea => {
      const matchesSearch = searchQuery === '' || 
        idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        idea.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPlatform = filterPlatform === 'all' || idea.platform === filterPlatform;
      
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'implemented' && idea.implemented) ||
        (filterStatus === 'pending' && !idea.implemented);
      
      return matchesSearch && matchesPlatform && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        case 'oldest':
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

  const contentTypeIcons = {
    video: Video,
    short: Film,
    stream: Radio,
    post: FileText
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Save className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search saved ideas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="twitch">Twitch</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="implemented">Implemented</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Title A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Bulk Actions */}
          {filteredIdeas.length > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                {filteredIdeas.length} ideas found
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkScheduleOpen(true)}
                disabled={!hasFullAccess}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Bulk Schedule
              </Button>
            </div>
          )}
          </div>
        </CardContent>
      </Card>

      {/* Saved Ideas */}
      {filteredIdeas.length === 0 ? (
        <Card className="p-12 text-center bg-gradient-to-br from-muted/50 to-muted/30 border-dashed animate-fadeIn">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center animate-pulse">
              <Save className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterPlatform !== 'all' || filterStatus !== 'all'
                  ? 'No ideas match your filters'
                  : 'No saved ideas yet'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {searchQuery || filterPlatform !== 'all' || filterStatus !== 'all'
                  ? 'Try adjusting your search or filters to find what you\'re looking for'
                  : 'Generate and save content ideas to build your creative library'}
              </p>
            </div>
            {(searchQuery || filterPlatform !== 'all' || filterStatus !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterPlatform('all');
                  setFilterStatus('all');
                }}
                className="text-sm"
              >
                Clear filters
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredIdeas.map((idea) => {
            const Icon = contentTypeIcons[idea.contentType as keyof typeof contentTypeIcons] || FileText;
            
            return (
              <Card key={idea.id} className={cn(
                "overflow-hidden transition-opacity",
                idea.implemented && "opacity-60"
              )}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn(
                        "p-2 rounded-lg",
                        idea.implemented ? "bg-muted/50" : "bg-muted"
                      )}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-lg">{idea.title}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs">
                            {idea.platform}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {idea.category}
                          </Badge>
                          {idea.implemented && (
                            <Badge className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                              Implemented
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            Saved {format(new Date(idea.savedAt), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => copyToClipboard(idea)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy to clipboard
                        </DropdownMenuItem>
                        {!idea.implemented && (
                          <>
                            <DropdownMenuItem onClick={() => addToCalendar(idea)}>
                              <Calendar className="w-4 h-4 mr-2" />
                              Add to calendar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => markAsImplemented(idea.id)}>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Mark as implemented
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem 
                          onClick={() => deleteIdea(idea.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete idea
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-muted-foreground mb-3">{idea.description}</p>
                  
                  {idea.hook && (
                    <div className="p-3 rounded-lg bg-muted mb-3">
                      <p className="text-sm font-medium mb-1">Hook:</p>
                      <p className="text-sm italic">"{idea.hook}"</p>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {idea.keywords.map((keyword) => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        #{keyword}
                      </Badge>
                    ))}
                  </div>

                  {idea.notes && (
                    <div className="mt-3 p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">{idea.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Bulk Schedule Modal */}
      <BulkScheduleIdeas
        isOpen={bulkScheduleOpen}
        onClose={() => setBulkScheduleOpen(false)}
        ideas={filteredIdeas.filter(idea => !idea.implemented)}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
}