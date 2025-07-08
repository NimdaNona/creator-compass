import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the dependencies
vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {},
}));

vi.mock('@/lib/db', () => ({
  dbUtils: {
    getUserById: vi.fn(),
    updateUserProfile: vi.fn(),
  },
}));

// Import after mocking
const { getServerSession } = await import('next-auth/next');
const { dbUtils } = await import('@/lib/db');

describe('User Profile API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/user/profile', () => {
    it('should return user profile data when authenticated', async () => {
      // Mock session
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-1' },
      });

      // Mock user data
      const mockUser = {
        id: 'user-1',
        profile: { selectedPlatform: 'youtube' },
        stats: { totalPoints: 100 },
        progress: [],
        achievements: [],
      };
      (dbUtils.getUserById as any).mockResolvedValue(mockUser);

      // Mock request
      const request = new NextRequest('http://localhost/api/user/profile');

      // Import and test the handler
      const { GET } = await import('@/app/api/user/profile/route');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        profile: mockUser.profile,
        stats: mockUser.stats,
        progress: mockUser.progress,
        achievements: mockUser.achievements,
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Mock no session
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/user/profile');
      const { GET } = await import('@/app/api/user/profile/route');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 when user not found', async () => {
      // Mock session
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-1' },
      });

      // Mock user not found
      (dbUtils.getUserById as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/user/profile');
      const { GET } = await import('@/app/api/user/profile/route');
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User not found');
    });
  });

  describe('PUT /api/user/profile', () => {
    it('should update user profile when authenticated', async () => {
      // Mock session
      (getServerSession as any).mockResolvedValue({
        user: { id: 'user-1' },
      });

      // Mock profile update
      const updatedProfile = {
        selectedPlatform: 'youtube',
        selectedNiche: 'gaming',
        goals: ['Reach 1000 subscribers'],
      };
      (dbUtils.updateUserProfile as any).mockResolvedValue(updatedProfile);

      // Create request with body
      const requestBody = JSON.stringify({
        selectedPlatform: 'youtube',
        selectedNiche: 'gaming',
        goals: ['Reach 1000 subscribers'],
      });
      
      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PUT',
        body: requestBody,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { PUT } = await import('@/app/api/user/profile/route');
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.profile).toEqual(updatedProfile);
      expect(dbUtils.updateUserProfile).toHaveBeenCalledWith('user-1', {
        selectedPlatform: 'youtube',
        selectedNiche: 'gaming',
        goals: ['Reach 1000 subscribers'],
        currentPhase: undefined,
        currentWeek: undefined,
        preferences: undefined,
        targetTimeframe: undefined,
        motivation: undefined,
      });
    });

    it('should return 401 when not authenticated', async () => {
      // Mock no session
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({}),
      });

      const { PUT } = await import('@/app/api/user/profile/route');
      const response = await PUT(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });
  });
});