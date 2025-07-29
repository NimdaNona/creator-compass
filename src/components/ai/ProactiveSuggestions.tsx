'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  X, 
  ArrowRight, 
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ProactiveSuggestion {
  id: string;
  message: string;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
  triggerId: string;
}

const TRIGGER_ICONS: Record<string, React.ElementType> = {
  'milestone': Award,
  'inactivity': Clock,
  'pattern': TrendingUp,
  'context': Target,
  'achievement': Sparkles
};

export function ProactiveSuggestions({ className }: { className?: string }) {
  const [suggestions, setSuggestions] = useState<ProactiveSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
    // Refresh suggestions every 5 minutes
    const interval = setInterval(fetchSuggestions, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/ai/proactive/suggestions');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissSuggestion = async (suggestionId: string) => {
    setDismissing(suggestionId);
    try {
      const response = await fetch('/api/ai/proactive/suggestions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestionId })
      });

      if (response.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      }
    } catch (error) {
      console.error('Failed to dismiss suggestion:', error);
    } finally {
      setDismissing(null);
    }
  };

  const getTriggerType = (triggerId: string): string => {
    // Extract trigger type from ID (e.g., 'milestone-first-week' -> 'milestone')
    return triggerId.split('-')[0] || 'context';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'low': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (loading || suggestions.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <AnimatePresence mode="popLayout">
        {suggestions.map((suggestion) => {
          const triggerType = getTriggerType(suggestion.triggerId);
          const Icon = TRIGGER_ICONS[triggerType] || Lightbulb;

          return (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Card className={cn(
                "relative overflow-hidden border-l-4 transition-all",
                "hover:shadow-md",
                suggestion.priority === 'high' ? 'border-l-red-500' :
                suggestion.priority === 'medium' ? 'border-l-yellow-500' :
                'border-l-blue-500'
              )}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      getPriorityColor(suggestion.priority)
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed">
                          {suggestion.message}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0 -mt-1 -mr-1"
                          onClick={() => dismissSuggestion(suggestion.id)}
                          disabled={dismissing === suggestion.id}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {suggestion.actionUrl && (
                        <Link href={suggestion.actionUrl}>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 -ml-2 text-xs"
                          >
                            Take action
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Priority badge */}
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "absolute top-2 right-2 text-[10px]",
                      getPriorityColor(suggestion.priority)
                    )}
                  >
                    {suggestion.priority}
                  </Badge>
                </div>

                {/* Animated background effect for high priority */}
                {suggestion.priority === 'high' && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}