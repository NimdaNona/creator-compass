'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useAppStore } from '@/store/useAppStore';
import { getStripeJs } from '@/lib/stripe';
import { 
  Check, 
  Crown, 
  Zap, 
  Target,
  TrendingUp,
  Users,
  Calendar,
  Sparkles,
  Star,
  Shield,
  Headphones,
  X,
  Loader2
} from 'lucide-react';

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { subscription, setSubscription } = useAppStore();

  // Fetch user subscription on component mount
  useEffect(() => {
    fetchUserSubscription();
  }, []);

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/subscription');
      if (response.ok) {
        const data = await response.json();
        setUserSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Creator',
      description: 'Perfect for getting started',
      price: 0,
      yearlyPrice: 0,
      badge: null,
      features: [
        'Access to 1 platform roadmap',
        '30-day progress tracking',
        'Basic templates library',
        'Community support',
        'Mobile app access'
      ],
      limitations: [
        'Limited to 1 platform',
        'No advanced analytics',
        'Basic templates only',
        'Community support only'
      ],
      cta: userSubscription?.plan === 'free' ? 'Current Plan' : 'Downgrade',
      popular: false,
      color: 'border-gray-200',
      priceId: null,
      yearlyPriceId: null,
    },
    {
      id: 'premium',
      name: 'Pro Creator',
      description: 'For serious content creators',
      price: 9.99,
      yearlyPrice: 8.33,
      badge: 'Most Popular',
      features: [
        'All platform roadmaps (YouTube, TikTok, Twitch)',
        'Full 90-day progress tracking',
        'Premium templates & tools',
        'Advanced analytics dashboard',
        'Cross-platform strategies',
        'Priority support',
        'Export progress reports',
        'Custom goal setting',
        'Achievement system',
        'Early access to new features'
      ],
      limitations: [],
      cta: userSubscription?.plan === 'premium' ? 'Current Plan' : 'Upgrade Now',
      popular: true,
      color: 'border-purple-500',
      priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
      yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID,
    },
    {
      id: 'enterprise',
      name: 'Creator Studio',
      description: 'For teams and agencies',
      price: 29.99,
      yearlyPrice: 24.99,
      badge: 'Best Value',
      features: [
        'Everything in Pro Creator',
        'Team collaboration tools',
        'Multi-account management',
        'White-label options',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom analytics reports',
        'Advanced A/B testing'
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false,
      color: 'border-yellow-500',
      priceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
      yearlyPriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID,
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') {
      // Handle downgrade to free
      try {
        setLoadingPlan(planId);
        const response = await fetch('/api/stripe/subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'cancel' }),
        });
        
        if (response.ok) {
          setSubscription('free');
          await fetchUserSubscription();
        } else {
          console.error('Failed to downgrade to free plan');
        }
      } catch (error) {
        console.error('Error downgrading:', error);
      } finally {
        setLoadingPlan(null);
      }
      return;
    }

    if (planId === 'enterprise') {
      // Contact sales for enterprise
      window.open('mailto:sales@creatorsaicompass.com?subject=Enterprise Plan Inquiry');
      return;
    }

    // Handle premium plan upgrade
    try {
      setLoadingPlan(planId);
      const plan = plans.find(p => p.id === planId);
      const priceId = isYearly ? plan?.yearlyPriceId : plan?.priceId;
      
      if (!priceId) {
        console.error('Price ID not found for plan:', planId);
        return;
      }

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, isYearly }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      const stripe = await getStripeJs();
      
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });
      
      if (error) {
        console.error('Stripe checkout error:', error);
      }
    } catch (error) {
      console.error('Error upgrading:', error);
    } finally {
      setLoadingPlan(null);
    }
  };

  const getCurrentPrice = (plan: any) => {
    return isYearly ? plan.yearlyPrice : plan.price;
  };

  const getSavings = (plan: any) => {
    if (plan.price === 0) return null;
    const monthlyTotal = plan.price * 12;
    const yearlyTotal = plan.yearlyPrice * 12;
    const savings = monthlyTotal - yearlyTotal;
    return Math.round(savings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="secondary" className="mb-4">
            <Crown className="w-4 h-4 mr-2" />
            Pricing Plans
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Choose Your Creator Journey
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Start free and upgrade as you grow. All plans include our core roadmap system 
            to help you build your audience systematically.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${!isYearly ? 'font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm ${isYearly ? 'font-medium' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <Badge variant="outline" className="ml-2">
                Save up to 17%
              </Badge>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto mb-16">
          {plans.map((plan) => {
            const currentPrice = getCurrentPrice(plan);
            const savings = getSavings(plan);
            
            return (
              <Card 
                key={plan.id}
                className={`relative overflow-hidden ${plan.color} ${
                  plan.popular ? 'scale-105 shadow-2xl' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 text-xs font-medium">
                    {plan.badge}
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    {plan.id === 'free' && <Target className="w-5 h-5 text-gray-500" />}
                    {plan.id === 'premium' && <Crown className="w-5 h-5 text-purple-500" />}
                    {plan.id === 'enterprise' && <Star className="w-5 h-5 text-yellow-500" />}
                    
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  
                  <p className="text-muted-foreground mb-4">{plan.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-center space-x-1">
                      <span className="text-4xl font-bold">
                        ${currentPrice}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">
                          /{isYearly ? 'month' : 'month'}
                        </span>
                      )}
                    </div>
                    
                    {isYearly && plan.price > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Billed annually (${plan.yearlyPrice * 12}/year)
                      </div>
                    )}
                    
                    {savings && isYearly && (
                      <Badge variant="outline" className="text-green-600">
                        Save ${savings}/year
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Limitations for free plan */}
                  {plan.limitations.length > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <h4 className="text-sm font-medium text-muted-foreground">Limitations:</h4>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-muted-foreground">{limitation}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* CTA Button */}
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                        : ''
                    }`}
                    variant={plan.id === 'free' ? 'outline' : 'default'}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={userSubscription?.plan === plan.id || loadingPlan === plan.id}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-8">
            {[
              {
                question: "Can I change plans anytime?",
                answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be charged or credited accordingly."
              },
              {
                question: "What happens to my progress if I downgrade?",
                answer: "Your progress is always saved. If you downgrade to the free plan, you'll keep access to your completed tasks but won't be able to access premium features."
              },
              {
                question: "Do you offer refunds?",
                answer: "We offer a 30-day money-back guarantee. If you're not satisfied with your purchase, contact our support team for a full refund."
              },
              {
                question: "Can I use CreatorCompass for multiple platforms?",
                answer: "With the Pro Creator plan, you get access to roadmaps for all platforms (YouTube, TikTok, Twitch). The free plan is limited to one platform."
              }
            ].map((faq, index) => (
              <div key={index} className="space-y-2">
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <p className="text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <Headphones className="w-4 h-4" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Cancel Anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}