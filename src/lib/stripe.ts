import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export const getStripeJs = async () => {
  const { loadStripe } = await import('@stripe/stripe-js');
  
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
  
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
};

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Creator',
    description: 'Perfect for getting started',
    price: 0,
    yearlyPrice: 0,
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
    stripeProductId: null,
    stripePriceId: null,
    stripePriceYearlyId: null,
  },
  premium: {
    name: 'Pro Creator',
    description: 'For serious content creators',
    price: 9.99,
    yearlyPrice: 8.33,
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
    stripeProductId: 'prod_SdwSdTSNDK29DJ',
    stripePriceId: 'price_1Riea4G48MbDPfJlHADqH4iP',
    stripePriceYearlyId: 'price_1Riea4G48MbDPfJlHADqH4iP', // Same for now, you can create yearly pricing later
  },
  enterprise: {
    name: 'Creator Studio',
    description: 'For teams and agencies',
    price: 29.99,
    yearlyPrice: 24.99,
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
    stripeProductId: 'prod_SdwXKELOkZJ1kV',
    stripePriceId: 'price_1RieesG48MbDPfJlKCv1X4hS',
    stripePriceYearlyId: 'price_1RieesG48MbDPfJlKCv1X4hS', // Same for now, you can create yearly pricing later
  },
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

// Helper function to get plan by Stripe price ID
export function getPlanByPriceId(priceId: string): SubscriptionPlan | null {
  for (const [planKey, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.stripePriceId === priceId || plan.stripePriceYearlyId === priceId) {
      return planKey as SubscriptionPlan;
    }
  }
  return null;
}

// Helper function to check if price ID is yearly
export function isYearlyPlan(priceId: string): boolean {
  for (const plan of Object.values(SUBSCRIPTION_PLANS)) {
    if (plan.stripePriceYearlyId === priceId) {
      return true;
    }
  }
  return false;
}