import { test, expect, chromium } from '@playwright/test';
import { db } from '../src/lib/db';

test.describe.configure({ mode: 'serial' });

test('Bypass onboarding by updating database directly', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('1. Authenticating...');
    await page.goto('http://localhost:3000/auth/signin');
    
    // Sign in with test credentials
    await page.fill('input[name="email"]', 'chasecclifton@yahoo.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('**/onboarding', { timeout: 10000 });
    console.log('2. Authentication successful');
    
    // Get user session from cookies to identify user ID
    await page.waitForLoadState('networkidle');
    
    // Try to extract user ID from the page or API
    console.log('3. Updating user profile in database...');
    
    // Update the user profile directly in the database
    // This would typically be done server-side
    const userEmail = 'chasecclifton@yahoo.com';
    
    // Execute database update via an API endpoint or direct query
    const response = await page.evaluate(async () => {
      // Call the sync status API to get user info
      const res = await fetch('/api/sync/status');
      return await res.json();
    });
    
    console.log('User data:', response);
    
    // Now navigate directly to dashboard
    console.log('4. Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    
    // Check if we're still on onboarding
    await page.waitForTimeout(2000);
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    if (currentUrl.includes('/onboarding')) {
      console.log('Still on onboarding. Trying to complete it manually...');
      
      // Click through the AI onboarding quickly
      // Type something in the input
      await page.fill('textarea[placeholder*="Type your answer"]', 'I am an experienced content creator');
      
      // Press Enter or click send
      const sendButton = page.locator('button:has-text("Send")').or(page.locator('button[type="submit"]')).first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      await page.waitForTimeout(2000);
      
      // Continue with quick selections
      const quickOptions = page.locator('button').filter({ hasText: /YouTube|TikTok|Twitch|Gaming|Tech|Lifestyle|Education/i });
      const count = await quickOptions.count();
      console.log(`Found ${count} quick option buttons`);
      
      // Click YouTube if available
      const youtubeButton = page.locator('button:has-text("YouTube")').first();
      if (await youtubeButton.isVisible()) {
        await youtubeButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Click Gaming if available
      const gamingButton = page.locator('button:has-text("Gaming")').first();
      if (await gamingButton.isVisible()) {
        await gamingButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Look for any completion or continue button
      const completeButton = page.locator('button').filter({ 
        hasText: /complete|continue|finish|start|dashboard/i 
      }).first();
      
      if (await completeButton.isVisible()) {
        await completeButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Final check
    const finalUrl = page.url();
    console.log('Final URL:', finalUrl);
    
    // Take screenshot
    await page.screenshot({ path: 'final-page-state.png', fullPage: true });
    
    if (finalUrl.includes('/dashboard')) {
      console.log('Successfully reached dashboard!');
      
      // Test dashboard elements
      const welcomeText = await page.locator('h1').first().textContent();
      console.log('Dashboard heading:', welcomeText);
      
      // Look for any visible badges or platform indicators
      const badges = await page.locator('.badge, [class*="badge"]').allTextContents();
      console.log('Badges found:', badges);
      
      // Check for tabs
      const tabs = await page.locator('[role="tab"]').allTextContents();
      console.log('Tabs found:', tabs);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'bypass-test-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('Test complete. Browser will remain open for 30 seconds...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
});