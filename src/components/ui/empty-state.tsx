import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'minimal';
  iconClassName?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = 'default',
  iconClassName
}: EmptyStateProps) {
  if (variant === 'minimal') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-8 px-4 text-center",
        className
      )}>
        <Icon className={cn("w-12 h-12 text-muted-foreground/50 mb-3", iconClassName)} />
        <p className="text-sm text-muted-foreground">{title}</p>
        {description && (
          <p className="text-xs text-muted-foreground/70 mt-1">
            {description}
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        "bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-dashed",
        "animate-fadeIn",
        className
      )}>
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6 animate-pulse">
          <Icon className={cn("w-10 h-10 text-purple-600 dark:text-purple-400", iconClassName)} />
        </div>
        <h3 className="text-xl font-semibold mb-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
            {description}
          </p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center animate-fadeIn",
      className
    )}>
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-xl animate-pulse" />
        <div className="relative rounded-full bg-gradient-to-br from-muted to-muted/50 p-4 shadow-lg">
          <Icon className={cn("w-8 h-8 text-foreground/70", iconClassName)} />
        </div>
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}