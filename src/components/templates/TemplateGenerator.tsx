'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Wand2,
  Save,
  Copy,
  Check,
  Info,
  Sparkles,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FeatureUsageIndicator } from '@/components/usage/FeatureUsageIndicator';
import { useSubscription } from '@/hooks/useSubscription';

interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
  defaultValue?: any;
  description?: string;
}

interface Template {
  id: string;
  title: string;
  description?: string;
  category: string;
  type: string;
  platform: string;
  niche: string;
  variables: TemplateVariable[];
  content: string;
}

interface TemplateGeneratorProps {
  templateId: string;
}

export default function TemplateGenerator({ templateId }: TemplateGeneratorProps) {
  const [template, setTemplate] = useState<Template | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [preview, setPreview] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [copied, setCopied] = useState(false);
  const { subscription, isActive } = useSubscription();
  
  const isFreeTier = !isActive || subscription?.plan === 'free';

  useEffect(() => {
    fetchTemplate();
  }, [templateId]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/templates/detail/${templateId}`);
      if (!response.ok) throw new Error('Failed to fetch template');
      
      const data = await response.json();
      setTemplate(data.template);
      
      // Initialize default values
      const defaults: Record<string, any> = {};
      data.template.variables?.forEach((variable: TemplateVariable) => {
        if (variable.defaultValue !== undefined) {
          defaults[variable.name] = variable.defaultValue;
        }
      });
      setValues(defaults);
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!template) return;

    try {
      setGenerating(true);
      
      const response = await fetch('/api/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: template.id,
          values,
          save: saveToLibrary
        })
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle subscription-related errors
        if (error.requiresUpgrade) {
          toast.error(error.error || 'This feature requires an upgrade', {
            action: {
              label: 'Upgrade',
              onClick: () => window.location.href = '/pricing'
            }
          });
          
          // Show usage info if available
          if (error.limit && error.used) {
            toast.info(`You've used ${error.used} of ${error.limit} templates this month`);
          }
          
          return;
        }
        
        throw new Error(error.error || 'Failed to generate content');
      }

      const data = await response.json();
      setPreview(data.preview);
      
      if (saveToLibrary && data.savedId) {
        toast.success('Template saved to your library!');
      } else {
        toast.success('Content generated successfully!');
      }
    } catch (error) {
      console.error('Error generating content:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate content');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([preview], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template?.title.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded successfully!');
  };

  const renderVariableInput = (variable: TemplateVariable) => {
    const value = values[variable.name] || '';
    
    switch (variable.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
            placeholder={variable.placeholder}
            required={variable.required}
            className="min-h-[100px]"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValues({ ...values, [variable.name]: parseInt(e.target.value) || 0 })}
            placeholder={variable.placeholder}
            required={variable.required}
            min={variable.min}
            max={variable.max}
          />
        );
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
            required={variable.required}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Select an option</option>
            {variable.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setValues({ ...values, [variable.name]: e.target.value })}
            placeholder={variable.placeholder}
            required={variable.required}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!template) {
    return (
      <Card className="p-12 text-center">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Template Not Found</h3>
        <p className="text-muted-foreground mb-4">
          The requested template could not be loaded.
        </p>
        <Button onClick={() => window.history.back()}>
          Go Back
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{template.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{template.category}</Badge>
              <Badge variant="outline">{template.type}</Badge>
              <Badge className={cn(
                "text-xs",
                template.platform === 'youtube' && "bg-red-500/10 text-red-600",
                template.platform === 'tiktok' && "bg-black/10 text-black dark:bg-white/10 dark:text-white",
                template.platform === 'twitch' && "bg-purple-500/10 text-purple-600"
              )}>
                {template.platform}
              </Badge>
            </div>
          </div>
        </div>
        {template.description && (
          <p className="text-muted-foreground">{template.description}</p>
        )}
      </div>

      <Tabs defaultValue="customize" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="customize">Customize Template</TabsTrigger>
          <TabsTrigger value="preview" disabled={!preview}>
            Preview Result
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customize" className="space-y-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Template Variables</h2>
                <Alert className="max-w-sm">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Fill in the fields below to customize your content
                  </AlertDescription>
                </Alert>
              </div>

              {/* Usage Indicator for Free Tier */}
              {isFreeTier && (
                <FeatureUsageIndicator 
                  feature="templates" 
                  className="mb-4 p-4 bg-muted/50 rounded-lg"
                />
              )}
              
              {/* Variable Inputs */}
              <div className="space-y-4">
                {template.variables.map((variable) => (
                  <div key={variable.name} className="space-y-2">
                    <Label htmlFor={variable.name}>
                      {variable.label}
                      {variable.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {variable.description && (
                      <p className="text-sm text-muted-foreground">
                        {variable.description}
                      </p>
                    )}
                    {renderVariableInput(variable)}
                  </div>
                ))}
              </div>

              {/* Save Option */}
              <div className="flex items-center space-x-2 pt-4 border-t">
                <Switch
                  id="save-library"
                  checked={saveToLibrary}
                  onCheckedChange={setSaveToLibrary}
                />
                <Label htmlFor="save-library">
                  Save to my template library after generating
                </Label>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Generated Content</h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={!preview}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    disabled={!preview}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-6 min-h-[400px] whitespace-pre-wrap font-mono text-sm">
                {preview || 'Generate content to see preview...'}
              </div>

              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  This content was generated based on your inputs. Feel free to edit and customize it further!
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}