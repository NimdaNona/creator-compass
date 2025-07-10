'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Eye,
  Lock,
  Crown,
  Play,
  X,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BarChart3,
  FileDown,
  Users,
  TrendingUp,
  Zap,
  Target
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface FeaturePreviewProps {
  feature: 'analytics' | 'export' | 'cross-platform' | 'advanced-templates';
  title: string;
  description: string;
  children?: React.ReactNode;
  variant?: 'inline' | 'card' | 'modal';
  className?: string;
}

export function FeaturePreview({ 
  feature, 
  title, 
  description, 
  children,
  variant = 'card',
  className 
}: FeaturePreviewProps) {
  const router = useRouter();
  const { subscription, isActive } = useSubscription();
  const [showPreview, setShowPreview] = useState(false);
  const isPremium = isActive && subscription?.plan !== 'free';

  if (isPremium) {
    return <>{children}</>;
  }

  const getFeatureDetails = () => {
    switch (feature) {
      case 'analytics':
        return {
          icon: BarChart3,
          color: 'text-blue-500',
          benefits: [
            'Detailed growth metrics and trends',
            'Content performance analytics',
            'Audience insights and demographics',
            'Competitor comparison tools',
            'Custom reports and exports'
          ],
          previewImage: '/images/analytics-preview.png'
        };
      case 'export':
        return {
          icon: FileDown,
          color: 'text-green-500',
          benefits: [
            'Export roadmaps as PDF',
            'Download analytics reports',
            'CSV data exports',
            'Template library downloads',
            'Bulk content exports'
          ],
          previewImage: '/images/export-preview.png'
        };
      case 'cross-platform':
        return {
          icon: Users,
          color: 'text-purple-500',
          benefits: [
            'Manage all platforms in one place',
            'Cross-platform content strategies',
            'Unified analytics dashboard',
            'Multi-platform scheduling',
            'Platform-specific optimizations'
          ],
          previewImage: '/images/cross-platform-preview.png'
        };
      case 'advanced-templates':
        return {
          icon: Sparkles,
          color: 'text-pink-500',
          benefits: [
            'AI-powered content generation',
            'Industry-specific templates',
            'Custom template creation',
            'Template sharing and collaboration',
            'Advanced customization options'
          ],
          previewImage: '/images/templates-preview.png'
        };
      default:
        return {
          icon: Lock,
          color: 'text-gray-500',
          benefits: [],
          previewImage: ''
        };
    }
  };

  const details = getFeatureDetails();
  const Icon = details.icon;

  const handleUpgrade = () => {
    router.push('/pricing');
  };

  const PreviewContent = () => (
    <div className="space-y-6">
      {/* Feature Header */}
      <div className="text-center space-y-2">
        <div className={cn(
          "w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-muted",
          details.color
        )}>
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-bold">{title}</h3>
        <p className="text-muted-foreground max-w-md mx-auto">{description}</p>
      </div>

      {/* Mock Preview */}
      <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
        <div className="relative aspect-video bg-muted flex items-center justify-center">
          {details.previewImage ? (
            <div className="blur-sm opacity-50">
              {/* Placeholder for actual preview image */}
              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950 dark:to-pink-950" />
            </div>
          ) : (
            <div className="text-center p-8">
              <Icon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Preview not available</p>
            </div>
          )}
        </div>
        
        {/* Overlay Play Button */}
        <button
          onClick={() => setShowPreview(true)}
          className="absolute inset-0 z-20 flex items-center justify-center group"
        >
          <div className="w-20 h-20 rounded-full bg-background/90 backdrop-blur-sm border-2 flex items-center justify-center transition-transform group-hover:scale-110">
            <Play className="w-8 h-8 ml-1" />
          </div>
        </button>
      </div>

      {/* Benefits List */}
      <div className="space-y-3">
        <h4 className="font-semibold flex items-center space-x-2">
          <Zap className="w-4 h-4" />
          <span>What you'll get:</span>
        </h4>
        <ul className="space-y-2">
          {details.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start space-x-2">
              <ChevronRight className="w-4 h-4 mt-0.5 text-green-500 flex-shrink-0" />
              <span className="text-sm">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleUpgrade}
          className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <Crown className="w-4 h-4 mr-2" />
          Unlock {title}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        {variant === 'modal' && (
          <Button 
            variant="outline" 
            onClick={() => setShowPreview(false)}
            className="flex-1"
          >
            Maybe Later
          </Button>
        )}
      </div>
    </div>
  );

  if (variant === 'inline') {
    return (
      <button
        onClick={() => setShowPreview(true)}
        className={cn(
          "inline-flex items-center space-x-2 text-sm font-medium hover:underline",
          details.color,
          className
        )}
      >
        <Lock className="w-3 h-3" />
        <span>{title}</span>
        <Badge variant="secondary" className="ml-1">
          Premium
        </Badge>
      </button>
    );
  }

  if (variant === 'card') {
    return (
      <>
        <Card 
          className={cn(
            "relative overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg",
            className
          )}
          onClick={() => setShowPreview(true)}
        >
          <div className="absolute top-2 right-2 z-10">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
          
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <div className={cn("p-2 rounded-lg bg-muted", details.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{description}</p>
            <Button variant="outline" size="sm" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              Preview Feature
            </Button>
          </CardContent>
          
          {/* Decorative gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="sr-only">{title} Preview</DialogTitle>
            </DialogHeader>
            <PreviewContent />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Modal variant
  return (
    <AnimatePresence>
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowPreview(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <button
                onClick={() => setShowPreview(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
              
              <PreviewContent />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Feature Preview Wrapper for sections
interface FeatureSectionProps {
  feature: 'analytics' | 'export' | 'cross-platform' | 'advanced-templates';
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export function FeatureSection({
  feature,
  title,
  description,
  children,
  className
}: FeatureSectionProps) {
  const { subscription, isActive } = useSubscription();
  const isPremium = isActive && subscription?.plan !== 'free';

  if (isPremium) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn("relative", className)}>
      {/* Blurred Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <div className="blur-sm opacity-50 pointer-events-none">
          {children}
        </div>
      </div>
      
      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <FeaturePreview
          feature={feature}
          title={title}
          description={description}
          variant="card"
        />
      </div>
    </div>
  );
}