'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import {
  Compass,
  Crown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

export function Header() {
  const { data: session, status } = useSession();
  const { subscription, theme, setTheme } = useAppStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
  };

  const user = session?.user;
  const isAuthenticated = !!user;

  // Navigation items for authenticated users
  const authenticatedNavItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/foryou', label: 'For You' },
    { href: '/calendar', label: 'Calendar' },
    { href: '/ideas', label: 'Ideas' },
    { href: '/templates', label: 'Templates' },
    { href: '/platform-tools', label: 'Platform Tools' },
    { href: '/integrations', label: 'Integrations' },
    { href: '/scheduling', label: 'Scheduling' },
    { href: '/analytics', label: 'Analytics' },
    { href: '/community', label: 'Community' },
    { href: '/resources', label: 'Resources' },
    { href: '/achievements', label: 'Achievements' },
  ];

  // Navigation items for unauthenticated users (public pages)
  const publicNavItems = [
    // { href: '/pricing', label: 'Pricing' }, // Removed per user feedback
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
            <Compass className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Creators AI Compass
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {/* Subscription Badge - Only show for authenticated premium users */}
          {isAuthenticated && subscription === 'premium' && (
            <Badge variant="secondary" className="hidden sm:flex items-center space-x-1">
              <Crown className="h-3 w-3" />
              <span>Premium</span>
            </Badge>
          )}

          {/* Theme Toggle - Only show for authenticated users */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="hidden sm:flex"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
          )}

          {/* Notifications - Only show for authenticated users */}
          {isAuthenticated && <NotificationBell />}

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || ''} />
                <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t animate-fadeIn">
          <nav className="container py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile User Section */}
            {isAuthenticated ? (
              <div className="border-t pt-4 mt-4 space-y-2">
                <div className="flex items-center px-4 py-2 space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    {subscription === 'premium' && (
                      <Badge variant="secondary" className="mt-1">
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4"
                  onClick={() => {
                    setTheme(theme === 'light' ? 'dark' : 'light');
                    setMobileMenuOpen(false);
                  }}
                >
                  {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start px-4 text-destructive hover:text-destructive"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="border-t pt-4 mt-4 space-y-2">
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/auth/signin" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}