'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Clock,
  Trophy,
  FileText,
  Lightbulb,
  Lock,
  X,
  Bookmark,
  Share2,
  ChevronRight,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface ContentCardProps {
  recommendation: {
    type: 'task' | 'template' | 'tip' | 'resource' | 'milestone';
    content: any;
    score: number;
    reason: string;
    locked?: boolean;
  };
  onAction: (contentId: string, contentType: string, action: string) => void;
}

export default function ContentCard({ recommendation, onAction }: ContentCardProps) {
  const router = useRouter();
  const { type, content, reason, locked } = recommendation;

  if (!content) return null;

  const getIcon = () => {
    switch (type) {
      case 'task':
        return <CheckCircle className="h-5 w-5" />;
      case 'template':
        return <FileText className="h-5 w-5" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5" />;
      case 'milestone':
        return <Trophy className="h-5 w-5" />;
      default:
        return <Star className="h-5 w-5" />;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'task':
        return 'bg-blue-500/10 text-blue-600';
      case 'template':
        return 'bg-purple-500/10 text-purple-600';
      case 'tip':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'milestone':
        return 'bg-green-500/10 text-green-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  const handleClick = () => {
    onAction(content.id, type, 'clicked');

    // Navigate to appropriate page
    switch (type) {
      case 'task':
        router.push('/dashboard?tab=roadmap');
        break;
      case 'template':
        router.push(`/templates/${content.category}`);
        break;
      case 'milestone':
        router.push('/achievements');
        break;
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(content.id, type, 'saved');
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction(content.id, type, 'dismissed');
  };

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all hover:shadow-md",
        locked && "opacity-75"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "p-2 rounded-lg shrink-0",
          getTypeColor()
        )}>
          {getIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1">
              <h4 className="font-medium line-clamp-1">
                {content.title || content.name}
              </h4>
              {locked && (
                <Badge variant="outline" className="mt-1">
                  <Lock className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleSave}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {content.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {type === 'task' && content.timeEstimate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {content.timeEstimate} min
                </span>
              )}
              {type === 'template' && content.uses !== undefined && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {content.uses} uses
                </span>
              )}
              {content.difficulty && (
                <Badge variant="secondary" className="text-xs">
                  {content.difficulty}
                </Badge>
              )}
            </div>
            
            <span className="text-xs text-muted-foreground">
              {reason}
            </span>
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>
    </Card>
  );
}