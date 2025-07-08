'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaywallBanner } from '@/components/paywall/PaywallBanner';
import { useAppStore } from '@/store/useAppStore';
// Resources will be fetched from API
import {
  Monitor,
  Mic,
  Lightbulb,
  Settings,
  Code,
  Palette,
  Search,
  Star,
  DollarSign,
  ExternalLink,
  ShoppingCart,
  BookOpen,
  Play,
  Download,
  Crown,
  Filter,
  Zap,
  Target,
  Clock,
  CheckCircle
} from 'lucide-react';

interface EquipmentItem {
  id: string;
  name: string;
  type: string;
  price: number;
  rating: number;
  description: string;
  features: string[];
  pros: string[];
  cons: string[];
  platforms: string[];
  image?: string;
  affiliate_link?: string;
  alternatives?: string[];
}

interface SoftwareItem {
  id: string;
  name: string;
  type: string;
  price: number;
  billing?: string;
  rating: number;
  description: string;
  features: string[];
  pros: string[];
  cons: string[];
  platforms: string[];
  download_link?: string;
  web_link?: string;
  premium_price?: number;
  premium_billing?: string;
  system_requirements?: Record<string, string>;
}

export function ResourceLibrary() {
  const { selectedPlatform, subscription } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('equipment');
  const [activeSubcategory, setActiveSubcategory] = useState('cameras');
  const [budgetFilter, setBudgetFilter] = useState<'all' | 'budget' | 'mid' | 'premium'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [resourcesData, setResourcesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isPremium = subscription === 'premium';

  // Fetch resources data
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/resources');
        if (!response.ok) {
          throw new Error('Failed to fetch resources');
        }
        const data = await response.json();
        setResourcesData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resources');
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const categories = [
    { id: 'equipment', name: 'Equipment', icon: Monitor },
    { id: 'software', name: 'Software', icon: Code },
    { id: 'guides', name: 'Guides', icon: BookOpen }
  ];

  const equipmentSubcategories = [
    { id: 'cameras', name: 'Cameras', icon: Monitor },
    { id: 'microphones', name: 'Microphones', icon: Mic },
    { id: 'lighting', name: 'Lighting', icon: Lightbulb },
    { id: 'audio_interfaces', name: 'Audio Interfaces', icon: Settings }
  ];

  const softwareSubcategories = [
    { id: 'video_editing', name: 'Video Editing', icon: Play },
    { id: 'streaming', name: 'Streaming', icon: Monitor },
    { id: 'design', name: 'Design', icon: Palette }
  ];

  const getBudgetRange = (price: number) => {
    if (price === 0) return 'free';
    if (price < 100) return 'budget';
    if (price < 500) return 'mid';
    return 'premium';
  };

  const filterByBudget = (items: any[]) => {
    if (budgetFilter === 'all') return items;
    return items.filter(item => getBudgetRange(item.price) === budgetFilter);
  };

  const filterBySearch = (items: any[]) => {
    if (!searchQuery) return items;
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filterByPlatform = (items: any[]) => {
    if (!selectedPlatform) return items;
    return items.filter(item => 
      item.platforms.includes(selectedPlatform.id) || 
      item.platforms.includes('all')
    );
  };

  const renderEquipmentCard = (item: EquipmentItem, level: string) => (
    <Card key={item.id} className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{item.type}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {item.price === 0 ? 'Free' : `$${item.price}`}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{item.rating}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge variant="outline" className="text-xs capitalize">
            {level}
          </Badge>
          {item.platforms.map((platform) => (
            <Badge key={platform} variant="secondary" className="text-xs">
              {platform}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{item.description}</p>
        
        <div>
          <h4 className="font-medium text-sm mb-2">Key Features:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {item.features.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <h5 className="font-medium text-green-600 mb-1">Pros:</h5>
            <ul className="text-muted-foreground space-y-1">
              {item.pros.slice(0, 2).map((pro, index) => (
                <li key={index}>• {pro}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-red-600 mb-1">Cons:</h5>
            <ul className="text-muted-foreground space-y-1">
              {item.cons.slice(0, 2).map((con, index) => (
                <li key={index}>• {con}</li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {item.affiliate_link && (
            <Button size="sm" className="flex-1" disabled={!isPremium}>
              <ShoppingCart className="w-3 h-3 mr-1" />
              Buy Now
            </Button>
          )}
          <Button variant="outline" size="sm" disabled={!isPremium}>
            <ExternalLink className="w-3 h-3 mr-1" />
            Compare
          </Button>
        </div>
        
        {!isPremium && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <Crown className="w-3 h-3 inline mr-1" />
            Upgrade for affiliate links & detailed comparisons
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSoftwareCard = (item: SoftwareItem, tier: string) => (
    <Card key={item.id} className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{item.type}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              {item.price === 0 ? 'Free' : `$${item.price}`}
              {item.billing && (
                <span className="text-xs text-muted-foreground">/{item.billing}</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{item.rating}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1 mt-2">
          <Badge 
            variant={tier === 'free' ? 'default' : 'outline'} 
            className="text-xs capitalize"
          >
            {tier}
          </Badge>
          {item.platforms.map((platform) => (
            <Badge key={platform} variant="secondary" className="text-xs">
              {platform}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{item.description}</p>
        
        <div>
          <h4 className="font-medium text-sm mb-2">Features:</h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            {item.features.slice(0, 4).map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {item.system_requirements && (
          <div>
            <h4 className="font-medium text-sm mb-2">System Requirements:</h4>
            <div className="text-xs text-muted-foreground space-y-1">
              {Object.entries(item.system_requirements).map(([os, req]) => (
                <div key={os}>
                  <span className="font-medium capitalize">{os}:</span> {req}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          {(item.download_link || item.web_link) && (
            <Button size="sm" className="flex-1">
              <Download className="w-3 h-3 mr-1" />
              {item.price === 0 ? 'Download' : 'Try Free'}
            </Button>
          )}
          {item.premium_price && (
            <Button variant="outline" size="sm" disabled={!isPremium}>
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderGuideCard = (guide: any) => (
    <Card key={guide.id} className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{guide.title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {guide.difficulty}
          </Badge>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{guide.duration}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{guide.description}</p>
        
        {guide.steps && (
          <div>
            <h4 className="font-medium text-sm mb-2">Steps Overview:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {guide.steps.slice(0, 3).map((step: any, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-xs">
                    {step.step}
                  </span>
                  <span>{step.title}</span>
                </li>
              ))}
              {guide.steps.length > 3 && (
                <li className="text-muted-foreground ml-6">
                  +{guide.steps.length - 3} more steps
                </li>
              )}
            </ul>
          </div>
        )}
        
        {guide.budget_estimate && (
          <div>
            <h4 className="font-medium text-sm mb-2">Budget Estimates:</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="font-medium">Minimal</div>
                <div className="text-muted-foreground">${guide.budget_estimate.minimal}</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="font-medium">Recommended</div>
                <div className="text-muted-foreground">${guide.budget_estimate.recommended}</div>
              </div>
              <div className="text-center p-2 bg-muted/50 rounded">
                <div className="font-medium">Professional</div>
                <div className="text-muted-foreground">${guide.budget_estimate.professional}</div>
              </div>
            </div>
          </div>
        )}
        
        <Button className="w-full" disabled={!isPremium}>
          <BookOpen className="w-4 h-4 mr-2" />
          View Full Guide
        </Button>
        
        {!isPremium && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <Crown className="w-3 h-3 inline mr-1" />
            Premium required for full guides
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading resources...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-red-500 mb-4">
              <ExternalLink className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to Load Resources</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Resource Library</h1>
            <p className="text-muted-foreground">
              Curated equipment, software, and guides for content creators
            </p>
          </div>
          
          {!isPremium && (
            <PaywallBanner
              feature="Full Resource Access"
              title="Unlock Everything"
              description="Get affiliate links, detailed comparisons, and complete setup guides"
              variant="compact"
              className="max-w-sm"
            />
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment, software, or guides..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant={budgetFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBudgetFilter('all')}
            >
              All
            </Button>
            <Button
              variant={budgetFilter === 'budget' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBudgetFilter('budget')}
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Budget
            </Button>
            <Button
              variant={budgetFilter === 'premium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setBudgetFilter('premium')}
            >
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Button>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center space-x-2">
                <Icon className="w-4 h-4" />
                <span>{category.name}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-6">
          {/* Equipment Subcategories */}
          <div className="flex flex-wrap gap-2">
            {equipmentSubcategories.map((subcategory) => {
              const Icon = subcategory.icon;
              return (
                <Button
                  key={subcategory.id}
                  variant={activeSubcategory === subcategory.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveSubcategory(subcategory.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{subcategory.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Equipment Grid */}
          {Object.entries(resourcesData?.resources?.equipment?.[activeSubcategory as keyof typeof resourcesData.resources.equipment] || {}).map(([level, items]) => (
            <div key={level}>
              <h3 className="text-xl font-semibold mb-4 capitalize flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>{level} Level</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterByPlatform(filterBySearch(filterByBudget(items as EquipmentItem[]))).map((item) =>
                  renderEquipmentCard(item, level)
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Software Tab */}
        <TabsContent value="software" className="space-y-6">
          {/* Software Subcategories */}
          <div className="flex flex-wrap gap-2">
            {softwareSubcategories.map((subcategory) => {
              const Icon = subcategory.icon;
              return (
                <Button
                  key={subcategory.id}
                  variant={activeSubcategory === subcategory.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveSubcategory(subcategory.id)}
                  className="flex items-center space-x-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{subcategory.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Software Grid */}
          {Object.entries(resourcesData?.resources?.software?.[activeSubcategory as keyof typeof resourcesData.resources.software] || {}).map(([tier, items]) => (
            <div key={tier}>
              <h3 className="text-xl font-semibold mb-4 capitalize flex items-center space-x-2">
                {tier === 'free' ? <Zap className="w-5 h-5" /> : <Crown className="w-5 h-5" />}
                <span>{tier} Software</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterByPlatform(filterBySearch(filterByBudget(items as SoftwareItem[]))).map((item) =>
                  renderSoftwareCard(item, tier)
                )}
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Guides Tab */}
        <TabsContent value="guides" className="space-y-6">
          {Object.entries(resourcesData?.resources?.guides || {}).map(([guideType, guides]) => (
            <div key={guideType}>
              <h3 className="text-xl font-semibold mb-4 capitalize flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>{guideType.replace('_', ' ')}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterByPlatform(filterBySearch(guides as any[])).map((guide) =>
                  renderGuideCard(guide)
                )}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}