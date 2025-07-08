'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Play,
  Zap,
  Crown,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  Star
} from 'lucide-react';

export function ModernHero() {
  const [currentEmoji, setCurrentEmoji] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const emojiSequence = ['🚀', '💯', '🔥', '⚡', '✨', '🎯'];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setCurrentEmoji((prev) => (prev + 1) % emojiSequence.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute top-40 right-20 w-32 h-32 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-20 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse delay-2000" />
        <div className="absolute bottom-20 right-10 w-16 h-16 bg-green-500/20 rounded-full blur-xl animate-pulse delay-3000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Trending Badge */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Badge variant="secondary" className="px-4 py-2 text-sm bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-300/50 text-purple-700 dark:text-purple-300">
              <TrendingUp className="w-4 h-4 mr-2" />
              #1 Creator Growth Platform
            </Badge>
          </div>

          {/* Main Heading with Emoji Animation */}
          <div className={`space-y-4 transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                Create Content
              </span>
              <br />
              <span className="text-foreground">That Actually</span>
              <br />
              <span className="relative">
                <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Goes Viral
                </span>
                <span className="ml-4 text-6xl emoji-bounce inline-block">
                  {emojiSequence[currentEmoji]}
                </span>
              </span>
            </h1>
          </div>

          {/* Subtitle */}
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Join <span className="font-bold text-purple-600">50,000+</span> creators using AI-powered roadmaps 
              to grow from <span className="font-bold">0 to viral</span> in just 90 days
            </p>
          </div>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button 
              asChild 
              size="lg" 
              className="social-button bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg rounded-full border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Link href="/onboarding">
                <Play className="w-5 h-5 mr-2" />
                Start Your Journey
              </Link>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="social-button border-2 border-purple-300 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/20 px-8 py-4 text-lg rounded-full"
              asChild
            >
              <Link href="#demo">
                <Sparkles className="w-5 h-5 mr-2" />
                See How It Works
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className={`transition-all duration-1000 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-background flex items-center justify-center text-white text-xs font-bold">
                      {String.fromCharCode(65 + i - 1)}
                    </div>
                  ))}
                </div>
                <span>50K+ creators</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>4.9/5 rating</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <Zap className="w-4 h-4 text-green-500" />
                <span>90% success rate</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Feature Cards */}
        <div className={`mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {[
            { 
              icon: Target, 
              title: "AI Roadmaps", 
              description: "Personalized 90-day plans",
              gradient: "from-blue-500 to-cyan-500",
              delay: "delay-0"
            },
            { 
              icon: Crown, 
              title: "Pro Templates", 
              description: "Viral content formulas",
              gradient: "from-purple-500 to-pink-500",
              delay: "delay-100"
            },
            { 
              icon: Users, 
              title: "Live Analytics", 
              description: "Real-time growth tracking",
              gradient: "from-green-500 to-emerald-500",
              delay: "delay-200"
            }
          ].map((feature, index) => (
            <Card key={index} className={`modern-card gen-z-card hover:neon-glow-blue transition-all duration-500 ${feature.delay}`}>
              <CardContent className="p-6 text-center">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${feature.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform Badges */}
        <div className={`mt-16 flex justify-center items-center space-x-6 transition-all duration-1000 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="flex items-center space-x-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-full">
            <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
              <Play className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium">YouTube</span>
          </div>
          
          <div className="flex items-center space-x-3 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
            <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center text-white text-xs font-bold">
              T
            </div>
            <span className="text-sm font-medium">Twitch</span>
          </div>
          
          <div className="flex items-center space-x-3 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
              ♪
            </div>
            <span className="text-sm font-medium">TikTok</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground/30 rounded-full mt-2 animate-bounce" />
        </div>
      </div>
    </section>
  );
}