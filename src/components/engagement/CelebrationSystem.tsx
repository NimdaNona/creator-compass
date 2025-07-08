'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { CelebrationModal } from './CelebrationModal';

export function CelebrationSystem() {
  const { activeCelebrations, removeCelebration } = useAppStore();

  // Auto-remove celebrations after their duration
  useEffect(() => {
    activeCelebrations.forEach((celebration) => {
      const timer = setTimeout(() => {
        removeCelebration(celebration.id);
      }, celebration.duration);

      return () => clearTimeout(timer);
    });
  }, [activeCelebrations, removeCelebration]);

  // Only show one celebration at a time (the most recent)
  const currentCelebration = activeCelebrations[activeCelebrations.length - 1];

  if (!currentCelebration) {
    return null;
  }

  return (
    <CelebrationModal
      celebration={currentCelebration}
      onClose={() => removeCelebration(currentCelebration.id)}
    />
  );
}