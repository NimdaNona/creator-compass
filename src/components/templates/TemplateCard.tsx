'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Star,
  Users,
  Lock,
  Zap,
  Edit,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  template: {
    id: string;
    title: string;
    description?: string;
    type: string;
    platform: string;
    rating?: number;
    uses?: number;
    locked?: boolean;
    isUserTemplate?: boolean;
  };
  onUse: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function TemplateCard({ 
  template, 
  onUse, 
  onEdit, 
  onDelete 
}: TemplateCardProps) {
  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube':
        return 'bg-red-500/10 text-red-600';
      case 'tiktok':
        return 'bg-black/10 text-black dark:bg-white/10 dark:text-white';
      case 'twitch':
        return 'bg-purple-500/10 text-purple-600';
      default:
        return 'bg-gray-500/10 text-gray-600';
    }
  };

  return (
    <Card className={cn(
      "p-6 hover:shadow-lg transition-all",
      template.locked && "opacity-75"
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold line-clamp-1">{template.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {template.type}
                </Badge>
                <Badge className={cn("text-xs", getPlatformColor(template.platform))}>
                  {template.platform}
                </Badge>
              </div>
            </div>
          </div>
          {template.locked && (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {template.rating !== undefined && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {template.rating.toFixed(1)}
            </span>
          )}
          {template.uses !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {template.uses} uses
            </span>
          )}
          {template.isUserTemplate && (
            <Badge variant="outline" className="text-xs">
              Custom
            </Badge>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {template.locked ? (
            <Button className="w-full" variant="outline" disabled>
              <Lock className="h-4 w-4 mr-2" />
              Upgrade to Use
            </Button>
          ) : (
            <>
              <Button className="flex-1" onClick={onUse}>
                <Zap className="h-4 w-4 mr-2" />
                Use Template
              </Button>
              {template.isUserTemplate && (
                <>
                  {onEdit && (
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="icon" onClick={onDelete}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}