'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/hooks/useSubscription';
import {
  Menu,
  X,
  Home,
  Calendar,
  Lightbulb,
  FileText,
  Wrench,
  BarChart3,
  BookOpen,
  Trophy,
  Crown,
  ChevronRight
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Ideas', href: '/ideas', icon: Lightbulb },
  { name: 'Templates', href: '/templates', icon: FileText },
  { name: 'Platform Tools', href: '/platform-tools', icon: Wrench, premium: true },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, premium: true },
  { name: 'Resources', href: '/resources', icon: BookOpen },
  { name: 'Achievements', href: '/achievements', icon: Trophy },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { isActive } = useSubscription();

  return (
    <>
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative md:hidden"
        onClick={() => setIsOpen(true)}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed right-0 top-0 h-full w-80 bg-background border-l z-50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                  <h2 className="text-lg font-semibold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close menu</span>
                  </Button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-4">
                  <ul className="space-y-2">
                    {navigation.map((item) => {
                      const isActive = pathname === item.href;
                      const isLocked = item.premium && !isActive;

                      return (
                        <li key={item.name}>
                          <Link
                            href={isLocked ? '/pricing' : item.href}
                            onClick={() => !isLocked && setIsOpen(false)}
                            className={cn(
                              'flex items-center justify-between px-4 py-3 rounded-lg transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted',
                              isLocked && 'opacity-60'
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <item.icon className="w-5 h-5" />
                              <span className="font-medium">{item.name}</span>
                            </div>
                            {item.premium && !isActive && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Pro
                              </Badge>
                            )}
                            {!isLocked && (
                              <ChevronRight className="w-4 h-4 opacity-50" />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                {/* Footer */}
                {!isActive && (
                  <div className="p-4 border-t">
                    <Link href="/pricing" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}