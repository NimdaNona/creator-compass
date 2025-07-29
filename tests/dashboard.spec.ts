import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'chasecclifton@yahoo.com';
const TEST_PASSWORD = 'Password123!';

test.describe('Dashboard Tests', () => {
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

  test('should display dashboard with all key elements', async () => {
    await page.goto('/dashboard');
    
    // Check for main dashboard elements
    await expect(page.locator('h1').filter({ hasText: 'Dashboard' })).toBeVisible();
    
    // Check for stats cards
    await expect(page.locator('text=/Total Points|Streak|Tasks Completed/i')).toBeVisible();
    
    // Check for navigation menu
    await expect(page.locator('nav')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Roadmap')).toBeVisible();
    await expect(page.locator('text=Templates')).toBeVisible();
    await expect(page.locator('text=Resources')).toBeVisible();
    await expect(page.locator('text=Achievements')).toBeVisible();
  });

  test('should display user stats correctly', async () => {
    await page.goto('/dashboard');
    
    // Check for stats cards
    const statsCards = page.locator('.stats-card, [class*="stat"]');
    const count = await statsCards.count();
    expect(count).toBeGreaterThan(0);
    
    // Check for points display
    await expect(page.locator('text=/\\d+\\s*(points|Points)/i')).toBeVisible();
    
    // Check for streak display
    await expect(page.locator('text=/\\d+\\s*(day|Day)/i')).toBeVisible();
    
    // Check for tasks completed
    await expect(page.locator('text=/\\d+\\s*(tasks|Tasks)/i')).toBeVisible();
  });

  test('should show roadmap progress', async () => {
    await page.goto('/dashboard');
    
    // Check for roadmap section
    const roadmapSection = page.locator('text=/Your.*Roadmap|Current.*Phase|Progress/i');
    if (await roadmapSection.isVisible()) {
      // Check for progress indicators
      await expect(page.locator('[role="progressbar"], .progress-bar, [class*="progress"]')).toBeVisible();
    }
  });

  test('should display recent achievements', async () => {
    await page.goto('/dashboard');
    
    // Check for achievements section
    const achievementsSection = page.locator('text=/Recent.*Achievements|Badges|Milestones/i');
    if (await achievementsSection.isVisible()) {
      // Should show achievement items or empty state
      const achievementItems = page.locator('.achievement-item, [class*="achievement"], [class*="badge"]');
      const emptyState = page.locator('text=/No achievements yet|Start your journey/i');
      
      const hasAchievements = await achievementItems.count() > 0;
      const hasEmptyState = await emptyState.isVisible();
      
      expect(hasAchievements || hasEmptyState).toBeTruthy();
    }
  });

  test('should show AI insights or recommendations', async () => {
    await page.goto('/dashboard');
    
    // Check for AI insights section
    const insightsSection = page.locator('text=/AI.*Insights|Recommendations|Tips/i');
    if (await insightsSection.isVisible()) {
      // Should have some content
      expect(await insightsSection.textContent()).toBeTruthy();
    }
  });

  test('should have working navigation links', async () => {
    await page.goto('/dashboard');
    
    // Test roadmap navigation
    await page.click('nav >> text=Roadmap');
    await expect(page).toHaveURL('/roadmap');
    await page.goBack();
    
    // Test templates navigation
    await page.click('nav >> text=Templates');
    await expect(page).toHaveURL('/templates');
    await page.goBack();
    
    // Test resources navigation
    await page.click('nav >> text=Resources');
    await expect(page).toHaveURL('/resources');
    await page.goBack();
    
    // Test achievements navigation
    await page.click('nav >> text=Achievements');
    await expect(page).toHaveURL('/achievements');
  });

  test('should display quick actions', async () => {
    await page.goto('/dashboard');
    
    // Check for quick action buttons
    const quickActions = page.locator('button').filter({ 
      hasText: /Continue.*Roadmap|View.*Templates|Check.*Resources|Start.*Task/i 
    });
    
    const actionsCount = await quickActions.count();
    expect(actionsCount).toBeGreaterThan(0);
  });

  test('should show subscription status', async () => {
    await page.goto('/dashboard');
    
    // Check for subscription indicator
    const subscriptionBadge = page.locator('text=/Free.*Plan|Pro.*Plan|Studio.*Plan|Upgrade/i');
    if (await subscriptionBadge.isVisible()) {
      const text = await subscriptionBadge.textContent();
      expect(text).toMatch(/Free|Pro|Studio|Upgrade/i);
    }
  });

  test('should handle empty states gracefully', async () => {
    await page.goto('/dashboard');
    
    // Check various sections for empty states
    const sections = [
      { selector: 'text=/Recent.*Activity/i', emptyText: /No recent activity|Get started/i },
      { selector: 'text=/Upcoming.*Tasks/i', emptyText: /No tasks|Start your roadmap/i },
      { selector: 'text=/Milestones/i', emptyText: /No milestones|Keep going/i }
    ];
    
    for (const section of sections) {
      const sectionElement = page.locator(section.selector);
      if (await sectionElement.isVisible()) {
        const parentSection = sectionElement.locator('..');
        const hasContent = await parentSection.locator('.item, .card, li').count() > 0;
        const hasEmptyState = await parentSection.locator(`text=${section.emptyText}`).isVisible();
        
        expect(hasContent || hasEmptyState).toBeTruthy();
      }
    }
  });

  test('should update in real-time after actions', async () => {
    await page.goto('/dashboard');
    
    // Get initial points value
    const pointsElement = page.locator('text=/\\d+\\s*(points|Points)/i').first();
    const initialPoints = await pointsElement.textContent();
    
    // Navigate to roadmap and complete a task (if available)
    await page.click('nav >> text=Roadmap');
    
    // Try to find and complete a task
    const completeButton = page.locator('button').filter({ hasText: /Complete|Mark.*Done|Finish/i }).first();
    if (await completeButton.isVisible({ timeout: 5000 })) {
      await completeButton.click();
      
      // Go back to dashboard
      await page.click('nav >> text=Dashboard');
      
      // Points should have updated
      const updatedPoints = await pointsElement.textContent();
      expect(updatedPoints).not.toBe(initialPoints);
    }
  });
});