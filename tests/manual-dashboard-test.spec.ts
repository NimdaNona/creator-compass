import { test, expect } from '@playwright/test';

test('Manual dashboard test - create minimal profile and access dashboard', async ({ page, context }) => {
  // First authenticate
  await page.goto('http://localhost:3000/auth/signin');
  
  // Sign in with test credentials
  await page.fill('input[name="email"]', 'chasecclifton@yahoo.com');
  await page.fill('input[name="password"]', 'Password123!');
  await page.click('button[type="submit"]');
  
  // Wait for authentication to complete
  await page.waitForURL('**/onboarding', { timeout: 10000 });
  console.log('Authentication successful, now on onboarding page');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  console.log('Creating minimal profile via API to bypass onboarding...');
  
  // Get authentication cookies
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name.includes('next-auth.session-token'));
  
  if (!sessionCookie) {
    throw new Error('No session cookie found');
  }
  
  // Create minimal profile via API
  const profileResponse = await page.request.put('http://localhost:3000/api/user/profile', {
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `${sessionCookie.name}=${sessionCookie.value}`
    },
    data: {
      selectedPlatform: 'youtube',
      selectedNiche: 'gaming',
      currentPhase: 'Foundation',
      currentWeek: 1,
      goals: ['grow audience', 'monetize content'],
      preferences: ['tutorials', 'live streaming'],
      targetTimeframe: '3 months',
      motivation: 'Build a successful gaming channel'
    }
  });
  
  if (!profileResponse.ok()) {
    const error = await profileResponse.text();
    console.error('Profile update failed:', error);
    throw new Error(`Failed to update profile: ${profileResponse.status()}`);
  }
  
  console.log('Profile created successfully');
  
  // Navigate to dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  
  // Check if we reached the dashboard
  const url = page.url();
  console.log('Current URL:', url);
  
  if (url.includes('/onboarding')) {
    throw new Error('Still redirected to onboarding after profile creation');
  }
  
  // Take screenshot of dashboard
  await page.screenshot({ path: 'dashboard-loaded.png', fullPage: true });
  
  // Test dashboard elements
  console.log('Testing dashboard elements...');
  
  // Check for welcome message
  const welcomeText = await page.locator('h1').textContent();
  console.log('Welcome text:', welcomeText);
  expect(welcomeText).toContain('Welcome back');
  
  // Check for platform badge
  const platformBadge = await page.locator('.bg-red-500').textContent();
  console.log('Platform badge:', platformBadge);
  expect(platformBadge).toContain('YouTube');
  
  // Check for niche badge
  const nicheBadge = await page.locator('text=gaming').first();
  expect(nicheBadge).toBeVisible();
  
  // Test tabs
  console.log('Testing dashboard tabs...');
  
  // Overview tab (default)
  const overviewTab = page.locator('button[value="overview"]');
  await expect(overviewTab).toBeVisible();
  
  // Roadmap tab
  const roadmapTab = page.locator('button[value="roadmap"]');
  await roadmapTab.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'dashboard-roadmap-tab.png' });
  
  // Calendar tab
  const calendarTab = page.locator('button[value="calendar"]');
  await calendarTab.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'dashboard-calendar-tab.png' });
  
  // Test Quick Actions
  console.log('Testing quick actions...');
  const quickActions = page.locator('text=Quick Actions').first();
  if (await quickActions.isVisible()) {
    await page.screenshot({ path: 'dashboard-quick-actions.png' });
  }
  
  // Test Today's Tasks
  console.log('Testing today\'s tasks...');
  const todaysTasks = page.locator('[data-today-tasks]');
  if (await todaysTasks.isVisible()) {
    await page.screenshot({ path: 'dashboard-todays-tasks.png' });
  }
  
  // Test navigation links
  console.log('Testing navigation...');
  
  // Test Templates link
  const templatesLink = page.locator('a[href="/templates"]').first();
  await templatesLink.click();
  await page.waitForLoadState('networkidle');
  console.log('Navigated to:', page.url());
  await page.screenshot({ path: 'templates-page.png' });
  
  // Go back to dashboard
  await page.goto('http://localhost:3000/dashboard');
  
  // Test Roadmap link
  const roadmapLink = page.locator('a[href="/roadmap"]').first();
  await roadmapLink.click();
  await page.waitForLoadState('networkidle');
  console.log('Navigated to:', page.url());
  await page.screenshot({ path: 'roadmap-page.png' });
  
  console.log('Dashboard testing completed successfully!');
});