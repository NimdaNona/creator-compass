import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuthenticatedUser } from '@/hooks/useAuthenticatedUser';
import { useSession } from 'next-auth/react';
import { useUserStore } from '@/store/useUserStore';
import { useAppStore } from '@/store/useAppStore';

// Mock all dependencies
vi.mock('next-auth/react');
vi.mock('@/store/useUserStore');
vi.mock('@/store/useAppStore');

const mockUseSession = useSession as any;
const mockUseUserStore = useUserStore as any;
const mockUseAppStore = useAppStore as any;

describe('useAuthenticatedUser', () => {
  const mockUserStore = {
    profile: null,
    progress: [],
    achievements: [],
    stats: null,
    celebrations: [],
    activeCelebrations: [],
    selectedPlatform: null,
    selectedNiche: null,
    isLoading: false,
    error: null,
    fetchUserData: vi.fn(),
    updateProfile: vi.fn(),
    completeTask: vi.fn(),
    addAchievement: vi.fn(),
    addCelebration: vi.fn(),
    markCelebrationsAsRead: vi.fn(),
    setSelectedPlatform: vi.fn(),
    setSelectedNiche: vi.fn(),
    isTaskCompleted: vi.fn(),
    getCompletedTasksCount: vi.fn(),
    getTotalPoints: vi.fn(),
    getCurrentStreak: vi.fn(),
    reset: vi.fn(),
  };

  const mockAppStore = {
    selectedPlatform: null,
    selectedNiche: null,
    theme: 'light',
    setTheme: vi.fn(),
    subscription: 'free',
    setSubscription: vi.fn(),
    setSelectedPlatform: vi.fn(),
    setSelectedNiche: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserStore.mockReturnValue(mockUserStore);
    mockUseAppStore.mockReturnValue(mockAppStore);
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should return unauthenticated state', () => {
      const { result } = renderHook(() => useAuthenticatedUser());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeUndefined();
      expect(result.current.session).toBeNull();
    });

    it('should not fetch user data', () => {
      renderHook(() => useAuthenticatedUser());

      expect(mockUserStore.fetchUserData).not.toHaveBeenCalled();
    });
  });

  describe('when user is authenticated', () => {
    const mockSession = {
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
      },
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
      });
    });

    it('should return authenticated state', () => {
      const { result } = renderHook(() => useAuthenticatedUser());

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockSession.user);
      expect(result.current.session).toEqual(mockSession);
    });

    it('should fetch user data when profile is not loaded', async () => {
      renderHook(() => useAuthenticatedUser());

      await waitFor(() => {
        expect(mockUserStore.fetchUserData).toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should not fetch user data when profile already exists', () => {
      mockUseUserStore.mockReturnValue({
        ...mockUserStore,
        profile: { id: 'profile-1', userId: 'user-1' },
      });

      renderHook(() => useAuthenticatedUser());

      expect(mockUserStore.fetchUserData).not.toHaveBeenCalled();
    });

    it('should not fetch user data when already loading', () => {
      mockUseUserStore.mockReturnValue({
        ...mockUserStore,
        isLoading: true,
      });

      renderHook(() => useAuthenticatedUser());

      expect(mockUserStore.fetchUserData).not.toHaveBeenCalled();
    });
  });

  describe('loading states', () => {
    it('should return loading when session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
      });

      const { result } = renderHook(() => useAuthenticatedUser());

      expect(result.current.isLoading).toBe(true);
    });

    it('should return loading when user store is loading', () => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1' } },
        status: 'authenticated',
      });
      mockUseUserStore.mockReturnValue({
        ...mockUserStore,
        isLoading: true,
      });

      const { result } = renderHook(() => useAuthenticatedUser());

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('actions', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1' } },
        status: 'authenticated',
      });
    });

    it('should provide user store actions', () => {
      const { result } = renderHook(() => useAuthenticatedUser());

      expect(result.current.updateProfile).toBe(mockUserStore.updateProfile);
      expect(result.current.completeTask).toBe(mockUserStore.completeTask);
      expect(result.current.addAchievement).toBe(mockUserStore.addAchievement);
    });

    it('should sync platform selection between stores', () => {
      const { result } = renderHook(() => useAuthenticatedUser());
      const mockPlatform = { id: 'youtube', name: 'YouTube' };

      result.current.setSelectedPlatform(mockPlatform);

      expect(mockUserStore.setSelectedPlatform).toHaveBeenCalledWith(mockPlatform);
      expect(mockAppStore.setSelectedPlatform).toHaveBeenCalledWith(mockPlatform);
    });

    it('should sync niche selection between stores', () => {
      const { result } = renderHook(() => useAuthenticatedUser());
      const mockNiche = { id: 'gaming', name: 'Gaming' };

      result.current.setSelectedNiche(mockNiche);

      expect(mockUserStore.setSelectedNiche).toHaveBeenCalledWith(mockNiche);
      expect(mockAppStore.setSelectedNiche).toHaveBeenCalledWith(mockNiche);
    });

    it('should reset both stores', () => {
      const { result } = renderHook(() => useAuthenticatedUser());

      result.current.reset();

      expect(mockUserStore.reset).toHaveBeenCalled();
      expect(mockAppStore.reset).toHaveBeenCalled();
    });
  });

  describe('backward compatibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1' } },
        status: 'authenticated',
      });
    });

    it('should provide app store theme and subscription', () => {
      const { result } = renderHook(() => useAuthenticatedUser());

      expect(result.current.theme).toBe(mockAppStore.theme);
      expect(result.current.setTheme).toBe(mockAppStore.setTheme);
      expect(result.current.subscription).toBe(mockAppStore.subscription);
      expect(result.current.setSubscription).toBe(mockAppStore.setSubscription);
    });

    it('should fallback to app store for platform/niche selection', () => {
      const mockPlatform = { id: 'youtube', name: 'YouTube' };
      mockUseAppStore.mockReturnValue({
        ...mockAppStore,
        selectedPlatform: mockPlatform,
      });

      const { result } = renderHook(() => useAuthenticatedUser());

      expect(result.current.selectedPlatform).toBe(mockPlatform);
    });
  });
});