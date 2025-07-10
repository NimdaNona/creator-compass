import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe, getPlanByPriceId, isYearlyPlan } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { ratelimiters, rateLimit } from '@/lib/ratelimit';
import Stripe from 'stripe';

// Use different webhook secrets for different environments
const webhookSecret = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_WEBHOOK_SECRET!
  : process.env.STRIPE_WEBHOOK_SECRET_DEV || process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  // Apply rate limiting for webhook endpoints (high volume)
  const rateLimitResponse = await rateLimit(request, ratelimiters?.webhook || null);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // Check if we've already processed this event (idempotency)
    const existingEvent = await prisma.processedWebhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent) {
      console.log(`Event ${event.id} already processed`);
      return NextResponse.json({ received: true });
    }

    // Process the event
    try {
      switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
      }

      // Mark event as processed
      await prisma.processedWebhookEvent.create({
        data: {
          eventId: event.id,
          type: event.type,
          metadata: JSON.stringify({
            timestamp: new Date().toISOString(),
            customerId: (event.data.object as any).customer || null,
          }),
        },
      });
    } catch (processingError) {
      console.error(`Error processing ${event.type}:`, processingError);
      // Don't throw - return success to avoid retries if the event was partially processed
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    
    // Check if it's a signature verification error
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout.session.completed:', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    metadata: session.metadata,
  });

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  await updateUserSubscription(subscription, userId);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { 
      subscription: { 
        stripeCustomerId: customer.id 
      } 
    },
  });

  if (!user) {
    console.error('User not found for customer:', customer.id);
    return;
  }

  await updateUserSubscription(subscription, user.id);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { 
      subscription: { 
        stripeCustomerId: customer.id 
      } 
    },
  });

  if (!user) {
    console.error('User not found for customer:', customer.id);
    return;
  }

  await updateUserSubscription(subscription, user.id);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { 
      subscription: { 
        stripeCustomerId: customer.id 
      } 
    },
  });

  if (!user) {
    console.error('User not found for customer:', customer.id);
    return;
  }

  await prisma.userSubscription.update({
    where: { userId: user.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
      plan: 'free',
    },
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  
  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  const plan = getPlanByPriceId(priceId);
  if (!plan) {
    console.error('Plan not found for price ID:', priceId);
    return;
  }

  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { 
      subscription: { 
        stripeCustomerId: customer.id 
      } 
    },
  });

  if (!user) {
    console.error('User not found for customer:', customer.id);
    return;
  }

  // Record payment
  await prisma.payment.create({
    data: {
      userId: user.id,
      stripePaymentId: invoice.payment_intent as string,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      description: invoice.description || `Payment for ${plan} plan`,
      plan: plan,
      isYearly: isYearlyPlan(priceId),
    },
  });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const customer = await stripe.customers.retrieve(subscription.customer as string);
  if (!customer || customer.deleted) {
    console.error('Customer not found or deleted');
    return;
  }

  const user = await prisma.user.findFirst({
    where: { 
      subscription: { 
        stripeCustomerId: customer.id 
      } 
    },
  });

  if (!user) {
    console.error('User not found for customer:', customer.id);
    return;
  }

  // Update subscription status to past_due
  await prisma.userSubscription.update({
    where: { userId: user.id },
    data: {
      status: 'past_due',
    },
  });
}

async function updateUserSubscription(subscription: Stripe.Subscription, userId: string) {
  const priceId = subscription.items.data[0]?.price.id;
  if (!priceId) {
    console.error('No price ID found in subscription');
    return;
  }

  const plan = getPlanByPriceId(priceId);
  if (!plan) {
    console.error('Plan not found for price ID:', priceId);
    return;
  }

  const isYearly = isYearlyPlan(priceId);

  await prisma.userSubscription.upsert({
    where: { userId },
    update: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      plan: plan,
      isYearly,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      plan: plan,
      isYearly,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    },
  });
}