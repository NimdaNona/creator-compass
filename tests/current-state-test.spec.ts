import { test, expect } from '@playwright/test';

test('Check current application state after login', async ({ page }) => {
  console.log('Starting current state test...\n');
  
  // Test with 60 second timeout
  test.setTimeout(60000);
  
  try {
    // 1. Go to signin page
    console.log('1. Navigating to signin page...');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'networkidle' });
    
    // 2. Fill in credentials
    console.log('2. Filling in credentials...');
    await page.fill('input[name="email"]', 'chasecclifton@yahoo.com');
    await page.fill('input[name="password"]', 'Password123!');
    
    // 3. Submit form
    console.log('3. Submitting login form...');
    await page.click('button[type="submit"]');
    
    // 4. Wait for navigation with longer timeout
    console.log('4. Waiting for post-login navigation...');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    
    // 5. Check where we ended up
    const currentUrl = page.url();
    console.log('\n=== CURRENT STATE ===');
    console.log('Current URL:', currentUrl);
    
    // Take screenshot
    await page.screenshot({ path: 'current-state.png', fullPage: true });
    
    // Get page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Check main heading
    const h1Text = await page.locator('h1').first().textContent().catch(() => 'No H1 found');
    console.log('Main heading:', h1Text);
    
    // Check for specific elements based on URL
    if (currentUrl.includes('/dashboard')) {
      console.log('\n✓ Successfully reached dashboard!');
      
      // Check for dashboard-specific elements
      const badges = await page.locator('.badge').allTextContents();
      console.log('Badges:', badges);
      
      const tabs = await page.locator('[role="tab"]').allTextContents();
      console.log('Tabs:', tabs);
      
    } else if (currentUrl.includes('/onboarding')) {
      console.log('\n⚠️ Still on onboarding page');
      
      // Check onboarding state
      const stepIndicator = await page.locator('text=/Step \\d+ of \\d+/').textContent().catch(() => 'No step indicator');
      console.log('Step indicator:', stepIndicator);
      
      // Check for AI assistant
      const aiHeading = await page.locator('h2:has-text("AI Onboarding")').isVisible();
      console.log('AI Onboarding visible:', aiHeading);
      
    } else {
      console.log('\n❓ Unexpected page:', currentUrl);
    }
    
    // Check for error messages
    const errorMessages = await page.locator('.error, [role="alert"], .text-destructive').allTextContents();
    if (errorMessages.length > 0) {
      console.log('\nError messages found:', errorMessages);
    }
    
    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console error:', msg.text());
      }
    });
    
    console.log('\n=== END OF STATE CHECK ===');
    
  } catch (error) {
    console.error('\nTest error:', error.message);
    await page.screenshot({ path: 'current-state-error.png', fullPage: true });
    throw error;
  }
});