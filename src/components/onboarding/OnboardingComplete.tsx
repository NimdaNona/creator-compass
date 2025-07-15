'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  Sparkles, 
  Target, 
  Calendar,
  TrendingUp,
  Users,
  PlayCircle,
  Gift,
  ArrowRight
} from 'lucide-react';

interface OnboardingCompleteProps {
  onNext: () => void;
}

export function OnboardingComplete({ onNext }: OnboardingCompleteProps) {
  const router = useRouter();
  const { selectedPlatform, selectedNiche, progress, initialize } = useAppStore();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize the app state and create initial progress
    initialize();
    
    // Save onboarding data to database
    const saveOnboardingData = async () => {
      if (!selectedPlatform || !selectedNiche) return;
      
      setSaving(true);
      try {
        const response = await fetch('/api/user/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            selectedPlatform: selectedPlatform.id,
            selectedNiche: selectedNiche.id,
            currentPhase: 1,
            currentWeek: 1,
            goals: progress?.goals || [],
            targetTimeframe: progress?.targetTimeframe || 90,
            motivation: progress?.motivation || '',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save profile');
        }

        toast.success('Your profile has been created successfully!');
      } catch (error) {
        console.error('Error saving profile:', error);
        toast.error('Failed to save your profile. Please try again.');
      } finally {
        setSaving(false);
      }
    };

    saveOnboardingData();
  }, [initialize, selectedPlatform, selectedNiche, progress]);

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const handleExploreTemplates = () => {
    router.push('/templates');
  };

  if (!selectedPlatform || !selectedNiche) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Animation */}
      <div className="text-center mb-12">
        <div className="relative">
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full mx-auto flex items-center justify-center mb-6 animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -inset-4 bg-green-100 dark:bg-green-900/20 rounded-full opacity-50 animate-ping"></div>
        </div>
        
        <h2 className="text-4xl font-bold mb-4 gradient-text">
          🎉 Setup Complete!
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your personalized creator roadmap is ready! We've created a tailored 
          90-day strategy to help you grow your {selectedPlatform.displayName} {selectedNiche.name} channel.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Your Setup */}
        <Card className="border-2 border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Your Creator Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Platform:</span>
              <Badge className={
                selectedPlatform.id === 'youtube' ? 'bg-red-500' :
                selectedPlatform.id === 'tiktok' ? 'bg-black' :
                'bg-purple-500'
              }>
                {selectedPlatform.displayName}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Niche:</span>
              <Badge variant="outline">{selectedNiche.name}</Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Difficulty:</span>
              <Badge variant="secondary" className={
                selectedNiche.difficulty === 'Easy' ? 'text-green-600' :
                selectedNiche.difficulty === 'Medium' ? 'text-yellow-600' :
                'text-red-600'
              }>
                {selectedNiche.difficulty}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Time to monetize:</span>
              <span className="font-medium">{selectedNiche.avgTimeToMonetization}</span>
            </div>
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="border-2 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Your 90-Day Journey</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                1
              </div>
              <div>
                <div className="font-medium">Foundation (Days 1-30)</div>
                <div className="text-sm text-muted-foreground">Setup, branding, first content</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                2
              </div>
              <div>
                <div className="font-medium">Growth (Days 31-60)</div>
                <div className="text-sm text-muted-foreground">Optimization, audience building</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                3
              </div>
              <div>
                <div className="font-medium">Scale (Days 61-90)</div>
                <div className="text-sm text-muted-foreground">Monetization, advanced strategies</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Highlights */}
      <Card className="mb-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="w-5 h-5" />
            <span>What You Get Access To</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Daily Tasks</h4>
              <p className="text-sm text-muted-foreground">
                Step-by-step guidance with actionable tasks every day
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Progress Tracking</h4>
              <p className="text-sm text-muted-foreground">
                Visual progress charts and achievement milestones
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-semibold mb-2">Templates & Tools</h4>
              <p className="text-sm text-muted-foreground">
                Ready-to-use content templates and optimization tools
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" onClick={handleGoToDashboard} disabled={saving} className="px-8">
          <PlayCircle className="w-5 h-5 mr-2" />
          {saving ? 'Saving...' : 'Start Your Journey'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        
        <Button variant="outline" size="lg" onClick={handleExploreTemplates} disabled={saving} className="px-8">
          <Sparkles className="w-5 h-5 mr-2" />
          Explore Templates
        </Button>
      </div>

      {/* Motivational Footer */}
      <div className="text-center mt-12 p-6 bg-muted/30 rounded-xl">
        <h4 className="font-semibold mb-2">🚀 You're Just 90 Days Away</h4>
        <p className="text-muted-foreground">
          Every successful creator started exactly where you are now. 
          Stay consistent, follow your roadmap, and watch your audience grow!
        </p>
      </div>
    </div>
  );
}