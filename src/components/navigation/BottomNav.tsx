'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Home, 
  Calendar, 
  Lightbulb, 
  Users, 
  Plus,
  Compass,
  Target,
  Sparkles,
  Trophy
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth: boolean;
}

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Home',
      icon: Home,
      requiresAuth: true
    },
    {
      href: '/calendar',
      label: 'Calendar',
      icon: Calendar,
      requiresAuth: true
    },
    {
      href: '/ideas',
      label: 'Ideas',
      icon: Lightbulb,
      requiresAuth: true
    },
    {
      href: '/community',
      label: 'Community',
      icon: Users,
      requiresAuth: true
    }
  ];

  // Hide/show navigation on scroll
  useEffect(() => {
    const controlNavbar = () => {
      if (typeof window !== 'undefined') {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
          // Scrolling down & past threshold
          setIsVisible(false);
        } else {
          // Scrolling up
          setIsVisible(true);
        }
        setLastScrollY(window.scrollY);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', controlNavbar);
      return () => {
        window.removeEventListener('scroll', controlNavbar);
      };
    }
  }, [lastScrollY]);

  // Don't show on auth pages or if not authenticated
  if (pathname?.startsWith('/auth') || !session) {
    return null;
  }

  // Only show on mobile
  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50 md:hidden",
      "transition-transform duration-300",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      {/* Background blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-lg border-t" />
      
      {/* Navigation */}
      <nav className="relative">
        <div className="flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center",
                  "w-full py-2 px-1",
                  "transition-all duration-200",
                  "relative group"
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
                
                {/* Icon container */}
                <div className={cn(
                  "relative p-1",
                  "transition-all duration-200",
                  isActive && "scale-110"
                )}>
                  <Icon className={cn(
                    "w-6 h-6 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                    "group-hover:text-primary"
                  )} />
                  
                  {/* Hover effect */}
                  <div className={cn(
                    "absolute inset-0 bg-primary/10 rounded-lg",
                    "scale-0 group-hover:scale-100",
                    "transition-transform duration-200"
                  )} />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-xs mt-1",
                  "transition-colors duration-200",
                  isActive ? "text-primary font-medium" : "text-muted-foreground",
                  "group-hover:text-primary"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          
          {/* Floating Action Button */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <Link
              href="/templates/generate"
              className={cn(
                "flex items-center justify-center",
                "w-14 h-14 rounded-full",
                "bg-gradient-to-br from-purple-500 to-pink-500",
                "text-white shadow-lg",
                "hover:shadow-xl hover:scale-105",
                "transition-all duration-200",
                "group"
              )}
            >
              <Plus className="w-6 h-6" />
              <span className="sr-only">Generate Content</span>
              
              {/* Pulse effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-300" />
            </Link>
          </div>
        </div>
        
        {/* Safe area padding for devices with home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </nav>
    </div>
  );
}