'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { 
  ArrowRight, 
  Zap, 
  Target, 
  TrendingUp, 
  Users, 
  PlayCircle,
  Sparkles,
  CheckCircle,
  Star,
  Compass,
  BarChart3,
  Calendar,
  Crown
} from 'lucide-react';

export default function Home() {
  const { onboardingComplete, selectedPlatform, selectedNiche } = useAppStore();

  // Redirect to dashboard if onboarding is complete
  useEffect(() => {
    if (onboardingComplete && selectedPlatform && selectedNiche) {
      // Could redirect to dashboard, but for demo purposes we'll stay on landing
    }
  }, [onboardingComplete, selectedPlatform, selectedNiche]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-bg py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Join 10,000+ creators growing their audience
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Your{' '}
              <span className="gradient-text">
                Personalized Roadmap
              </span>
              {' '}to Creator Success
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Get proven 90-day strategies for YouTube, TikTok, and Twitch. 
              Track your progress, unlock achievements, and build the audience you deserve.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/onboarding">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link href="#demo">
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                No credit card required
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Free forever plan
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Cards */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Choose Your Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get tailored strategies for the platform where you want to grow your audience
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* YouTube Card */}
            <Card className="interactive-card youtube-gradient text-white border-0">
              <CardHeader>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <PlayCircle className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">YouTube</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 mb-6">
                  Build a sustainable channel with long-form content, SEO optimization, and community building.
                </p>
                <ul className="space-y-2 text-sm text-white/90 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Video optimization strategies
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Thumbnail & title templates
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Monetization roadmap
                  </li>
                </ul>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/onboarding?platform=youtube">
                    Start YouTube Journey
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* TikTok Card */}
            <Card className="interactive-card tiktok-gradient text-white border-0">
              <CardHeader>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">TikTok</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 mb-6">
                  Master viral short-form content with trending strategies and algorithm optimization.
                </p>
                <ul className="space-y-2 text-sm text-white/90 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Viral content formulas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Trending audio strategies
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Hashtag optimization
                  </li>
                </ul>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/onboarding?platform=tiktok">
                    Start TikTok Journey
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Twitch Card */}
            <Card className="interactive-card twitch-gradient text-white border-0">
              <CardHeader>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl">Twitch</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-white/80 mb-6">
                  Build an engaged streaming community with consistent content and interactive features.
                </p>
                <ul className="space-y-2 text-sm text-white/90 mb-6">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Stream setup guides
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Community building tactics
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Monetization strategies
                  </li>
                </ul>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href="/onboarding?platform=twitch">
                    Start Twitch Journey
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From strategy to execution, we've got you covered with proven tools and guidance
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="mobile-card">
              <CardHeader>
                <Target className="w-8 h-8 text-blue-500 mb-2" />
                <CardTitle>90-Day Roadmaps</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Step-by-step daily tasks designed to grow your audience systematically over 90 days.
                </p>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardHeader>
                <BarChart3 className="w-8 h-8 text-green-500 mb-2" />
                <CardTitle>Progress Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Track your growth, maintain streaks, and celebrate milestones with built-in analytics.
                </p>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardHeader>
                <Sparkles className="w-8 h-8 text-purple-500 mb-2" />
                <CardTitle>Templates & Tools</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ready-to-use bio templates, content ideas, and posting schedules for each platform.
                </p>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardHeader>
                <TrendingUp className="w-8 h-8 text-orange-500 mb-2" />
                <CardTitle>Algorithm Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Stay ahead with the latest algorithm updates and optimization strategies.
                </p>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardHeader>
                <Calendar className="w-8 h-8 text-pink-500 mb-2" />
                <CardTitle>Content Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Never run out of ideas with our automated content calendar and posting schedules.
                </p>
              </CardContent>
            </Card>

            <Card className="mobile-card">
              <CardHeader>
                <Crown className="w-8 h-8 text-yellow-500 mb-2" />
                <CardTitle>Premium Features</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Advanced analytics, cross-platform strategies, and priority support for serious creators.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Creators Worldwide
            </h2>
            <div className="flex items-center justify-center space-x-8 text-2xl font-bold">
              <div className="text-center">
                <div className="text-3xl text-blue-500">10K+</div>
                <div className="text-sm text-muted-foreground">Active Creators</div>
              </div>
              <div className="text-center">
                <div className="text-3xl text-green-500">1M+</div>
                <div className="text-sm text-muted-foreground">Followers Gained</div>
              </div>
              <div className="text-center">
                <div className="text-3xl text-purple-500">50K+</div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="mobile-card">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4">
                    "CreatorCompass helped me grow from 0 to 10K followers in just 2 months. The daily tasks keep me focused and motivated!"
                  </p>
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mr-3"></div>
                    <div>
                      <div className="font-semibold">@creator{i}</div>
                      <div className="text-sm text-muted-foreground">YouTube Creator</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Build Your Creator Empire?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of creators who are already using CreatorCompass to grow their audience and build their brand.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="text-lg px-8" asChild>
                <Link href="/onboarding">
                  Start Free Today
                  <Compass className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" className="text-lg px-8" asChild>
                <Link href="/pricing">
                  View Pricing
                </Link>
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Start free • Upgrade anytime • Cancel whenever
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}