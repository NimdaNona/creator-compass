'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import TemplateCard from './TemplateCard';
import TemplateCreator from './TemplateCreator';
import { AITemplateSuggestions } from './AITemplateSuggestions';
import { Search, Filter, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

interface Template {
  id: string;
  category: string;
  type: string;
  title: string;
  description?: string;
  platform: string;
  niche: string;
  rating?: number;
  uses?: number;
  locked?: boolean;
  isUserTemplate?: boolean;
}

interface Category {
  id: string;
  label: string;
  types: { id: string; label: string }[];
}

export default function TemplateLibrary() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('video_script');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAISuggestions, setShowAISuggestions] = useState(true);
  
  const { data: session } = useSession();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchTemplates();
    }
  }, [selectedCategory, selectedType]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/templates/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const data = await response.json();
      setCategories(data.categories);
      
      // Set first category as default
      if (data.categories.length > 0 && !selectedCategory) {
        setSelectedCategory(data.categories[0].id);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load template categories');
    }
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(selectedType && { type: selectedType })
      });
      
      const response = await fetch(`/api/templates/${selectedCategory}?${params}`);
      if (!response.ok) throw new Error('Failed to fetch templates');
      
      const data = await response.json();
      setTemplates(data.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentCategory = categories.find(c => c.id === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Template Library</h2>
          <p className="text-muted-foreground">
            Ready-to-use templates to accelerate your content creation
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showAISuggestions ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAISuggestions(!showAISuggestions)}
          >
            {showAISuggestions ? 'Hide' : 'Show'} AI Suggestions
          </Button>
          <TemplateCreator />
        </div>
      </div>

      {/* AI Suggestions */}
      {showAISuggestions && session && (
        <AITemplateSuggestions
          userLevel={session.user?.creatorLevel}
          platform={selectedCategory}
          niche={session.user?.niche}
          className="mb-6"
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            {/* Type Filter */}
            {category.types.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedType === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                >
                  All Types
                </Button>
                {category.types.map(type => (
                  <Button
                    key={type.id}
                    variant={selectedType === type.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedType(type.id)}
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            )}

            {/* Templates Grid */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-48" />
                ))}
              </div>
            ) : filteredTemplates.length === 0 ? (
              <Card className="p-12 text-center bg-gradient-to-br from-muted/50 to-muted/30 border-dashed animate-fadeIn">
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center animate-pulse">
                    <Search className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery ? `No templates match "${searchQuery}"` : 'No templates available for this selection'}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    {(searchQuery || selectedType) && (
                      <Button variant="outline" onClick={() => {
                        setSearchQuery('');
                        setSelectedType(null);
                      }}>
                        <Filter className="w-4 h-4 mr-2" />
                        Clear Filters
                      </Button>
                    )}
                    <Button onClick={() => setShowAISuggestions(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Get AI Suggestions
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map(template => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => {
                      // Navigate to template generator
                      window.location.href = `/templates/generate/${template.id}`;
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}