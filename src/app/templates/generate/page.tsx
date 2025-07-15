'use client';

import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { templates } from '@/lib/templates';
import { 
  FileText, 
  Video, 
  Megaphone, 
  Calendar,
  Sparkles,
  ArrowRight,
  Lock
} from 'lucide-react';

const templateIcons: Record<string, any> = {
  'content-calendar': Calendar,
  'video-script': Video,
  'social-post': Megaphone,
  'thumbnail-ideas': FileText,
};

export default function TemplateGeneratePage() {
  const router = useRouter();
  const { selectedPlatform, subscription } = useAppStore();

  const handleTemplateSelect = (templateId: string) => {
    router.push(`/templates/generate/${templateId}`);
  };

  // Filter templates by platform
  const platformTemplates = templates.filter(template => 
    template.platform === 'all' || template.platform === selectedPlatform?.id
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Generate Content</h1>
            <p className="text-muted-foreground">
              Choose a template to generate personalized content for your {selectedPlatform?.displayName} channel
            </p>
          </div>

          {/* Template Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformTemplates.map((template) => {
              const Icon = templateIcons[template.id] || FileText;
              const isLocked = template.requiresPremium && subscription !== 'premium';

              return (
                <Card 
                  key={template.id}
                  className={`relative transition-all hover:shadow-lg ${
                    isLocked ? 'opacity-75' : 'cursor-pointer hover:scale-105'
                  }`}
                  onClick={() => !isLocked && handleTemplateSelect(template.id)}
                >
                  {isLocked && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
                      <div className="text-center">
                        <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Premium Template</p>
                      </div>
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      {template.requiresPremium && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-4">{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-2">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {!isLocked && (
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>

                    {isLocked && (
                      <Button 
                        className="w-full mt-4" 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push('/pricing');
                        }}
                      >
                        Upgrade to Premium
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}