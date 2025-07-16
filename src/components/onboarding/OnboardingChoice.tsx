'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Settings } from 'lucide-react';

interface OnboardingChoiceProps {
  onChooseAI: () => void;
  onChooseManual: () => void;
}

export function OnboardingChoice({ onChooseAI, onChooseManual }: OnboardingChoiceProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-3">Welcome to CreatorCompass!</h2>
        <p className="text-lg text-muted-foreground">
          Let's create your personalized creator roadmap. How would you like to get started?
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 hover:border-purple-500 transition-colors cursor-pointer group" onClick={onChooseAI}>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">AI-Powered Setup</h3>
            <p className="text-muted-foreground">
              Have a conversation with our AI to create a fully personalized roadmap based on your unique situation
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                Personalized recommendations
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                Equipment suggestions
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">✓</span>
                Custom growth strategies
              </li>
            </ul>
            <Button className="w-full group-hover:bg-purple-600">
              <Sparkles className="mr-2 h-4 w-4" />
              Start AI Conversation
            </Button>
          </div>
        </Card>

        <Card className="p-6 hover:border-blue-500 transition-colors cursor-pointer group" onClick={onChooseManual}>
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold">Quick Setup</h3>
            <p className="text-muted-foreground">
              Choose your platform and niche manually for a faster setup with pre-built roadmaps
            </p>
            <ul className="text-sm text-muted-foreground space-y-2 text-left">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Quick 3-step process
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Pre-built roadmaps
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✓</span>
                Start in under 2 minutes
              </li>
            </ul>
            <Button variant="outline" className="w-full group-hover:bg-blue-50 dark:group-hover:bg-blue-950">
              <Settings className="mr-2 h-4 w-4" />
              Quick Setup
            </Button>
          </div>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Not sure which to choose? The AI setup provides more personalization!</p>
      </div>
    </div>
  );
}