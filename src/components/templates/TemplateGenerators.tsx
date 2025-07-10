'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { ExportButton } from '@/components/export/ExportButton';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { exportTemplatesToPDF } from '@/lib/export';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaywallBanner } from '@/components/paywall/PaywallBanner';
import { useAppStore } from '@/store/useAppStore';
import {
  generateBio,
  generateAdvancedContentIdeas,
  generateSchedule,
  generateHashtagStrategy,
  generateCaption,
  generateCompleteTemplatePackage,
  type GeneratedBio,
  type GeneratedContentIdea,
  type GeneratedSchedule,
  type HashtagStrategy
} from '@/lib/templateGenerator';
import {
  User,
  Lightbulb,
  Calendar,
  Hash,
  MessageSquare,
  Copy,
  Shuffle,
  Sparkles,
  Download,
  Wand2,
  Target,
  Clock,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';

export function TemplateGenerators() {
  const { selectedPlatform, selectedNiche, subscription } = useAppStore();
  const [activeTab, setActiveTab] = useState('bio');
  
  // Generated content state
  const [generatedBio, setGeneratedBio] = useState<GeneratedBio | null>(null);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedContentIdea[]>([]);
  const [generatedSchedule, setGeneratedSchedule] = useState<GeneratedSchedule | null>(null);
  const [generatedHashtags, setGeneratedHashtags] = useState<HashtagStrategy | null>(null);
  const [generatedCaption, setGeneratedCaption] = useState<string | null>(null);
  
  // Loading and error states
  const [isGenerating, setIsGenerating] = useState<{
    bio: boolean;
    ideas: boolean;
    schedule: boolean;
    hashtags: boolean;
    caption: boolean;
  }>({
    bio: false,
    ideas: false,
    schedule: false,
    hashtags: false,
    caption: false
  });
  
  const [errors, setErrors] = useState<{
    bio?: string;
    ideas?: string;
    schedule?: string;
    hashtags?: string;
    caption?: string;
  }>({});
  
  // User preferences
  const [userPrefs, setUserPrefs] = useState({
    name: '',
    location: '',
    goal: '',
    schedule: '',
    personality: '',
    experience_level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    content_style: 'entertainment' as 'educational' | 'entertainment' | 'promotional'
  });

  const isPremium = subscription === 'premium' || subscription === 'enterprise' || subscription === 'pro';
  const { trackUsage, canUseFeature, getRemainingUsage } = useUsageTracking();
  const [showPaywall, setShowPaywall] = useState(false);
  const [blockedFeature, setBlockedFeature] = useState<string>('');

  if (!selectedPlatform || !selectedNiche) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Wand2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Select Platform & Niche First</h3>
          <p className="text-muted-foreground">
            Complete your onboarding to access personalized template generators.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleGenerateBio = async () => {
    // Check usage limits
    if (!canUseFeature('templates')) {
      setBlockedFeature('Bio Generator');
      setShowPaywall(true);
      return;
    }
    
    setIsGenerating(prev => ({ ...prev, bio: true }));
    setErrors(prev => ({ ...prev, bio: undefined }));
    
    try {
      // Track usage
      const tracked = await trackUsage('templates');
      if (!tracked) {
        setBlockedFeature('Bio Generator');
        setShowPaywall(true);
        return;
      }
      
      const bio = await generateBio(selectedPlatform.id, selectedNiche.id, userPrefs);
      if (!bio) {
        throw new Error('Failed to generate bio. Please try again.');
      }
      setGeneratedBio(bio);
    } catch (error) {
      console.error('Error generating bio:', error);
      setErrors(prev => ({ 
        ...prev, 
        bio: error instanceof Error ? error.message : 'Failed to generate bio. Please try again.'
      }));
    } finally {
      setIsGenerating(prev => ({ ...prev, bio: false }));
    }
  };

  const handleGenerateContentIdeas = async () => {
    // Check usage limits
    if (!canUseFeature('templates')) {
      setBlockedFeature('Content Ideas');
      setShowPaywall(true);
      return;
    }
    
    setIsGenerating(prev => ({ ...prev, ideas: true }));
    setErrors(prev => ({ ...prev, ideas: undefined }));
    
    try {
      // Track usage
      const tracked = await trackUsage('templates');
      if (!tracked) {
        setBlockedFeature('Content Ideas');
        setShowPaywall(true);
        return;
      }
      
      const ideas = await generateAdvancedContentIdeas(
        selectedPlatform.id,
        selectedNiche.id,
        userPrefs,
        isPremium ? 10 : 3
      );
      if (!ideas || ideas.length === 0) {
        throw new Error('Failed to generate content ideas. Please try again.');
      }
      setGeneratedIdeas(ideas);
    } catch (error) {
      console.error('Error generating content ideas:', error);
      setErrors(prev => ({ 
        ...prev, 
        ideas: error instanceof Error ? error.message : 'Failed to generate content ideas. Please try again.'
      }));
    } finally {
      setIsGenerating(prev => ({ ...prev, ideas: false }));
    }
  };

  const handleGenerateSchedule = async () => {
    // Check usage limits
    if (!canUseFeature('templates')) {
      setBlockedFeature('Schedule Generator');
      setShowPaywall(true);
      return;
    }
    
    setIsGenerating(prev => ({ ...prev, schedule: true }));
    setErrors(prev => ({ ...prev, schedule: undefined }));
    
    try {
      // Track usage
      const tracked = await trackUsage('templates');
      if (!tracked) {
        setBlockedFeature('Schedule Generator');
        setShowPaywall(true);
        return;
      }
      
      const schedule = await generateSchedule(selectedPlatform.id, userPrefs.experience_level);
      if (!schedule) {
        throw new Error('Failed to generate schedule. Please try again.');
      }
      setGeneratedSchedule(schedule);
    } catch (error) {
      console.error('Error generating schedule:', error);
      setErrors(prev => ({ 
        ...prev, 
        schedule: error instanceof Error ? error.message : 'Failed to generate schedule. Please try again.'
      }));
    } finally {
      setIsGenerating(prev => ({ ...prev, schedule: false }));
    }
  };

  const handleGenerateHashtags = async () => {
    // Check usage limits
    if (!canUseFeature('templates')) {
      setBlockedFeature('Hashtag Strategy');
      setShowPaywall(true);
      return;
    }
    
    setIsGenerating(prev => ({ ...prev, hashtags: true }));
    setErrors(prev => ({ ...prev, hashtags: undefined }));
    
    try {
      // Track usage
      const tracked = await trackUsage('templates');
      if (!tracked) {
        setBlockedFeature('Hashtag Strategy');
        setShowPaywall(true);
        return;
      }
      
      const hashtags = await generateHashtagStrategy(selectedPlatform.id, selectedNiche.id);
      if (!hashtags) {
        throw new Error('Failed to generate hashtag strategy. Please try again.');
      }
      setGeneratedHashtags(hashtags);
    } catch (error) {
      console.error('Error generating hashtags:', error);
      setErrors(prev => ({ 
        ...prev, 
        hashtags: error instanceof Error ? error.message : 'Failed to generate hashtag strategy. Please try again.'
      }));
    } finally {
      setIsGenerating(prev => ({ ...prev, hashtags: false }));
    }
  };

  const handleGenerateCaption = async () => {
    // Check usage limits
    if (!canUseFeature('templates')) {
      setBlockedFeature('Caption Generator');
      setShowPaywall(true);
      return;
    }
    
    setIsGenerating(prev => ({ ...prev, caption: true }));
    setErrors(prev => ({ ...prev, caption: undefined }));
    
    try {
      // Track usage
      const tracked = await trackUsage('templates');
      if (!tracked) {
        setBlockedFeature('Caption Generator');
        setShowPaywall(true);
        return;
      }
      
      const caption = await generateCaption(selectedPlatform.id, selectedNiche.id);
      if (!caption) {
        throw new Error('Failed to generate caption. Please try again.');
      }
      setGeneratedCaption(caption);
    } catch (error) {
      console.error('Error generating caption:', error);
      setErrors(prev => ({ 
        ...prev, 
        caption: error instanceof Error ? error.message : 'Failed to generate caption. Please try again.'
      }));
    } finally {
      setIsGenerating(prev => ({ ...prev, caption: false }));
    }
  };

  const handleGenerateAll = async () => {
    if (!isPremium) return;
    
    // Check usage limits for premium users (they get more but not unlimited)
    if (!canUseFeature('templates')) {
      setBlockedFeature('Complete Template Package');
      setShowPaywall(true);
      return;
    }
    
    setIsGenerating({
      bio: true,
      ideas: true,
      schedule: true,
      hashtags: true,
      caption: true
    });
    setErrors({});
    
    try {
      // Track usage (counts as 5 templates)
      for (let i = 0; i < 5; i++) {
        const tracked = await trackUsage('templates');
        if (!tracked) {
          setBlockedFeature('Complete Template Package');
          setShowPaywall(true);
          return;
        }
      }
      
      const completePackage = await generateCompleteTemplatePackage(
        selectedPlatform.id,
        selectedNiche.id,
        userPrefs
      );
      
      if (!completePackage) {
        throw new Error('Failed to generate complete template package. Please try again.');
      }
      
      setGeneratedBio(completePackage.bio);
      setGeneratedIdeas(completePackage.contentIdeas);
      setGeneratedSchedule(completePackage.schedule);
      setGeneratedHashtags(completePackage.hashtagStrategy);
      setGeneratedCaption(completePackage.sampleCaption);
    } catch (error) {
      console.error('Error generating complete package:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate complete template package. Please try again.';
      setErrors({
        bio: errorMessage,
        ideas: errorMessage,
        schedule: errorMessage,
        hashtags: errorMessage,
        caption: errorMessage
      });
    } finally {
      setIsGenerating({
        bio: false,
        ideas: false,
        schedule: false,
        hashtags: false,
        caption: false
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Template Generators</h1>
            <p className="text-muted-foreground">
              Create personalized content for {selectedPlatform.name} • {selectedNiche.name}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {(generatedBio || generatedIdeas.length > 0 || generatedSchedule || generatedHashtags || generatedCaption) && (
              <ExportButton
                onExport={async (format) => {
                  if (format === 'pdf') {
                    const templates = [];
                    
                    if (generatedBio) {
                      templates.push({
                        title: 'Bio',
                        content: generatedBio.content
                      });
                    }
                    
                    if (generatedIdeas.length > 0) {
                      generatedIdeas.forEach((idea, index) => {
                        templates.push({
                          title: `Content Idea ${index + 1}: ${idea.title}`,
                          content: `${idea.description}\n\nDifficulty: ${idea.difficulty}\nTime: ${idea.estimatedTime}min\nVirality: ${idea.viralityPotential}\n\nTips:\n${idea.tips.join('\n')}`
                        });
                      });
                    }
                    
                    if (generatedSchedule) {
                      templates.push({
                        title: 'Posting Schedule',
                        content: `Frequency: ${generatedSchedule.frequency}\nOptimal Times: ${generatedSchedule.optimalTimes.join(', ')}\n\nContent Calendar:\n${Object.entries(generatedSchedule.contentTypes).map(([day, content]) => `${day}: ${content}`).join('\n')}`
                      });
                    }
                    
                    if (generatedHashtags) {
                      templates.push({
                        title: 'Hashtag Strategy',
                        content: `Strategy: ${generatedHashtags.strategy}\n\nTrending: ${generatedHashtags.trending.map(tag => `#${tag}`).join(' ')}\nNiche: ${generatedHashtags.niche_specific.map(tag => `#${tag}`).join(' ')}\nBroad: ${generatedHashtags.broad.map(tag => `#${tag}`).join(' ')}\n\nOptimal Count: ${generatedHashtags.optimal_count}`
                      });
                    }
                    
                    if (generatedCaption) {
                      templates.push({
                        title: 'Sample Caption',
                        content: generatedCaption
                      });
                    }
                    
                    await exportTemplatesToPDF(templates, {
                      title: `${selectedPlatform.name} ${selectedNiche.name} Templates`
                    });
                  }
                }}
                options={[
                  { format: 'pdf', label: 'Export Templates', icon: FileText }
                ]}
                variant="outline"
                feature="templates-export"
              />
            )}
            
            {isPremium && (
              <Button onClick={handleGenerateAll} className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate All
              </Button>
            )}
          </div>
        </div>
        
        {/* User Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Your Creator Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="name">Creator Name</Label>
                <Input
                  id="name"
                  value={userPrefs.name}
                  onChange={(e) => setUserPrefs({...userPrefs, name: e.target.value})}
                  placeholder="Your name or brand"
                />
              </div>
              
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={userPrefs.location}
                  onChange={(e) => setUserPrefs({...userPrefs, location: e.target.value})}
                  placeholder="City, Country"
                />
              </div>
              
              <div>
                <Label htmlFor="goal">Current Goal</Label>
                <Input
                  id="goal"
                  value={userPrefs.goal}
                  onChange={(e) => setUserPrefs({...userPrefs, goal: e.target.value})}
                  placeholder="1K subscribers, 10K followers"
                />
              </div>
              
              <div>
                <Label htmlFor="schedule">Upload Schedule</Label>
                <Input
                  id="schedule"
                  value={userPrefs.schedule}
                  onChange={(e) => setUserPrefs({...userPrefs, schedule: e.target.value})}
                  placeholder="Mon, Wed, Fri"
                />
              </div>
              
              <div>
                <Label htmlFor="experience">Experience Level</Label>
                <Select
                  value={userPrefs.experience_level}
                  onValueChange={(value) => setUserPrefs({...userPrefs, experience_level: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="style">Content Style</Label>
                <Select
                  value={userPrefs.content_style}
                  onValueChange={(value) => setUserPrefs({...userPrefs, content_style: value as any})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="educational">Educational</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="promotional">Promotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Template Generators */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="bio" className="flex items-center space-x-1">
            <User className="w-3 h-3" />
            <span className="hidden sm:inline">Bio</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center space-x-1">
            <Lightbulb className="w-3 h-3" />
            <span className="hidden sm:inline">Ideas</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center space-x-1">
            <Calendar className="w-3 h-3" />
            <span className="hidden sm:inline">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="flex items-center space-x-1">
            <Hash className="w-3 h-3" />
            <span className="hidden sm:inline">Tags</span>
          </TabsTrigger>
          <TabsTrigger value="captions" className="flex items-center space-x-1">
            <MessageSquare className="w-3 h-3" />
            <span className="hidden sm:inline">Captions</span>
          </TabsTrigger>
        </TabsList>

        {/* Bio Generator */}
        <TabsContent value="bio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Bio Generator</span>
                </span>
                <Button onClick={handleGenerateBio} variant="outline" size="sm">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedBio ? (
                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">Generated Bio</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedBio.content)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm">{generatedBio.content}</pre>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {generatedBio.variables.map((variable, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Generate" to create a personalized bio for your {selectedPlatform.name} profile
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Ideas Generator */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5" />
                  <span>Content Ideas</span>
                </span>
                <Button onClick={handleGenerateContentIdeas} variant="outline" size="sm">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isPremium && (
                <PaywallBanner
                  feature="Unlimited Content Ideas"
                  title="Get 10+ Content Ideas"
                  description="Upgrade to access unlimited content idea generation with advanced personalization"
                  variant="compact"
                  className="mb-4"
                />
              )}
              
              {generatedIdeas.length > 0 ? (
                <div className="space-y-4">
                  {generatedIdeas.slice(0, isPremium ? 10 : 3).map((idea, index) => (
                    <div key={idea.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{idea.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={idea.viralityPotential === 'High' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {idea.viralityPotential}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => copyToClipboard(`${idea.title}\n\n${idea.description}`)}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                        <span className="flex items-center space-x-1">
                          <Target className="w-3 h-3" />
                          <span>{idea.difficulty}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{idea.estimatedTime}min</span>
                        </span>
                      </div>
                      
                      {idea.tips.length > 0 && (
                        <div className="space-y-1">
                          <h5 className="text-xs font-medium">💡 Tips:</h5>
                          {idea.tips.slice(0, 2).map((tip, tipIndex) => (
                            <p key={tipIndex} className="text-xs text-muted-foreground">• {tip}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {!isPremium && generatedIdeas.length > 3 && (
                    <PaywallBanner
                      feature="More Content Ideas"
                      title="7 More Ideas Available"
                      description="Upgrade to see all generated content ideas"
                      variant="compact"
                    />
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Generate" to get personalized content ideas for {selectedPlatform.name}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Generator */}
        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Posting Schedule</span>
                </span>
                <Button onClick={handleGenerateSchedule} variant="outline" size="sm">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedSchedule ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4" />
                        <span>Frequency</span>
                      </h4>
                      <p className="text-sm">{generatedSchedule.frequency}</p>
                      {generatedSchedule.duration && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Duration: {generatedSchedule.duration}
                        </p>
                      )}
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>Best Times</span>
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {generatedSchedule.optimalTimes.map((time, index) => (
                          <Badge key={index} variant="outline" className="text-xs">{time}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Content Calendar</span>
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(generatedSchedule.contentTypes).map(([day, content]) => (
                        <div key={day} className="flex justify-between items-center text-sm">
                          <span className="font-medium">{day}</span>
                          <span className="text-muted-foreground">{content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {generatedSchedule.weeklyPlan && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-3">Weekly Plan</h4>
                      <div className="space-y-2">
                        {Object.entries(generatedSchedule.weeklyPlan).map(([day, plan]) => (
                          <div key={day} className="text-sm">
                            <span className="font-medium">{day}:</span>
                            <span className="text-muted-foreground ml-2">{plan}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Generate" to create an optimal posting schedule for {selectedPlatform.name}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hashtag Strategy */}
        <TabsContent value="hashtags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Hash className="w-5 h-5" />
                  <span>Hashtag Strategy</span>
                </span>
                <Button onClick={handleGenerateHashtags} variant="outline" size="sm">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedHashtags ? (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Strategy</h4>
                    <p className="text-sm text-muted-foreground">{generatedHashtags.strategy}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">🔥 Trending</h4>
                      <div className="flex flex-wrap gap-1">
                        {generatedHashtags.trending.map((tag, index) => (
                          <Badge key={index} variant="default" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">🎯 Niche</h4>
                      <div className="flex flex-wrap gap-1">
                        {generatedHashtags.niche_specific.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2 text-sm">📈 Broad</h4>
                      <div className="flex flex-wrap gap-1">
                        {generatedHashtags.broad.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">Optimal Count: {generatedHashtags.optimal_count}</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        const allTags = [
                          ...generatedHashtags.trending,
                          ...generatedHashtags.niche_specific.slice(0, 3),
                          ...generatedHashtags.broad.slice(0, 2)
                        ].slice(0, generatedHashtags.optimal_count);
                        copyToClipboard(allTags.map(tag => `#${tag}`).join(' '));
                      }}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Mix
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Generate" to create a hashtag strategy for {selectedPlatform.name}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Caption Generator */}
        <TabsContent value="captions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Caption Generator</span>
                </span>
                <Button onClick={handleGenerateCaption} variant="outline" size="sm">
                  <Shuffle className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isPremium && (
                <PaywallBanner
                  feature="Advanced Caption Generator"
                  title="AI-Powered Captions"
                  description="Get unlimited caption variations with emoji suggestions and call-to-action templates"
                  variant="compact"
                  className="mb-4"
                />
              )}
              
              {generatedCaption ? (
                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">Generated Caption</h4>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(generatedCaption)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm">{generatedCaption}</p>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    💡 Tip: Customize this caption with your specific content details for better engagement
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Click "Generate" to create engaging captions for {selectedPlatform.name}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Paywall Modal */}
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Template Generation"
        title={`Unlock ${blockedFeature}`}
        description={`You've reached your template generation limit. Upgrade to continue creating ${blockedFeature.toLowerCase()} and access unlimited templates.`}
        benefits={[
          'Unlimited template generation',
          'Advanced customization options',
          'Priority access to new templates',
          'Export templates in multiple formats',
          'Save and organize your templates'
        ]}
      />
    </div>
  );
}