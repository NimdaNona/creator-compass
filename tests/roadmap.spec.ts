import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'chasecclifton@yahoo.com';
const TEST_PASSWORD = 'Password123!';

test.describe('Roadmap Functionality', () => {
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

  test('should display roadmap page', async () => {
    await page.goto('/roadmap');
    
    // Check for roadmap title
    await expect(page.locator('h1').filter({ hasText: /Roadmap|Journey|Progress/i })).toBeVisible();
    
    // Check for phase indicators
    await expect(page.locator('text=/Phase|Week|Day/i')).toBeVisible();
  });

  test('should show current progress', async () => {
    await page.goto('/roadmap');
    
    // Check for progress indicators
    const progressBar = page.locator('[role="progressbar"], .progress-bar, [class*="progress"]');
    await expect(progressBar.first()).toBeVisible();
    
    // Check for percentage or completion stats
    await expect(page.locator('text=/%|completed|progress/i')).toBeVisible();
  });

  test('should display phases and weeks', async () => {
    await page.goto('/roadmap');
    
    // Check for phase structure
    const phases = page.locator('text=/Phase\\s*\\d+/i');
    const phaseCount = await phases.count();
    expect(phaseCount).toBeGreaterThan(0);
    
    // Check for week structure
    const weeks = page.locator('text=/Week\\s*\\d+/i');
    const weekCount = await weeks.count();
    expect(weekCount).toBeGreaterThan(0);
  });

  test('should show daily tasks', async () => {
    await page.goto('/roadmap');
    
    // Find and click on a week to expand it
    const week = page.locator('text=/Week\\s*1/i').first();
    if (await week.isVisible()) {
      await week.click();
      
      // Check for daily tasks
      await expect(page.locator('text=/Day\\s*\\d+|Task|Activity/i')).toBeVisible();
      
      // Check for task descriptions
      const tasks = page.locator('.task-item, [class*="task"]');
      const taskCount = await tasks.count();
      expect(taskCount).toBeGreaterThan(0);
    }
  });

  test('should allow task completion', async () => {
    await page.goto('/roadmap');
    
    // Find an incomplete task
    const incompleteTask = page.locator('.task-item:not(.completed), [class*="task"]:not(.completed)').first();
    if (await incompleteTask.isVisible()) {
      // Find complete button within the task
      const completeButton = incompleteTask.locator('button').filter({ hasText: /Complete|Done|Finish/i });
      if (await completeButton.isVisible()) {
        // Click to complete
        await completeButton.click();
        
        // Check for success indicator
        await expect(page.locator('text=/Completed|Success|Points earned/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should update progress after task completion', async () => {
    await page.goto('/roadmap');
    
    // Get initial progress
    const progressText = page.locator('text=/%|completed/i').first();
    const initialProgress = await progressText.textContent();
    
    // Try to complete a task
    const completeButton = page.locator('button').filter({ hasText: /Complete|Done|Finish/i }).first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      await page.waitForTimeout(2000);
      
      // Progress should update
      const updatedProgress = await progressText.textContent();
      expect(updatedProgress).not.toBe(initialProgress);
    }
  });

  test('should show platform-specific content', async () => {
    await page.goto('/roadmap');
    
    // Check for platform indicators
    const platformIndicators = page.locator('text=/YouTube|TikTok|Twitch/i');
    const platformCount = await platformIndicators.count();
    expect(platformCount).toBeGreaterThan(0);
  });

  test('should display milestones', async () => {
    await page.goto('/roadmap');
    
    // Check for milestone section
    const milestones = page.locator('text=/Milestone|Achievement|Goal/i');
    if (await milestones.first().isVisible()) {
      // Check for milestone items
      const milestoneItems = page.locator('.milestone-item, [class*="milestone"]');
      const milestoneCount = await milestoneItems.count();
      expect(milestoneCount).toBeGreaterThan(0);
    }
  });

  test('should handle locked content for free tier', async () => {
    await page.goto('/roadmap');
    
    // Look for locked indicators
    const lockedContent = page.locator('text=/Locked|Upgrade|Premium|Pro Plan/i, [class*="locked"], [class*="blur"]');
    if (await lockedContent.first().isVisible()) {
      // Check for upgrade prompt
      await expect(page.locator('text=/Upgrade.*unlock|Premium.*access/i')).toBeVisible();
    }
  });

  test('should show time estimates', async () => {
    await page.goto('/roadmap');
    
    // Check for time indicators
    await expect(page.locator('text=/\\d+\\s*(min|hour|hr)|Time.*required|Duration/i')).toBeVisible();
  });

  test('should navigate between phases', async () => {
    await page.goto('/roadmap');
    
    // Check for navigation controls
    const phaseNav = page.locator('button').filter({ hasText: /Next.*Phase|Previous.*Phase|Phase.*\\d+/i });
    if (await phaseNav.first().isVisible()) {
      // Click to navigate
      await phaseNav.first().click();
      
      // URL or content should update
      await page.waitForTimeout(1000);
      await expect(page.locator('text=/Phase.*\\d+/i')).toBeVisible();
    }
  });

  test('should show completion celebrations', async () => {
    await page.goto('/roadmap');
    
    // Complete a task if possible
    const completeButton = page.locator('button').filter({ hasText: /Complete|Done|Finish/i }).first();
    if (await completeButton.isVisible()) {
      await completeButton.click();
      
      // Check for celebration elements
      const celebration = page.locator('text=/Congratulations|Well done|Great job|Points earned/i, [class*="celebration"], [class*="confetti"]');
      await expect(celebration.first()).toBeVisible({ timeout: 10000 });
    }
  });
});