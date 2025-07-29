import { test, expect, chromium } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('Dashboard access test with manual profile creation', async () => {
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
    console.log('2. Authentication successful, redirected to onboarding');
    
    await page.waitForLoadState('networkidle');
    
    // Try to create profile via API
    console.log('3. Creating minimal profile via API...');
    
    // Get all cookies
    const cookies = await context.cookies();
    console.log('Available cookies:', cookies.map(c => c.name));
    
    // Find session cookie (could be different names)
    const sessionCookie = cookies.find(c => 
      c.name.includes('session-token') || 
      c.name.includes('session') ||
      c.name === '__Secure-next-auth.session-token'
    );
    
    if (!sessionCookie) {
      console.error('No session cookie found. All cookies:', cookies);
      throw new Error('No session cookie found');
    }
    
    console.log('Using session cookie:', sessionCookie.name);
    
    // Create cookie header
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    
    // Make API request to create profile
    const profileResponse = await fetch('http://localhost:3000/api/user/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookieHeader
      },
      body: JSON.stringify({
        selectedPlatform: 'youtube',
        selectedNiche: 'gaming',
        currentPhase: 'Foundation',
        currentWeek: 1,
        goals: ['grow audience', 'monetize content'],
        preferences: ['tutorials', 'live streaming'],
        targetTimeframe: '3 months',
        motivation: 'Build a successful gaming channel'
      })
    });
    
    const responseText = await profileResponse.text();
    console.log('Profile API response:', profileResponse.status, responseText);
    
    if (!profileResponse.ok) {
      throw new Error(`Profile creation failed: ${responseText}`);
    }
    
    console.log('4. Profile created successfully');
    
    // Navigate to dashboard
    console.log('5. Navigating to dashboard...');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-test-result.png', fullPage: true });
    
    if (currentUrl.includes('/onboarding')) {
      console.error('Still on onboarding page after profile creation');
      
      // Check what's in localStorage
      const localStorage = await page.evaluate(() => {
        return {
          platform: window.localStorage.getItem('selectedPlatform'),
          niche: window.localStorage.getItem('selectedNiche'),
          onboardingComplete: window.localStorage.getItem('onboardingComplete')
        };
      });
      console.log('LocalStorage state:', localStorage);
      
      // Try to check sync status
      const syncResponse = await fetch('http://localhost:3000/api/sync/status', {
        headers: {
          'Cookie': cookieHeader
        }
      });
      const syncData = await syncResponse.text();
      console.log('Sync status:', syncData);
    } else {
      console.log('6. Successfully reached dashboard!');
      
      // Test dashboard elements
      const welcomeText = await page.locator('h1').textContent();
      console.log('Welcome text:', welcomeText);
      
      // Check for platform badge
      const badges = await page.locator('.badge').allTextContents();
      console.log('Badges found:', badges);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'dashboard-test-error.png', fullPage: true });
    throw error;
  } finally {
    // Keep browser open for manual inspection
    console.log('Test complete. Browser will remain open for 30 seconds...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
});