'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';
import { platforms } from '@/lib/data';

export function ProfileLoader({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { 
    setSelectedPlatform, 
    setSelectedNiche, 
    setProgress,
    setOnboardingComplete,
    setUserStats
  } = useAppStore();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      loadUserProfile();
    }
  }, [status, session]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (!response.ok) return;

      const data = await response.json();
      
      if (data.profile) {
        // Set platform and niche from profile
        if (data.profile.selectedPlatform) {
          const platform = platforms.find(p => p.id === data.profile.selectedPlatform);
          if (platform) {
            setSelectedPlatform(platform);
            
            // Set niche if it exists
            if (data.profile.selectedNiche && platform.niches) {
              const niche = platform.niches.find(n => n.id === data.profile.selectedNiche);
              if (niche) {
                setSelectedNiche(niche);
              }
            }
          }
        }

        // Set progress
        if (data.profile.startDate) {
          setProgress({
            userId: session!.user.id,
            selectedPlatform: data.profile.selectedPlatform || '',
            selectedNiche: data.profile.selectedNiche || '',
            currentPhase: data.profile.currentPhase || 1,
            currentWeek: data.profile.currentWeek || 1,
            startDate: new Date(data.profile.startDate),
            completedTasks: data.progress?.map((p: any) => p.taskId) || [],
            streakDays: data.stats?.streakDays || 0,
            totalPoints: data.stats?.totalPoints || 0,
            achievements: data.achievements || [],
            lastUpdated: new Date(),
            goals: data.profile.goals ? JSON.parse(data.profile.goals) : [],
            targetTimeframe: data.profile.targetTimeframe || 90,
            motivation: data.profile.motivation || ''
          });
        }

        // Set stats
        if (data.stats) {
          setUserStats(data.stats);
        }

        // Mark onboarding as complete if profile exists
        if (data.profile.selectedPlatform && data.profile.selectedNiche) {
          setOnboardingComplete(true);
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  return <>{children}</>;
}