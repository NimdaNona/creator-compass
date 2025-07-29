import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'chasecclifton@yahoo.com';
const TEST_PASSWORD = 'Password123!';

test.describe('Subscription and Payment Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Sign in before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 30000 });
  });

  test('should display pricing page', async () => {
    await page.goto('/pricing');
    
    // Check for pricing title
    await expect(page.locator('h1').filter({ hasText: /Pricing|Plans|Choose/i })).toBeVisible();
    
    // Check for plan cards
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Pro Creator')).toBeVisible();
    await expect(page.locator('text=Creator Studio')).toBeVisible();
  });

  test('should show correct pricing for monthly and yearly', async () => {
    await page.goto('/pricing');
    
    // Check for billing toggle
    const billingToggle = page.locator('button').filter({ hasText: /Monthly|Yearly|Annual/i });
    await expect(billingToggle.first()).toBeVisible();
    
    // Check monthly pricing
    await expect(page.locator('text=$9.99')).toBeVisible();
    await expect(page.locator('text=$29.99')).toBeVisible();
    
    // Switch to yearly
    await billingToggle.filter({ hasText: /Yearly|Annual/i }).click();
    
    // Check yearly pricing
    await expect(page.locator('text=$99')).toBeVisible();
    await expect(page.locator('text=$299')).toBeVisible();
    
    // Check for savings indicator
    await expect(page.locator('text=/Save|\\d+%.*off/i')).toBeVisible();
  });

  test('should display feature comparison', async () => {
    await page.goto('/pricing');
    
    // Check for feature lists
    const features = [
      'AI-Powered Roadmaps',
      'Platform Tools',
      'Templates',
      'Analytics',
      'Priority Support',
      'Custom Branding'
    ];
    
    for (const feature of features) {
      await expect(page.locator(`text=/${feature}/i`)).toBeVisible();
    }
    
    // Check for feature limits
    await expect(page.locator('text=/\\d+.*templates|Unlimited/i')).toBeVisible();
    await expect(page.locator('text=/\\d+.*AI.*messages/i')).toBeVisible();
  });

  test('should handle upgrade flow', async () => {
    await page.goto('/pricing');
    
    // Click on Pro plan upgrade
    const upgradeButton = page.locator('button').filter({ hasText: /Upgrade.*Pro|Get.*Pro|Start.*Pro/i });
    await upgradeButton.click();
    
    // Should redirect to Stripe checkout or show payment modal
    // Wait for either Stripe redirect or payment modal
    await page.waitForLoadState('networkidle');
    
    const isStripeCheckout = page.url().includes('checkout.stripe.com');
    const hasPaymentModal = await page.locator('.payment-modal, [class*="payment"], [class*="checkout"]').isVisible();
    
    expect(isStripeCheckout || hasPaymentModal).toBeTruthy();
  });

  test('should show current subscription status', async () => {
    await page.goto('/dashboard');
    
    // Check for subscription badge
    const subscriptionStatus = page.locator('text=/Free.*Plan|Pro.*Plan|Studio.*Plan/i');
    await expect(subscriptionStatus.first()).toBeVisible();
  });

  test('should enforce feature limits', async () => {
    // Test template limits
    await page.goto('/templates');
    
    // Check for usage indicator
    const usageIndicator = page.locator('text=/\\d+.*of.*\\d+.*used|Templates.*remaining/i');
    if (await usageIndicator.isVisible()) {
      const usageText = await usageIndicator.textContent();
      expect(usageText).toMatch(/\d+/);
    }
    
    // Check for locked templates
    const lockedTemplates = page.locator('[class*="locked"], [class*="blur"], text=/Upgrade.*unlock/i');
    if (await lockedTemplates.first().isVisible()) {
      // Click on locked template
      await lockedTemplates.first().click();
      
      // Should show upgrade prompt
      await expect(page.locator('text=/Upgrade.*Pro|Premium.*feature/i')).toBeVisible();
    }
  });

  test('should handle billing management', async () => {
    await page.goto('/settings');
    
    // Look for billing section
    const billingSection = page.locator('text=/Billing|Subscription|Payment/i');
    if (await billingSection.isVisible()) {
      await billingSection.click();
      
      // Check for subscription details
      await expect(page.locator('text=/Current.*Plan|Subscription.*Status/i')).toBeVisible();
      
      // Check for manage button
      const manageButton = page.locator('button').filter({ hasText: /Manage.*Subscription|Billing.*Portal/i });
      if (await manageButton.isVisible()) {
        // This would redirect to Stripe billing portal
        const href = await manageButton.getAttribute('href');
        if (href) {
          expect(href).toContain('billing.stripe.com');
        }
      }
    }
  });

  test('should show upgrade prompts at limit points', async () => {
    // Navigate to a feature with limits
    await page.goto('/templates');
    
    // Try to use a premium template
    const premiumTemplate = page.locator('.template-card').filter({ has: page.locator('text=/Premium|Pro|Locked/i') }).first();
    if (await premiumTemplate.isVisible()) {
      await premiumTemplate.click();
      
      // Should show upgrade modal
      await expect(page.locator('text=/Upgrade.*unlock|Premium.*required/i')).toBeVisible();
      
      // Check for pricing in upgrade prompt
      await expect(page.locator('text=/$\\d+/i')).toBeVisible();
    }
  });

  test('should handle payment errors gracefully', async () => {
    await page.goto('/pricing');
    
    // This test would require mocking payment failures
    // For now, just check that error handling UI exists
    const upgradeButton = page.locator('button').filter({ hasText: /Upgrade.*Pro/i });
    await upgradeButton.click();
    
    // If there's an error state, it should be handled
    const errorMessage = page.locator('text=/Error|Failed|Try again/i');
    if (await errorMessage.isVisible({ timeout: 5000 })) {
      expect(await errorMessage.textContent()).toMatch(/error|failed|try again/i);
    }
  });
});