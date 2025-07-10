#!/usr/bin/env node

// Script to create yearly prices in Stripe
// Run with: node scripts/create-yearly-prices.js

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createYearlyPrices() {
  try {
    console.log('Creating yearly prices for CreatorCompass subscription plans...\n');

    // Create yearly price for Pro Creator Plan ($99/year - saves $20.88)
    const proYearlyPrice = await stripe.prices.create({
      product: 'prod_SdwSdTSNDK29DJ',
      unit_amount: 9900, // $99.00
      currency: 'usd',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      metadata: {
        plan: 'Pro Creator - Yearly',
        description: 'Save 17% with yearly billing'
      }
    });
    
    console.log('✓ Created Pro Creator yearly price:', proYearlyPrice.id);
    console.log('  Amount: $99.00/year (saves $20.88)\n');

    // Create yearly price for Creator Studio Plan ($299/year - saves $60.88)
    const studioYearlyPrice = await stripe.prices.create({
      product: 'prod_SdwXKELOkZJ1kV',
      unit_amount: 29900, // $299.00
      currency: 'usd',
      recurring: {
        interval: 'year',
        interval_count: 1
      },
      metadata: {
        plan: 'Creator Studio - Yearly',
        description: 'Save 17% with yearly billing'
      }
    });
    
    console.log('✓ Created Creator Studio yearly price:', studioYearlyPrice.id);
    console.log('  Amount: $299.00/year (saves $60.88)\n');

    // Output environment variables to add
    console.log('\n📝 Add these to your environment variables:\n');
    console.log(`NEXT_PUBLIC_STRIPE_PRO_PRICE_ID_YEARLY="${proYearlyPrice.id}"`);
    console.log(`NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID_YEARLY="${studioYearlyPrice.id}"`);
    
    console.log('\n✅ Yearly prices created successfully!');
    
    // Also output for updating stripe.ts
    console.log('\n📝 Update src/lib/stripe.ts with these IDs:');
    console.log(`  premium.stripePriceYearlyId: '${proYearlyPrice.id}',`);
    console.log(`  enterprise.stripePriceYearlyId: '${studioYearlyPrice.id}',`);

  } catch (error) {
    console.error('❌ Error creating yearly prices:', error.message);
    process.exit(1);
  }
}

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

createYearlyPrices();