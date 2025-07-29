'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  HelpCircle, 
  Lightbulb, 
  X,
  ChevronRight,
  Info,
  BookOpen,
  Zap,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface HelpTooltip {
  id: string;
  target: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  icon?: React.ReactNode;
  actionText?: string;
  actionUrl?: string;
  priority: 'high' | 'medium' | 'low';
}

export function ContextualHelpTooltips() {
  const [activeTooltips, setActiveTooltips] = useState<HelpTooltip[]>([]);
  const [dismissedTooltips, setDismissedTooltips] = useState<Set<string>>(new Set());
  const [currentTooltip, setCurrentTooltip] = useState<HelpTooltip | null>(null);

  useEffect(() => {
    // Load dismissed tooltips from localStorage
    const dismissed = localStorage.getItem('dismissedTooltips');
    if (dismissed) {
      setDismissedTooltips(new Set(JSON.parse(dismissed)));
    }

    // Load contextual tooltips based on current page and user state
    loadContextualTooltips();
  }, []);

  const loadContextualTooltips = async () => {
    try {
      const response = await fetch('/api/ai/help/tooltips');
      if (!response.ok) return;
      
      const data = await response.json();
      const visibleTooltips = data.tooltips.filter(
        (tooltip: HelpTooltip) => !dismissedTooltips.has(tooltip.id)
      );
      
      setActiveTooltips(visibleTooltips);
      
      // Show the highest priority tooltip first
      if (visibleTooltips.length > 0) {
        const highPriorityTooltip = visibleTooltips.find((t: HelpTooltip) => t.priority === 'high') || visibleTooltips[0];
        setCurrentTooltip(highPriorityTooltip);
      }
    } catch (error) {
      console.error('Error loading tooltips:', error);
    }
  };

  const dismissTooltip = (tooltipId: string) => {
    const newDismissed = new Set(dismissedTooltips).add(tooltipId);
    setDismissedTooltips(newDismissed);
    localStorage.setItem('dismissedTooltips', JSON.stringify(Array.from(newDismissed)));
    
    // Remove from active tooltips
    setActiveTooltips(activeTooltips.filter(t => t.id !== tooltipId));
    
    // Show next tooltip if available
    const remaining = activeTooltips.filter(t => t.id !== tooltipId);
    if (remaining.length > 0) {
      setCurrentTooltip(remaining[0]);
    } else {
      setCurrentTooltip(null);
    }

    // Track dismissal
    fetch('/api/ai/journey', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'dismiss_tooltip',
        data: { tooltipId }
      })
    });
  };

  const handleAction = (tooltip: HelpTooltip) => {
    if (tooltip.actionUrl) {
      window.location.href = tooltip.actionUrl;
    }
    dismissTooltip(tooltip.id);
  };

  const getTooltipIcon = (tooltip: HelpTooltip) => {
    if (tooltip.icon) return tooltip.icon;
    
    switch (tooltip.priority) {
      case 'high':
        return <Zap className="h-4 w-4" />;
      case 'medium':
        return <Lightbulb className="h-4 w-4" />;
      case 'low':
        return <Info className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const getTooltipStyles = (tooltip: HelpTooltip) => {
    const element = document.querySelector(tooltip.target);
    if (!element) return {};
    
    const bounds = element.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 150; // Approximate
    const offset = 10;
    
    switch (tooltip.position) {
      case 'top':
        return {
          bottom: window.innerHeight - bounds.top + offset,
          left: Math.max(10, Math.min(window.innerWidth - tooltipWidth - 10, bounds.left + (bounds.width - tooltipWidth) / 2))
        };
      case 'bottom':
        return {
          top: bounds.bottom + offset,
          left: Math.max(10, Math.min(window.innerWidth - tooltipWidth - 10, bounds.left + (bounds.width - tooltipWidth) / 2))
        };
      case 'left':
        return {
          top: bounds.top + (bounds.height - tooltipHeight) / 2,
          right: window.innerWidth - bounds.left + offset
        };
      case 'right':
        return {
          top: bounds.top + (bounds.height - tooltipHeight) / 2,
          left: bounds.right + offset
        };
      default:
        return {};
    }
  };

  // Floating help button
  const [showHelpMenu, setShowHelpMenu] = useState(false);

  return (
    <>
      {/* Current Active Tooltip */}
      <AnimatePresence>
        {currentTooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 pointer-events-none"
            style={getTooltipStyles(currentTooltip)}
          >
            <Card className="w-80 shadow-lg pointer-events-auto border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "p-1.5 rounded",
                      currentTooltip.priority === 'high' ? 'bg-red-100 text-red-600' :
                      currentTooltip.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-blue-100 text-blue-600'
                    )}>
                      {getTooltipIcon(currentTooltip)}
                    </div>
                    <CardTitle className="text-sm">{currentTooltip.title}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => dismissTooltip(currentTooltip.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  {currentTooltip.content}
                </p>
                
                {currentTooltip.actionText && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => handleAction(currentTooltip)}
                  >
                    {currentTooltip.actionText}
                    <ChevronRight className="ml-2 h-3 w-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Help Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <AnimatePresence>
          {activeTooltips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="relative"
            >
              <Button
                variant="outline"
                size="sm"
                className="rounded-full h-10 w-10 p-0 shadow-lg relative"
                onClick={() => setShowHelpMenu(!showHelpMenu)}
              >
                <HelpCircle className="h-5 w-5" />
                {activeTooltips.length > 1 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center"
                    variant="destructive"
                  >
                    {activeTooltips.length}
                  </Badge>
                )}
              </Button>

              {/* Help Menu */}
              <AnimatePresence>
                {showHelpMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-12 right-0 w-64"
                  >
                    <Card className="shadow-xl">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Available Tips
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {activeTooltips.map((tooltip) => (
                          <Button
                            key={tooltip.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-left"
                            onClick={() => {
                              setCurrentTooltip(tooltip);
                              setShowHelpMenu(false);
                            }}
                          >
                            <div className={cn(
                              "p-1 rounded mr-2",
                              tooltip.priority === 'high' ? 'bg-red-100' :
                              tooltip.priority === 'medium' ? 'bg-yellow-100' :
                              'bg-blue-100'
                            )}>
                              {getTooltipIcon(tooltip)}
                            </div>
                            <span className="text-xs truncate">{tooltip.title}</span>
                          </Button>
                        ))}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}