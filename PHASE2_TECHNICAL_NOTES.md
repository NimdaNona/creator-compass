# Phase 2: Technical Implementation Notes

## Critical Implementation Details

### 1. Stripe Integration Architecture

#### Price IDs Structure
```javascript
// src/lib/stripe.ts
SUBSCRIPTION_PLANS = {
  free: {
    stripePriceId: null,
    stripePriceYearlyId: null,
  },
  premium: {
    stripePriceId: 'price_1Riea4G48MbDPfJlHADqH4iP', // $9.99/month
    stripePriceYearlyId: 'price_1RjNhfG48MbDPfJlZskFkffl', // $99/year
  },
  enterprise: {
    stripePriceId: 'price_1RieesG48MbDPfJlKCv1X4hS', // $29.99/month
    stripePriceYearlyId: 'price_1RjNhfG48MbDPfJl5OSDitxx', // $299/year
  }
}
```

#### Webhook Event Handling
Current implementation handles:
- `checkout.session.completed`
- `customer.subscription.created/updated/deleted`
- `invoice.payment_succeeded/failed`

**Security Gap**: Need to implement signature verification:
```typescript
// Required fix in webhook route
const sig = headers().get('stripe-signature');
const webhookSecret = process.env.NODE_ENV === 'production' 
  ? process.env.STRIPE_WEBHOOK_SECRET 
  : process.env.STRIPE_WEBHOOK_SECRET_DEV;

try {
  event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
} catch (err) {
  return new Response('Webhook signature verification failed', { status: 400 });
}
```

### 2. Free Tier Enforcement Points

#### Platform Selection (`src/components/onboarding/PlatformSelection.tsx`)
```typescript
// Need to add
const { subscription } = useSubscription();
const canSelectMultiple = subscription.plan !== 'free';
const maxPlatforms = SUBSCRIPTION_PLANS[subscription.plan].maxPlatforms;
```

#### Progress Tracking (`src/components/dashboard/ProgressStats.tsx`)
```typescript
// Need to implement
const maxDays = SUBSCRIPTION_PLANS[subscription.plan].maxProgressDays;
const isLocked = currentDay > maxDays;
```

### 3. Database Schema Updates Required

```prisma
// Add to prisma/schema.prisma
model UsageTracking {
  id        String   @id @default(cuid())
  userId    String
  feature   String   // 'templates', 'platforms', 'exports'
  count     Int
  limit     Int
  resetAt   DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id])
  @@unique([userId, feature])
}

// Update UserSubscription
model UserSubscription {
  // ... existing fields
  yearlyPriceId        String?
  trialEndsAt          DateTime?
  pausedAt             DateTime?
  resumesAt            DateTime?
  downgradeScheduledAt DateTime?
  upgradeProtectedUntil DateTime? // Prevent immediate downgrades
}
```

### 4. Component Patterns

#### SubscriptionGate Pattern
```typescript
// Proper implementation pattern
export function PremiumFeature() {
  const { hasFeatureAccess } = useSubscription();
  
  if (!hasFeatureAccess('analytics')) {
    return <PaywallModal feature="analytics" />;
  }
  
  return <AnalyticsDashboard />;
}
```

#### Usage Display Widget
```typescript
interface UsageDisplayProps {
  feature: 'templates' | 'platforms' | 'exports';
  current: number;
  limit: number;
}

export function UsageDisplay({ feature, current, limit }: UsageDisplayProps) {
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  
  return (
    <div className={cn(
      "flex items-center gap-2",
      isNearLimit && "text-orange-500"
    )}>
      <span>{current}/{limit}</span>
      {isNearLimit && <AlertCircle className="w-4 h-4" />}
    </div>
  );
}
```

### 5. API Route Patterns

#### Usage Tracking API
```typescript
// app/api/usage/route.ts
export async function GET(req: Request) {
  const usage = await prisma.usageTracking.findMany({
    where: { userId: session.user.id }
  });
  
  return NextResponse.json({
    templates: usage.find(u => u.feature === 'templates') || { count: 0, limit: 5 },
    platforms: usage.find(u => u.feature === 'platforms') || { count: 1, limit: 1 },
    exports: usage.find(u => u.feature === 'exports') || { count: 0, limit: 0 }
  });
}

export async function POST(req: Request) {
  const { feature } = await req.json();
  
  // Increment usage
  await prisma.usageTracking.upsert({
    where: { userId_feature: { userId, feature } },
    update: { count: { increment: 1 } },
    create: { userId, feature, count: 1, limit: getFeatureLimit(feature, plan) }
  });
}
```

### 6. Stripe Best Practices

#### Idempotency
```typescript
// Store processed webhook events
model ProcessedWebhookEvent {
  id        String   @id
  eventId   String   @unique
  processed DateTime @default(now())
}

// Check before processing
const existing = await prisma.processedWebhookEvent.findUnique({
  where: { eventId: event.id }
});
if (existing) return NextResponse.json({ received: true });
```

#### Subscription Schedules for Downgrades
```typescript
// Prevent immediate downgrades after upgrade
const schedule = await stripe.subscriptionSchedules.create({
  from_subscription: subscriptionId,
  phases: [
    {
      items: [{ price: currentPriceId }],
      end_date: minimumPeriodEnd, // 30 days minimum
    },
    {
      items: [{ price: downgradePriceId }],
    }
  ]
});
```

### 7. Missing Premium Features Implementation

#### Analytics Dashboard Structure
```
app/
  analytics/
    page.tsx           // Main analytics page
    components/
      GrowthChart.tsx  // Subscriber growth
      PlatformStats.tsx // Per-platform metrics
      ExportButton.tsx  // CSV/PDF export
```

#### Export Functionality
```typescript
// lib/export.ts
export async function exportRoadmap(roadmapId: string, format: 'pdf' | 'markdown') {
  const roadmap = await getRoadmap(roadmapId);
  
  if (format === 'pdf') {
    // Use @react-pdf/renderer or similar
    return generatePDF(roadmap);
  }
  
  return generateMarkdown(roadmap);
}
```

### 8. Security Checklist

- [ ] Webhook signature verification
- [ ] Server-side price validation
- [ ] Rate limiting on payment endpoints
- [ ] CSRF protection on subscription changes
- [ ] Audit trail for subscription changes
- [ ] PCI compliance (handled by Stripe)

### 9. Testing Scenarios

#### Payment Test Cards
- Success: 4242424242424242
- Decline: 4000000000000002
- 3D Secure: 4000002500003155

#### Webhook Testing
```bash
# Local testing
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.updated
```

### 10. Monitoring & Logging

```typescript
// Enhanced webhook logging
console.log({
  event: event.type,
  customerId: event.data.object.customer,
  subscriptionId: event.data.object.id,
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV
});
```

---

These technical notes should be referenced during implementation to ensure all security, performance, and UX requirements are met.