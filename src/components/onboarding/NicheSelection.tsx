'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { getNichesForPlatform } from '@/lib/data';
import type { Niche } from '@/types';
import { 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  DollarSign,
  Gamepad2,
  Palette,
  Monitor,
  Dumbbell,
  GraduationCap,
  MessageCircle,
  Music,
  Camera,
  Laugh,
  BookOpen,
  Heart,
  Zap
} from 'lucide-react';

interface NicheSelectionProps {
  onNext: () => void;
}

const nicheIcons = {
  gaming: Gamepad2,
  beauty: Palette,
  tech: Monitor,
  fitness: Dumbbell,
  educational: GraduationCap,
  just_chatting: MessageCircle,
  creative: Palette,
  music: Music,
  irl: Camera,
  entertainment: Laugh,
  dance: Music,
  lifestyle: Heart,
};

const difficultyColors = {
  Easy: 'text-green-500',
  Medium: 'text-yellow-500',
  Hard: 'text-red-500',
};

const competitivenessColors = {
  Low: 'text-green-500',
  Medium: 'text-yellow-500',
  High: 'text-red-500',
};

export function NicheSelection({ onNext }: NicheSelectionProps) {
  const { selectedPlatform, selectedNiche, setSelectedNiche } = useAppStore();

  if (!selectedPlatform) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">Please select a platform first.</p>
      </div>
    );
  }

  const niches = getNichesForPlatform(selectedPlatform.id);

  const handleNicheSelect = (niche: Niche) => {
    setSelectedNiche(niche);
    // Auto-advance after selection
    setTimeout(onNext, 300);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            selectedPlatform.id === 'youtube' ? 'bg-red-500' :
            selectedPlatform.id === 'tiktok' ? 'bg-black' :
            'bg-purple-500'
          } text-white`}>
            {selectedPlatform.id === 'youtube' && <Monitor className="w-4 h-4" />}
            {selectedPlatform.id === 'tiktok' && <Zap className="w-4 h-4" />}
            {selectedPlatform.id === 'twitch' && <Camera className="w-4 h-4" />}
          </div>
          <span className="text-lg font-semibold">{selectedPlatform.displayName}</span>
        </div>
        
        <h3 className="text-3xl font-bold mb-4">
          Choose Your Niche
        </h3>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Select the content niche that matches your interests and expertise. 
          This will determine your personalized roadmap and strategies.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {niches.map((niche) => {
          const Icon = nicheIcons[niche.id as keyof typeof nicheIcons] || BookOpen;
          const isSelected = selectedNiche?.id === niche.id;
          
          return (
            <Card 
              key={niche.id}
              className={`cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                isSelected 
                  ? 'ring-2 ring-purple-500 shadow-lg' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => handleNicheSelect(niche)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-white">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{niche.name}</CardTitle>
                      {isSelected && (
                        <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm">
                  {niche.description}
                </p>
                
                {/* Subcategories */}
                {niche.subcategories && (
                  <div>
                    <h5 className="font-medium text-xs mb-2">Popular Content Types:</h5>
                    <div className="flex flex-wrap gap-1">
                      {niche.subcategories.slice(0, 3).map((subcategory, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {subcategory}
                        </Badge>
                      ))}
                      {niche.subcategories.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{niche.subcategories.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Difficulty:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${difficultyColors[niche.difficulty]}`}
                      >
                        {niche.difficulty}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Competition:</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${competitivenessColors[niche.competitiveness]}`}
                      >
                        {niche.competitiveness}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground text-xs">Time to monetize:</span>
                    </div>
                    <div className="text-xs font-medium">
                      {niche.avgTimeToMonetization}
                    </div>
                  </div>
                </div>

                {/* Success indicators */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-muted-foreground">Growth potential</span>
                    </div>
                    <div className="flex space-x-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-1 h-3 rounded ${
                            i < (niche.competitiveness === 'Low' ? 5 : niche.competitiveness === 'Medium' ? 3 : 2) 
                              ? 'bg-green-500' 
                              : 'bg-gray-200'
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="mt-12 text-center">
        <div className="max-w-3xl mx-auto p-6 bg-muted/30 rounded-xl">
          <h4 className="font-semibold mb-4">💡 Pro Tip: Choosing Your Niche</h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <Heart className="w-4 h-4 text-green-600" />
              </div>
              <strong>Follow Your Passion</strong>
              <p className="text-muted-foreground">
                Choose something you genuinely enjoy creating content about.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <strong>Consider Your Skills</strong>
              <p className="text-muted-foreground">
                Pick a niche where you have existing knowledge or can learn quickly.
              </p>
            </div>
            <div className="space-y-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <strong>Check the Market</strong>
              <p className="text-muted-foreground">
                Look at competition levels and monetization potential.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}