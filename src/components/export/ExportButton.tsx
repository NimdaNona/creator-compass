'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PaywallModal } from '@/components/paywall/PaywallModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Download, FileText, FileSpreadsheet, FileJson, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExportOption {
  format: 'pdf' | 'csv' | 'json';
  label: string;
  icon: React.ElementType;
  premium?: boolean;
}

interface ExportButtonProps {
  onExport: (format: 'pdf' | 'csv' | 'json') => Promise<void>;
  options?: ExportOption[];
  label?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  feature?: string; // For tracking which feature is being exported
}

const defaultOptions: ExportOption[] = [
  { format: 'pdf', label: 'Export as PDF', icon: FileText },
  { format: 'csv', label: 'Export as CSV', icon: FileSpreadsheet, premium: true },
  { format: 'json', label: 'Export as JSON', icon: FileJson, premium: true },
];

export function ExportButton({
  onExport,
  options = defaultOptions,
  label = 'Export',
  variant = 'outline',
  size = 'default',
  className,
  disabled,
  feature = 'export'
}: ExportButtonProps) {
  const { subscription, isActive } = useSubscription();
  const { trackUsage, canUseFeature } = useUsageTracking();
  const [isExporting, setIsExporting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [blockedFormat, setBlockedFormat] = useState<string>('');
  
  const isPremium = isActive && subscription?.plan !== 'free';

  const handleExport = async (format: 'pdf' | 'csv' | 'json') => {
    const option = options.find(opt => opt.format === format);
    
    // Check if premium feature
    if (option?.premium && !isPremium) {
      setBlockedFormat(option.label);
      setShowPaywall(true);
      return;
    }
    
    // Check usage limits for premium users
    if (isPremium && !canUseFeature('exports')) {
      setBlockedFormat('Export');
      setShowPaywall(true);
      return;
    }
    
    setIsExporting(true);
    
    try {
      // Track usage for premium users
      if (isPremium) {
        const tracked = await trackUsage('exports');
        if (!tracked) {
          setBlockedFormat('Export');
          setShowPaywall(true);
          return;
        }
      }
      
      await onExport(format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // If only one option and it's not premium, render simple button
  if (options.length === 1 && !options[0].premium) {
    const option = options[0];
    const Icon = option.icon;
    
    return (
      <>
        <Button
          variant={variant}
          size={size}
          onClick={() => handleExport(option.format)}
          disabled={disabled || isExporting}
          className={className}
        >
          <Icon className="w-4 h-4 mr-2" />
          {label}
        </Button>
        
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature="Export"
          title={`Unlock ${blockedFormat}`}
          description="Export functionality is a premium feature. Upgrade to export your data in multiple formats."
          benefits={[
            'Export to PDF, CSV, and JSON',
            'Unlimited exports per month',
            'Custom branding on exports',
            'Bulk export options',
            'Priority processing'
          ]}
        />
      </>
    );
  }

  // Render dropdown for multiple options
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={variant} 
            size={size} 
            disabled={disabled || isExporting}
            className={className}
          >
            <Download className="w-4 h-4 mr-2" />
            {label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Format</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {options.map((option) => {
            const Icon = option.icon;
            const isLocked = option.premium && !isPremium;
            
            return (
              <DropdownMenuItem
                key={option.format}
                onClick={() => handleExport(option.format)}
                disabled={isExporting}
                className={cn(
                  "cursor-pointer",
                  isLocked && "opacity-60"
                )}
              >
                <Icon className="w-4 h-4 mr-2" />
                <span className="flex-1">{option.label}</span>
                {isLocked && <Crown className="w-3 h-3 ml-1" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
      
      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        feature="Export"
        title={`Unlock ${blockedFormat}`}
        description="Export functionality is a premium feature. Upgrade to export your data in multiple formats."
        benefits={[
          'Export to PDF, CSV, and JSON',
          'Unlimited exports per month',
          'Custom branding on exports',
          'Bulk export options',
          'Priority processing'
        ]}
      />
    </>
  );
}