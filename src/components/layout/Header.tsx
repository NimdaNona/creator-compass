'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import {
  Menu,
  X,
  Compass,
  Crown,
  Settings,
  LogOut,
  User,
} from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const { subscription, theme, setTheme } = useAppStore();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    closeMenu();
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
    { href: '/analytics', label: 'Analytics' },
    { href: '/resources', label: 'Resources' },
    { href: '/achievements', label: 'Achievements' },
  ];

  // Navigation items for unauthenticated users (public pages)
  const publicNavItems = [
    { href: '/pricing', label: 'Pricing' },
  ];

  const navItems = isAuthenticated ? authenticatedNavItems : publicNavItems;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
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
                <Link href="/auth/signin">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container py-4 space-y-4">
            {/* Navigation Links */}
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href} 
                  className="block px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  onClick={closeMenu}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* User Section */}
            {isAuthenticated ? (
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center space-x-3 px-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.image || ''} />
                    <AvatarFallback>{user.name?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <div className="flex items-center space-x-2">
                      {subscription === 'premium' && (
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <Crown className="h-3 w-3" />
                          <span>Premium</span>
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={closeMenu}
                    asChild
                  >
                    <Link href="/settings/billing">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </Link>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  >
                    {theme === 'light' ? '🌙' : '☀️'}
                    <span className="ml-2">
                      {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
                    </span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-red-600 hover:text-red-700"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4 space-y-2">
                <Button variant="ghost" className="w-full" asChild onClick={closeMenu}>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button className="w-full" asChild onClick={closeMenu}>
                  <Link href="/auth/signin">Get Started</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}