'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/store/useAppStore';
import { 
  Target, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock,
  CheckCircle,
  Sparkles
} from 'lucide-react';

interface GoalSettingProps {
  onNext: () => void;
}

const predefinedGoals = {
  youtube: [
    { icon: Users, label: '1K Subscribers', value: '1000_subscribers', description: 'Reach YouTube Partner Program eligibility' },
    { icon: Clock, label: '4K Watch Hours', value: '4000_hours', description: 'Meet monetization requirements' },
    { icon: DollarSign, label: 'First $100', value: 'first_100', description: 'Generate initial revenue' },
    { icon: Target, label: 'Viral Video', value: 'viral_video', description: '100K+ views on a single video' },
  ],
  tiktok: [
    { icon: Users, label: '10K Followers', value: '10k_followers', description: 'Unlock TikTok Creator Fund' },
    { icon: Sparkles, label: 'Viral Video', value: 'viral_video', description: '1M+ views on a single video' },
    { icon: DollarSign, label: 'Brand Partnership', value: 'brand_deal', description: 'Land your first sponsored content' },
    { icon: Target, label: 'Consistent Growth', value: 'consistent_growth', description: '1K followers per month' },
  ],
  twitch: [
    { icon: Users, label: 'Twitch Affiliate', value: 'affiliate', description: '50 followers + streaming requirements' },
    { icon: Target, label: 'Twitch Partner', value: 'partner', description: '75 average viewers for 30 days' },
    { icon: DollarSign, label: 'First Donation', value: 'first_donation', description: 'Receive your first viewer support' },
    { icon: Calendar, label: 'Consistent Schedule', value: 'schedule', description: 'Stream 3+ times per week' },
  ],
};

const timeframes = [
  { label: '30 Days', value: '30', description: 'Quick wins and momentum' },
  { label: '90 Days', value: '90', description: 'Recommended timeframe' },
  { label: '6 Months', value: '180', description: 'Sustainable growth' },
  { label: '1 Year', value: '365', description: 'Long-term strategy' },
];

export function GoalSetting({ onNext }: GoalSettingProps) {
  const { selectedPlatform, selectedNiche, updateProgress } = useAppStore();
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('90');
  const [motivation, setMotivation] = useState('');

  if (!selectedPlatform || !selectedNiche) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Please complete the previous steps first.</p>
      </div>
    );
  }

  const platformGoals = predefinedGoals[selectedPlatform.id as keyof typeof predefinedGoals] || [];

  const handleGoalToggle = (goalValue: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalValue) 
        ? prev.filter(g => g !== goalValue)
        : [...prev, goalValue]
    );
  };

  const handleContinue = () => {
    // Save goals to user progress
    const goals = [
      ...selectedGoals,
      ...(customGoal ? [customGoal] : [])
    ];

    updateProgress({
      goals,
      targetTimeframe: parseInt(selectedTimeframe),
      motivation,
      lastUpdated: new Date()
    });

    onNext();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Badge variant="secondary" className="text-sm">
            {selectedPlatform.displayName}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {selectedNiche.name}
          </Badge>
        </div>
        
        <h3 className="text-3xl font-bold mb-4">
          Set Your Goals
        </h3>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Define what success looks like for you. These goals will help us personalize 
          your roadmap and track your progress.
        </p>
      </div>

      {/* Predefined Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Choose Your Primary Goals</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {platformGoals.map((goal) => {
              const Icon = goal.icon;
              const isSelected = selectedGoals.includes(goal.value);
              
              return (
                <div
                  key={goal.value}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                      : 'border-border hover:border-purple-300'
                  }`}
                  onClick={() => handleGoalToggle(goal.value)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isSelected ? 'bg-purple-500 text-white' : 'bg-muted'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{goal.label}</h4>
                        {isSelected && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Custom Goal */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Goal (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="e.g., Get featured on the trending page, collaborate with [creator name]..."
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Timeframe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Target Timeframe</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {timeframes.map((timeframe) => (
              <div
                key={timeframe.value}
                className={`p-4 rounded-lg border cursor-pointer transition-all text-center ${
                  selectedTimeframe === timeframe.value
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' 
                    : 'border-border hover:border-purple-300'
                }`}
                onClick={() => setSelectedTimeframe(timeframe.value)}
              >
                <div className="font-medium">{timeframe.label}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {timeframe.description}
                </div>
                {selectedTimeframe === timeframe.value && (
                  <CheckCircle className="w-4 h-4 text-green-500 mx-auto mt-2" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Motivation */}
      <Card>
        <CardHeader>
          <CardTitle>What's Your Why? (Optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Tell us what motivates you to become a creator. This helps us provide more personalized guidance and keep you motivated during challenging times..."
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="text-center">
        <Button size="lg" onClick={handleContinue} className="px-8">
          Continue to Dashboard
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          You can always update your goals later in your dashboard
        </p>
      </div>
    </div>
  );
}