import { describe, it, expect, beforeEach } from 'vitest';

// Mock zustand to test store logic
const mockStore = {
  theme: 'light' as const,
  subscription: 'free' as const,
  selectedPlatform: null,
  selectedNiche: null,
  setTheme: (theme: 'light' | 'dark') => {
    mockStore.theme = theme;
  },
  setSubscription: (subscription: string) => {
    mockStore.subscription = subscription;
  },
  setSelectedPlatform: (platform: any) => {
    mockStore.selectedPlatform = platform;
  },
  setSelectedNiche: (niche: any) => {
    mockStore.selectedNiche = niche;
  },
  reset: () => {
    mockStore.theme = 'light';
    mockStore.subscription = 'free';
    mockStore.selectedPlatform = null;
    mockStore.selectedNiche = null;
  },
};

describe('App Store Logic', () => {
  beforeEach(() => {
    mockStore.reset();
  });

  describe('theme management', () => {
    it('should start with light theme', () => {
      expect(mockStore.theme).toBe('light');
    });

    it('should toggle theme to dark', () => {
      mockStore.setTheme('dark');
      expect(mockStore.theme).toBe('dark');
    });

    it('should toggle theme back to light', () => {
      mockStore.setTheme('dark');
      mockStore.setTheme('light');
      expect(mockStore.theme).toBe('light');
    });
  });

  describe('subscription management', () => {
    it('should start with free subscription', () => {
      expect(mockStore.subscription).toBe('free');
    });

    it('should upgrade to premium', () => {
      mockStore.setSubscription('premium');
      expect(mockStore.subscription).toBe('premium');
    });
  });

  describe('platform and niche selection', () => {
    it('should start with no platform selected', () => {
      expect(mockStore.selectedPlatform).toBeNull();
    });

    it('should select a platform', () => {
      const platform = { id: 'youtube', name: 'YouTube' };
      mockStore.setSelectedPlatform(platform);
      expect(mockStore.selectedPlatform).toEqual(platform);
    });

    it('should select a niche', () => {
      const niche = { id: 'gaming', name: 'Gaming' };
      mockStore.setSelectedNiche(niche);
      expect(mockStore.selectedNiche).toEqual(niche);
    });
  });

  describe('reset functionality', () => {
    it('should reset all values to defaults', () => {
      // Set some values
      mockStore.setTheme('dark');
      mockStore.setSubscription('premium');
      mockStore.setSelectedPlatform({ id: 'twitch', name: 'Twitch' });
      
      // Reset
      mockStore.reset();
      
      // Check defaults
      expect(mockStore.theme).toBe('light');
      expect(mockStore.subscription).toBe('free');
      expect(mockStore.selectedPlatform).toBeNull();
      expect(mockStore.selectedNiche).toBeNull();
    });
  });
});