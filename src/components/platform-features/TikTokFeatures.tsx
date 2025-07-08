'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PaywallBanner } from '@/components/paywall/PaywallBanner';
import { useAppStore } from '@/store/useAppStore';
import {
  Music,
  Hash,
  Clock,
  TrendingUp,
  Video,
  Zap,
  Calendar,
  BarChart3,
  MessageSquare,
  Heart,
  Share,
  Users,
  Target,
  Shuffle,
  Play,
  Camera,
  Mic,
  Sparkles
} from 'lucide-react';

interface TrendingSound {
  id: string;
  name: string;
  artist: string;
  duration: number;
  usageCount: string;
  viralPotential: 'High' | 'Medium' | 'Low';
  genre: string;
}

interface HashtagSet {
  category: string;
  hashtags: string[];
  reach: string;
  competition: 'Low' | 'Medium' | 'High';
}

interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  structure: string[];
  tips: string[];
  estimatedViews: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

interface PostingTime {
  day: string;
  time: string;
  engagement: number;
  audience: string;
}

export function TikTokFeatures() {
  const { subscription, selectedNiche } = useAppStore();
  const [activeFeature, setActiveFeature] = useState('sounds');
  
  // Sound Finder State
  const [trendingSounds, setTrendingSounds] = useState<TrendingSound[]>([]);
  const [soundQuery, setSoundQuery] = useState('');
  
  // Hashtag Strategy State
  const [hashtagSets, setHashtagSets] = useState<HashtagSet[]>([]);
  const [customHashtags, setCustomHashtags] = useState('');
  
  // Content Templates State
  const [contentTemplates, setContentTemplates] = useState<ContentTemplate[]>([]);
  
  // Posting Times State
  const [optimalTimes, setOptimalTimes] = useState<PostingTime[]>([]);

  const isPremium = subscription === 'premium';

  const features = [
    { id: 'sounds', name: 'Sound Finder', icon: Music },
    { id: 'hashtags', name: 'Hashtag Strategy', icon: Hash },
    { id: 'templates', name: 'Content Templates', icon: Video },
    { id: 'timing', name: 'Posting Times', icon: Clock },
    { id: 'trends', name: 'Trend Tracker', icon: TrendingUp }
  ];

  const generateTrendingSounds = () => {
    const sounds: TrendingSound[] = [
      {
        id: '1',
        name: 'original sound',
        artist: '@viralcreator',
        duration: 15,
        usageCount: '2.1M',
        viralPotential: 'High',
        genre: 'Original'
      },
      {
        id: '2',
        name: 'Chill Vibes Beat',
        artist: 'TikTok Audio',
        duration: 30,
        usageCount: '850K',
        viralPotential: 'Medium',
        genre: 'Lo-fi'
      },
      {
        id: '3',
        name: 'Trending Dance Song',
        artist: 'Popular Artist',
        duration: 20,
        usageCount: '5.2M',
        viralPotential: 'High',
        genre: 'Dance'
      },
      {
        id: '4',
        name: 'Motivation Audio',
        artist: '@motivationspeaker',
        duration: 45,
        usageCount: '320K',
        viralPotential: 'Medium',
        genre: 'Motivational'
      }
    ];
    
    setTrendingSounds(sounds);
  };

  const generateHashtagStrategy = () => {
    if (!selectedNiche) return;
    
    const strategies: HashtagSet[] = [
      {
        category: 'Viral Potential',
        hashtags: ['#fyp', '#viral', '#trending', '#foryoupage'],
        reach: '100M+',
        competition: 'High'
      },
      {
        category: 'Niche Specific',
        hashtags: [`#${selectedNiche.id}`, `#${selectedNiche.id}tok`, `#${selectedNiche.id}tips`, `#${selectedNiche.id}content`],
        reach: '10M+',
        competition: 'Medium'
      },
      {
        category: 'Community',
        hashtags: ['#creator', '#content', '#smallbusiness', '#community'],
        reach: '50M+',
        competition: 'Medium'
      },
      {
        category: 'Engagement',
        hashtags: ['#relatable', '#funny', '#satisfying', '#aesthetic'],
        reach: '200M+',
        competition: 'High'
      }
    ];
    
    setHashtagSets(strategies);
  };

  const generateContentTemplates = () => {
    if (!selectedNiche) return;
    
    const templates: ContentTemplate[] = [
      {
        id: '1',
        name: 'POV Format',
        description: 'Point of view videos are highly engaging and relatable',
        structure: [
          'Start with "POV:" in text overlay',
          'Set up the scenario (3-5 seconds)',
          'Show the reaction/situation (10-15 seconds)',
          'End with a call to action'
        ],
        tips: [
          'Make it relatable to your audience',
          'Use trending audio',
          'Keep text overlay visible',
          'Add subtle facial expressions'
        ],
        estimatedViews: '50K-500K',
        difficulty: 'Easy'
      },
      {
        id: '2',
        name: 'Tutorial Quick Tips',
        description: 'Share quick tips or how-to content in your niche',
        structure: [
          'Hook: "You\'re doing this wrong" (2 seconds)',
          'Show the wrong way (5 seconds)',
          'Reveal the right way (8 seconds)',
          'Quick recap/summary (5 seconds)'
        ],
        tips: [
          'Start with a strong hook',
          'Keep tips simple and actionable',
          'Use text overlays for clarity',
          'End with "Follow for more tips"'
        ],
        estimatedViews: '25K-200K',
        difficulty: 'Medium'
      },
      {
        id: '3',
        name: 'Before & After',
        description: 'Show transformation or improvement content',
        structure: [
          'Show "before" state (5 seconds)',
          'Quick montage of process (10 seconds)',
          'Reveal "after" result (5 seconds)',
          'Explain the transformation'
        ],
        tips: [
          'Make the contrast dramatic',
          'Use upbeat music',
          'Include process shots',
          'Ask viewers to recreate'
        ],
        estimatedViews: '75K-1M',
        difficulty: 'Medium'
      }
    ];
    
    setContentTemplates(templates);
  };

  const generateOptimalTimes = () => {
    const times: PostingTime[] = [
      {
        day: 'Monday',
        time: '6:00 AM',
        engagement: 85,
        audience: 'Early commuters'
      },
      {
        day: 'Tuesday',
        time: '9:00 AM',
        engagement: 92,
        audience: 'Morning browsers'
      },
      {
        day: 'Wednesday',
        time: '7:00 PM',
        engagement: 88,
        audience: 'Evening relaxers'
      },
      {
        day: 'Thursday',
        time: '9:00 PM',
        engagement: 95,
        audience: 'Peak social time'
      },
      {
        day: 'Friday',
        time: '5:00 PM',
        engagement: 90,
        audience: 'Weekend starters'
      },
      {
        day: 'Saturday',
        time: '11:00 AM',
        engagement: 87,
        audience: 'Weekend browsers'
      },
      {
        day: 'Sunday',
        time: '7:00 PM',
        engagement: 89,
        audience: 'Sunday scrollers'
      }
    ];
    
    setOptimalTimes(times);
  };

  const renderSoundFinder = () => (
    <div className="space-y-6">
      {!isPremium && (
        <PaywallBanner
          feature="Advanced Sound Analytics"
          title="Discover Viral Sounds First"
          description="Get trending sound predictions and detailed analytics before they go mainstream"
          variant="compact"
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sound Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Music className="w-5 h-5" />
              <span>Trending Sounds</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={soundQuery}
                onChange={(e) => setSoundQuery(e.target.value)}
                placeholder="Search for sounds..."
                className="flex-1"
              />
              <Button onClick={generateTrendingSounds}>
                <Shuffle className="w-4 h-4" />
              </Button>
            </div>
            
            {trendingSounds.length > 0 ? (
              <div className="space-y-3">
                {trendingSounds.map((sound) => (
                  <div key={sound.id} className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">{sound.name}</h4>
                        <p className="text-xs text-muted-foreground">{sound.artist}</p>
                      </div>
                      <Badge 
                        variant={sound.viralPotential === 'High' ? 'default' : 'outline'}
                        className="text-xs"
                      >
                        {sound.viralPotential}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{sound.duration}s</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{sound.usageCount} uses</span>
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {sound.genre}
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Play className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm" disabled={!isPremium}>
                        <Zap className="w-3 h-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Music className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Click the shuffle button to discover trending sounds
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Sound Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Sound Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'Dance', icon: '💃', count: '2.1M' },
                { name: 'Comedy', icon: '😂', count: '1.8M' },
                { name: 'Original', icon: '🎵', count: '950K' },
                { name: 'Motivational', icon: '💪', count: '720K' },
                { name: 'Trending', icon: '🔥', count: '3.2M' },
                { name: 'Aesthetic', icon: '✨', count: '1.1M' }
              ].map((category) => (
                <Button
                  key={category.name}
                  variant="outline"
                  className="h-auto p-3 flex flex-col items-center space-y-1"
                  disabled={!isPremium}
                >
                  <div className="text-2xl">{category.icon}</div>
                  <div className="text-xs font-medium">{category.name}</div>
                  <div className="text-xs text-muted-foreground">{category.count}</div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderHashtagStrategy = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hashtag Sets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Hash className="w-5 h-5" />
                <span>Hashtag Strategy</span>
              </span>
              <Button onClick={generateHashtagStrategy} variant="outline" size="sm">
                Generate
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hashtagSets.length > 0 ? (
              <div className="space-y-4">
                {hashtagSets.map((set, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">{set.category}</h4>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {set.reach}
                        </Badge>
                        <Badge 
                          variant={set.competition === 'Low' ? 'default' : 'outline'}
                          className="text-xs"
                        >
                          {set.competition}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {set.hashtags.map((hashtag, hidx) => (
                        <Badge key={hidx} variant="secondary" className="text-xs">
                          {hashtag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Hash className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Click "Generate" to create hashtag strategies
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Custom Hashtag Builder */}
        <Card>
          <CardHeader>
            <CardTitle>Custom Hashtag Mix</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custom-hashtags">Your Hashtags</Label>
              <Textarea
                id="custom-hashtags"
                value={customHashtags}
                onChange={(e) => setCustomHashtags(e.target.value)}
                placeholder="#your #custom #hashtags #here"
                rows={3}
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Hashtag Count:</span>
                <span className="font-medium">
                  {customHashtags.split('#').filter(tag => tag.trim().length > 0).length - 1}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Recommended:</span>
                <span className="text-muted-foreground">3-5 hashtags</span>
              </div>
            </div>
            
            <Button className="w-full" disabled={!isPremium}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Analyze Performance
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderContentTemplates = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Video className="w-5 h-5" />
              <span>Content Templates</span>
            </span>
            <Button onClick={generateContentTemplates} variant="outline" size="sm">
              <Shuffle className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contentTemplates.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {contentTemplates.map((template) => (
                <div key={template.id} className="p-4 bg-muted/50 rounded-lg space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-sm">{template.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {template.difficulty}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {template.description}
                  </p>
                  
                  <div>
                    <h5 className="text-xs font-medium mb-2">Structure:</h5>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      {template.structure.map((step, index) => (
                        <li key={index}>• {step}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Est. Views: {template.estimatedViews}
                    </span>
                    <Button variant="outline" size="sm" disabled={!isPremium}>
                      Use Template
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Video className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Content Templates</h3>
              <p className="text-muted-foreground mb-4">
                Discover proven content formats for your niche
              </p>
              <Button onClick={generateContentTemplates}>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Templates
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderPostingTimes = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Optimal Posting Times</span>
            </span>
            <Button onClick={generateOptimalTimes} variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1" />
              Update
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {optimalTimes.length > 0 ? (
            <div className="space-y-4">
              {optimalTimes.map((time, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{time.day}</div>
                    <div className="text-xs text-muted-foreground">{time.audience}</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-medium text-sm">{time.time}</div>
                    <div className="text-xs text-muted-foreground">Best time</div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium text-sm ${
                      time.engagement >= 90 ? 'text-green-500' :
                      time.engagement >= 85 ? 'text-yellow-500' : 'text-red-500'
                    }`}>
                      {time.engagement}%
                    </div>
                    <div className="text-xs text-muted-foreground">Engagement</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Posting Schedule</h3>
              <p className="text-muted-foreground mb-4">
                Discover when your audience is most active
              </p>
              <Button onClick={generateOptimalTimes}>
                <Target className="w-4 h-4 mr-2" />
                Analyze Best Times
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Feature Navigation */}
      <div className="flex flex-wrap gap-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Button
              key={feature.id}
              variant={activeFeature === feature.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFeature(feature.id)}
              className="flex items-center space-x-2"
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{feature.name}</span>
            </Button>
          );
        })}
      </div>

      {/* Feature Content */}
      {activeFeature === 'sounds' && renderSoundFinder()}
      {activeFeature === 'hashtags' && renderHashtagStrategy()}
      {activeFeature === 'templates' && renderContentTemplates()}
      {activeFeature === 'timing' && renderPostingTimes()}
      
      {/* Premium Features */}
      {activeFeature === 'trends' && (
        <PaywallBanner
          feature="Advanced Trend Tracker"
          title="Stay Ahead of Viral Trends"
          description="Get real-time trend predictions and viral content alerts before they explode"
          variant="prominent"
        />
      )}
    </div>
  );
}