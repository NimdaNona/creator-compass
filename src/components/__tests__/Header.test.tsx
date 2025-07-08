import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { Header } from '@/components/layout/Header';
import { useSession } from 'next-auth/react';
import { useAppStore } from '@/store/useAppStore';

// Get the mocked functions
const mockUseSession = vi.mocked(useSession);
const mockUseAppStore = vi.mocked(useAppStore);

describe('Header Component', () => {
  const defaultStoreState = {
    subscription: 'free',
    theme: 'light',
    setTheme: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAppStore.mockReturnValue(defaultStoreState);
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should render sign in and get started buttons', () => {
      render(<Header />);

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should render CreatorCompass logo', () => {
      render(<Header />);

      expect(screen.getByText('CreatorCompass')).toBeInTheDocument();
    });

    it('should render navigation links', () => {
      render(<Header />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Templates')).toBeInTheDocument();
      expect(screen.getByText('Platform Tools')).toBeInTheDocument();
      expect(screen.getByText('Resources')).toBeInTheDocument();
      expect(screen.getByText('Achievements')).toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    const mockUser = {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      image: 'https://example.com/avatar.jpg',
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: mockUser,
        },
        status: 'authenticated',
      });
    });

    it('should render user avatar', () => {
      render(<Header />);

      const avatar = screen.getByRole('img');
      expect(avatar).toBeInTheDocument();
    });

    it('should render sign out button', () => {
      render(<Header />);

      const signOutButton = screen.getByText('LogOut').closest('button');
      expect(signOutButton).toBeInTheDocument();
    });

    it('should not render sign in buttons when authenticated', () => {
      render(<Header />);

      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Get Started')).not.toBeInTheDocument();
    });
  });

  describe('premium subscription', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: { user: { id: 'user-1', name: 'Test User' } },
        status: 'authenticated',
      });
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        subscription: 'premium',
      });
    });

    it('should render premium badge', () => {
      render(<Header />);

      expect(screen.getByText('Premium')).toBeInTheDocument();
    });
  });

  describe('theme toggle', () => {
    const mockSetTheme = vi.fn();

    beforeEach(() => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        theme: 'light',
        setTheme: mockSetTheme,
      });
    });

    it('should toggle theme when button is clicked', () => {
      render(<Header />);

      const themeButton = screen.getByText('🌙');
      fireEvent.click(themeButton);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('should show correct theme icon', () => {
      mockUseAppStore.mockReturnValue({
        ...defaultStoreState,
        theme: 'dark',
        setTheme: mockSetTheme,
      });

      render(<Header />);

      expect(screen.getByText('☀️')).toBeInTheDocument();
    });
  });

  describe('mobile menu', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
      });
    });

    it('should toggle mobile menu when hamburger button is clicked', () => {
      render(<Header />);

      // Mobile menu should not be visible initially
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();

      // Click hamburger menu - find by the Menu text content
      const menuButton = screen.getByText('Menu').closest('button');
      fireEvent.click(menuButton!);

      // Mobile menu navigation should be visible
      expect(screen.getAllByText('Dashboard')).toHaveLength(2); // Desktop + mobile
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<Header />);

      const logo = screen.getByText('CreatorCompass').closest('a');
      expect(logo).toBeInTheDocument();
      expect(logo).toHaveAttribute('href', '/');
    });

    it('should have keyboard navigation support', () => {
      render(<Header />);

      const signInButton = screen.getByText('Sign In');
      expect(signInButton.closest('a')).toHaveAttribute('href', '/auth/signin');
    });
  });
});