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
  Play,
  Image,
  Clock,
  Eye,
  ThumbsUp,
  MessageSquare,
  Search,
  TrendingUp,
  Download,
  Palette,
  Type,
  Zap,
  BarChart3,
  FileText,
  Tag,
  Users
} from 'lucide-react';

interface ThumbnailElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
  };
}

interface VideoIdea {
  title: string;
  hook: string;
  outline: string[];
  keywords: string[];
  estimatedViews: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function YouTubeFeatures() {
  const { subscription, selectedNiche } = useAppStore();
  const [activeFeature, setActiveFeature] = useState('thumbnail');
  
  // Thumbnail Designer State
  const [thumbnailElements, setThumbnailElements] = useState<ThumbnailElement[]>([]);
  const [thumbnailText, setThumbnailText] = useState('');
  
  // SEO Optimizer State
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const [tags, setTags] = useState('');
  const [seoScore, setSeoScore] = useState(0);
  
  // Trend Analyzer State
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [videoIdeas, setVideoIdeas] = useState<VideoIdea[]>([]);

  const isPremium = subscription === 'premium';

  const features = [
    { id: 'thumbnail', name: 'Thumbnail Designer', icon: Image },
    { id: 'seo', name: 'SEO Optimizer', icon: Search },
    { id: 'trends', name: 'Trend Analyzer', icon: TrendingUp },
    { id: 'analytics', name: 'Analytics Predictor', icon: BarChart3 },
    { id: 'scripts', name: 'Script Templates', icon: FileText }
  ];

  const generateThumbnailText = () => {
    if (!selectedNiche) return;
    
    const thumbnailTexts = [
      'SHOCKING!',
      'YOU WON\'T BELIEVE',
      'EPIC FAIL',
      'AMAZING RESULTS',
      'MUST WATCH',
      'LIFE CHANGING',
      'INCREDIBLE',
      'MIND BLOWN'
    ];
    
    const randomText = thumbnailTexts[Math.floor(Math.random() * thumbnailTexts.length)];
    setThumbnailText(randomText);
  };

  const analyzeSEO = () => {
    let score = 0;
    let feedback = [];
    
    // Title analysis
    if (videoTitle.length >= 60 && videoTitle.length <= 70) {
      score += 25;
    } else {
      feedback.push('Title should be 60-70 characters for optimal display');
    }
    
    // Description analysis
    if (videoDescription.length >= 250) {
      score += 25;
    } else {
      feedback.push('Description should be at least 250 characters');
    }
    
    // Tags analysis
    const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    if (tagArray.length >= 5 && tagArray.length <= 15) {
      score += 25;
    } else {
      feedback.push('Include 5-15 relevant tags');
    }
    
    // Keywords in title
    if (selectedNiche && videoTitle.toLowerCase().includes(selectedNiche.name.toLowerCase())) {
      score += 25;
    } else {
      feedback.push('Include your niche keyword in the title');
    }
    
    setSeoScore(score);
  };

  const generateTrendingTopics = () => {
    if (!selectedNiche) return;
    
    const topics = {
      gaming: [
        'New Game Reviews',
        'Gaming Setup Tours',
        'Pro Tips & Tricks',
        'Epic Gameplay Moments',
        'Game Tier Lists',
        'Gaming News Reactions',
        'Controller Reviews',
        'Speedrun Attempts'
      ],
      beauty: [
        'Get Ready With Me',
        'Product Reviews',
        'Makeup Challenges',
        'Skincare Routines',
        'Transformation Videos',
        'Beauty Hacks',
        'Product Dupes',
        'Seasonal Looks'
      ],
      lifestyle: [
        'Morning Routines',
        'Room Tours',
        'Day in My Life',
        'Productivity Tips',
        'Health & Wellness',
        'Budget Living',
        'Organization Hacks',
        'Self Care Routines'
      ]
    };
    
    const nicheTopics = topics[selectedNiche.id as keyof typeof topics] || topics.gaming;
    setTrendingTopics(nicheTopics.slice(0, 6));
  };

  const generateVideoIdeas = () => {
    if (!selectedNiche) return;
    
    const ideas: VideoIdea[] = [
      {
        title: `Ultimate ${selectedNiche.name} Guide for Beginners`,
        hook: 'I wish I knew this when I started...',
        outline: [
          'Common mistakes beginners make',
          'Essential tools and resources',
          'Step-by-step getting started guide',
          'Pro tips for faster progress'
        ],
        keywords: [selectedNiche.name, 'beginner', 'guide', 'tutorial', 'tips'],
        estimatedViews: '10K-50K',
        difficulty: 'Easy'
      },
      {
        title: `Reacting to ${selectedNiche.name} TikToks`,
        hook: 'These TikToks are wild...',
        outline: [
          'Find trending TikToks in your niche',
          'Provide commentary and reactions',
          'Share your expert opinions',
          'Rate the content'
        ],
        keywords: [selectedNiche.name, 'reaction', 'tiktok', 'review', 'funny'],
        estimatedViews: '5K-25K',
        difficulty: 'Easy'
      },
      {
        title: `${selectedNiche.name} Tier List Ranking`,
        hook: 'This ranking will be controversial...',
        outline: [
          'Create categories for ranking',
          'Explain your ranking criteria',
          'Rate items from S to F tier',
          'Justify controversial placements'
        ],
        keywords: [selectedNiche.name, 'tier list', 'ranking', 'best', 'worst'],
        estimatedViews: '15K-75K',
        difficulty: 'Medium'
      }
    ];
    
    setVideoIdeas(ideas);
  };

  const renderThumbnailDesigner = () => (
    <div className="space-y-6">
      {!isPremium && (
        <PaywallBanner
          feature="Advanced Thumbnail Designer"
          title="Professional Thumbnail Creation"
          description="Create eye-catching thumbnails with templates, custom text, and design elements"
          variant="compact"
        />
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thumbnail Preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Image className="w-5 h-5" />
              <span>Thumbnail Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg relative overflow-hidden border-2 border-dashed border-muted-foreground/30">
              <div className="absolute inset-0 flex items-center justify-center">
                {thumbnailText ? (
                  <div className="text-white text-2xl font-bold text-center px-4 py-2 bg-black/50 rounded-lg">
                    {thumbnailText}
                  </div>
                ) : (
                  <div className="text-white/50 text-center">
                    <Image className="w-12 h-12 mx-auto mb-2" />
                    <p>Your thumbnail preview</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button onClick={generateThumbnailText} variant="outline" size="sm">
                <Zap className="w-3 h-3 mr-1" />
                Generate Text
              </Button>
              <Button disabled={!isPremium} variant="outline" size="sm">
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Design Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Design Tools</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="thumbnail-text">Thumbnail Text</Label>
              <Input
                id="thumbnail-text"
                value={thumbnailText}
                onChange={(e) => setThumbnailText(e.target.value)}
                placeholder="Enter catchy text..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" disabled={!isPremium}>
                <Type className="w-3 h-3 mr-1" />
                Fonts
              </Button>
              <Button variant="outline" size="sm" disabled={!isPremium}>
                <Palette className="w-3 h-3 mr-1" />
                Colors
              </Button>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Quick Templates</h4>
              <div className="grid grid-cols-2 gap-2">
                {['Gaming', 'Tutorial', 'Review', 'Reaction'].map((template) => (
                  <Button
                    key={template}
                    variant="outline"
                    size="sm"
                    disabled={!isPremium}
                    className="text-xs"
                  >
                    {template}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSEOOptimizer = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Video Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="video-title">Video Title</Label>
                <Input
                  id="video-title"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Enter your video title..."
                  maxLength={100}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {videoTitle.length}/100 characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="video-description">Description</Label>
                <Textarea
                  id="video-description"
                  value={videoDescription}
                  onChange={(e) => setVideoDescription(e.target.value)}
                  placeholder="Enter your video description..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {videoDescription.length} characters
                </p>
              </div>
              
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="gaming, tutorial, tips, review"
                />
              </div>
              
              <Button onClick={analyzeSEO} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Analyze SEO Score
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* SEO Score */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>SEO Score</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className={`text-4xl font-bold mb-2 ${
                seoScore >= 75 ? 'text-green-500' :
                seoScore >= 50 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {seoScore}%
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {seoScore >= 75 ? 'Excellent' :
                 seoScore >= 50 ? 'Good' : 'Needs Improvement'}
              </p>
              
              <div className="space-y-2 text-left">
                <h4 className="font-medium text-sm">Optimization Tips:</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Keep title 60-70 characters</li>
                  <li>• Include keywords naturally</li>
                  <li>• Write detailed descriptions</li>
                  <li>• Use 5-15 relevant tags</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTrendAnalyzer = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Trending Topics</span>
              </span>
              <Button onClick={generateTrendingTopics} variant="outline" size="sm">
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendingTopics.length > 0 ? (
              <div className="space-y-3">
                {trendingTopics.map((topic, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="font-medium text-sm">{topic}</span>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs">
                        Hot
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Click "Refresh" to discover trending topics
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Video Ideas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Play className="w-5 h-5" />
                <span>Video Ideas</span>
              </span>
              <Button onClick={generateVideoIdeas} variant="outline" size="sm">
                Generate
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {videoIdeas.length > 0 ? (
              <div className="space-y-4">
                {videoIdeas.map((idea, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm pr-2">{idea.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {idea.difficulty}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      <strong>Hook:</strong> {idea.hook}
                    </p>
                    
                    <div className="text-xs">
                      <strong>Estimated Views:</strong> {idea.estimatedViews}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {idea.keywords.slice(0, 3).map((keyword, kidx) => (
                        <Badge key={kidx} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Play className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Click "Generate" to get video ideas
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
      {activeFeature === 'thumbnail' && renderThumbnailDesigner()}
      {activeFeature === 'seo' && renderSEOOptimizer()}
      {activeFeature === 'trends' && renderTrendAnalyzer()}
      
      {/* Premium Features */}
      {(activeFeature === 'analytics' || activeFeature === 'scripts') && (
        <PaywallBanner
          feature={features.find(f => f.id === activeFeature)?.name || 'Premium Feature'}
          title="Advanced YouTube Tools"
          description="Unlock analytics prediction, script templates, and more professional creator tools"
          variant="prominent"
        />
      )}
    </div>
  );
}