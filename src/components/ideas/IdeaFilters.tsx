'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Filter,
  RefreshCw,
  Zap,
  Clock,
  Target,
  TrendingUp,
  Users,
  DollarSign
} from 'lucide-react';

export function IdeaFilters() {
  const [contentTypes, setContentTypes] = useState<string[]>(['all']);
  const [difficulty, setDifficulty] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<number[]>([5, 30]);
  const [engagement, setEngagement] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>(['all']);

  const handleContentTypeToggle = (type: string) => {
    if (type === 'all') {
      setContentTypes(['all']);
    } else {
      const filtered = contentTypes.filter(t => t !== 'all');
      if (filtered.includes(type)) {
        const newTypes = filtered.filter(t => t !== type);
        setContentTypes(newTypes.length > 0 ? newTypes : ['all']);
      } else {
        setContentTypes([...filtered, type]);
      }
    }
  };

  const handleCategoryToggle = (category: string) => {
    if (category === 'all') {
      setCategories(['all']);
    } else {
      const filtered = categories.filter(c => c !== 'all');
      if (filtered.includes(category)) {
        const newCategories = filtered.filter(c => c !== category);
        setCategories(newCategories.length > 0 ? newCategories : ['all']);
      } else {
        setCategories([...filtered, category]);
      }
    }
  };

  const resetFilters = () => {
    setContentTypes(['all']);
    setDifficulty('all');
    setTimeRange([5, 30]);
    setEngagement('all');
    setCategories(['all']);
  };

  const contentTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'video', label: 'Long Videos' },
    { value: 'short', label: 'Shorts' },
    { value: 'stream', label: 'Streams' },
    { value: 'series', label: 'Series' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'trending', label: 'Trending' },
    { value: 'evergreen', label: 'Evergreen' },
    { value: 'seasonal', label: 'Seasonal' },
    { value: 'educational', label: 'Educational' },
    { value: 'entertainment', label: 'Entertainment' }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            className="h-7 text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Content Types */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Content Types</Label>
          <div className="space-y-2">
            {contentTypeOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${option.value}`}
                  checked={contentTypes.includes(option.value)}
                  onCheckedChange={() => handleContentTypeToggle(option.value)}
                />
                <Label
                  htmlFor={`type-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Difficulty
          </Label>
          <RadioGroup value={difficulty} onValueChange={setDifficulty}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="diff-all" />
              <Label htmlFor="diff-all" className="text-sm font-normal cursor-pointer">
                All Levels
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="easy" id="diff-easy" />
              <Label htmlFor="diff-easy" className="text-sm font-normal cursor-pointer">
                Easy
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="diff-medium" />
              <Label htmlFor="diff-medium" className="text-sm font-normal cursor-pointer">
                Medium
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="hard" id="diff-hard" />
              <Label htmlFor="diff-hard" className="text-sm font-normal cursor-pointer">
                Hard
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Production Time */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Production Time
          </Label>
          <div className="px-1">
            <Slider
              value={timeRange}
              onValueChange={setTimeRange}
              min={5}
              max={120}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{timeRange[0]} min</span>
              <span>{timeRange[1]} min</span>
            </div>
          </div>
        </div>

        {/* Expected Engagement */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Expected Engagement
          </Label>
          <RadioGroup value={engagement} onValueChange={setEngagement}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="eng-all" />
              <Label htmlFor="eng-all" className="text-sm font-normal cursor-pointer">
                All Levels
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="high" id="eng-high" />
              <Label htmlFor="eng-high" className="text-sm font-normal cursor-pointer">
                High
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="eng-medium" />
              <Label htmlFor="eng-medium" className="text-sm font-normal cursor-pointer">
                Medium
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="low" id="eng-low" />
              <Label htmlFor="eng-low" className="text-sm font-normal cursor-pointer">
                Low Risk
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Categories */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Target className="w-4 h-4" />
            Categories
          </Label>
          <div className="space-y-2">
            {categoryOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`cat-${option.value}`}
                  checked={categories.includes(option.value)}
                  onCheckedChange={() => handleCategoryToggle(option.value)}
                />
                <Label
                  htmlFor={`cat-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Apply Filters Button */}
        <Button className="w-full" size="sm">
          Apply Filters
        </Button>
      </CardContent>
    </Card>
  );
}