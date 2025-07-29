import { cn } from "@/lib/utils"

function Skeleton({ 
  className, 
  variant = "default",
  ...props 
}: React.ComponentProps<"div"> & {
  variant?: "default" | "text" | "circular" | "rectangular" | "wave"
}) {
  const variants = {
    default: "bg-muted",
    text: "bg-muted h-4 w-full",
    circular: "bg-muted rounded-full",
    rectangular: "bg-muted rounded-none",
    wave: "bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]"
  }

  const animation = variant === "wave" 
    ? "animate-shimmer" 
    : "animate-pulse"

  return (
    <div
      data-slot="skeleton"
      className={cn(
        "rounded-md",
        variants[variant],
        animation,
        className
      )}
      {...props}
    />
  )
}

// Skeleton components for common UI patterns
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonAvatar({ className }: { className?: string }) {
  return (
    <Skeleton 
      variant="circular" 
      className={cn("h-10 w-10", className)} 
    />
  )
}

function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          className={cn(
            i === lines - 1 && "w-4/5"
          )} 
        />
      ))}
    </div>
  )
}

function SkeletonButton({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-10 w-24 rounded-md", className)} />
  )
}

function SkeletonDashboard() {
  return (
    <div className="grid gap-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <SkeletonButton />
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
        </div>
      </div>
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonCard, 
  SkeletonAvatar, 
  SkeletonText, 
  SkeletonButton,
  SkeletonDashboard 
}
