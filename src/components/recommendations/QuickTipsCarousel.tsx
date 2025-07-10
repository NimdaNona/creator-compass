'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickTip {
  id: string;
  title: string;
  content: string;
  category: string;
}

export default function QuickTipsCarousel() {
  const [tips, setTips] = useState<QuickTip[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const response = await fetch('/api/tips/quick');
      if (!response.ok) throw new Error('Failed to fetch tips');
      
      const data = await response.json();
      setTips(data.tips || []);
    } catch (error) {
      console.error('Error fetching tips:', error);
      // Use fallback tips
      setTips([
        {
          id: '1',
          title: 'Consistency is Key',
          content: 'Post regularly to keep your audience engaged. Aim for at least 2-3 times per week.',
          category: 'growth'
        },
        {
          id: '2',
          title: 'Engage with Comments',
          content: 'Reply to comments within the first hour of posting to boost engagement.',
          category: 'engagement'
        },
        {
          id: '3',
          title: 'Use Analytics',
          content: 'Check your analytics weekly to understand what content performs best.',
          category: 'analytics'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const nextTip = () => {
    setCurrentIndex((prev) => (prev + 1) % tips.length);
  };

  const prevTip = () => {
    setCurrentIndex((prev) => (prev - 1 + tips.length) % tips.length);
  };

  if (loading || tips.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading tips...</p>
      </div>
    );
  }

  const currentTip = tips[currentIndex];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="space-y-2 px-8">
          <h4 className="font-medium text-sm">{currentTip.title}</h4>
          <p className="text-sm text-muted-foreground">
            {currentTip.content}
          </p>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={prevTip}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-6"
          onClick={nextTip}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex justify-center gap-1">
        {tips.map((_, index) => (
          <button
            key={index}
            className={cn(
              "h-1.5 w-1.5 rounded-full transition-all",
              index === currentIndex
                ? "bg-primary w-4"
                : "bg-muted-foreground/30"
            )}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}