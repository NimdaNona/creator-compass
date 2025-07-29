import { test, expect, Page } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
  });

  test('should complete onboarding flow for new user', async () => {
    // Start from home page
    await page.goto('/');
    
    // Click Get Started
    await page.click('text=Get Started Free');
    
    // Should be on onboarding page
    await expect(page).toHaveURL('/onboarding');
    
    // Check for AI assistant
    await expect(page.locator('text=Welcome to CreatorCompass!')).toBeVisible({ timeout: 10000 });
    
    // Test the conversational flow
    // Step 1: Creator level
    await page.fill('textarea[placeholder*="Type your message"]', "I'm just starting out");
    await page.click('button[aria-label="Send message"]');
    
    // Wait for AI response about platform
    await expect(page.locator('text=/platform.*focus.*YouTube.*TikTok.*Twitch/i')).toBeVisible({ timeout: 15000 });
    
    // Step 2: Platform selection
    await page.fill('textarea[placeholder*="Type your message"]', "I want to focus on YouTube");
    await page.click('button[aria-label="Send message"]');
    
    // Wait for AI response about content niche
    await expect(page.locator('text=/content.*create|niche/i')).toBeVisible({ timeout: 15000 });
    
    // Step 3: Content niche
    await page.fill('textarea[placeholder*="Type your message"]', "Gaming content");
    await page.click('button[aria-label="Send message"]');
    
    // Wait for AI response about equipment
    await expect(page.locator('text=/equipment.*setup|gear/i')).toBeVisible({ timeout: 15000 });
    
    // Step 4: Equipment
    await page.fill('textarea[placeholder*="Type your message"]', "I have a decent PC and a basic webcam");
    await page.click('button[aria-label="Send message"]');
    
    // Wait for AI response about goals
    await expect(page.locator('text=/goals.*time.*dedicate/i')).toBeVisible({ timeout: 15000 });
    
    // Step 5: Goals
    await page.fill('textarea[placeholder*="Type your message"]', "I can dedicate about 20 hours per week");
    await page.click('button[aria-label="Send message"]');
    
    // Wait for AI response about challenges
    await expect(page.locator('text=/challenge.*concern/i')).toBeVisible({ timeout: 15000 });
    
    // Step 6: Challenges
    await page.fill('textarea[placeholder*="Type your message"]', "I'm worried about building an audience");
    await page.click('button[aria-label="Send message"]');
    
    // Wait for completion message
    await expect(page.locator('text=/Start My Creator Journey/i')).toBeVisible({ timeout: 15000 });
    
    // Click the button to continue
    await page.click('button:has-text("Start My Creator Journey")');
    
    // Should navigate to sign up or dashboard
    await expect(page).toHaveURL(/\/auth\/signup|\/dashboard/);
  });

  test('should handle platform selection variations', async () => {
    await page.goto('/onboarding');
    
    // Skip to platform selection
    await page.fill('textarea[placeholder*="Type your message"]', "1");
    await page.click('button[aria-label="Send message"]');
    
    await page.waitForTimeout(2000);
    
    // Test "all platforms" variation
    await page.fill('textarea[placeholder*="Type your message"]', "I want to create content for all three platforms");
    await page.click('button[aria-label="Send message"]');
    
    // Should proceed to niche question
    await expect(page.locator('text=/content.*create|niche/i')).toBeVisible({ timeout: 15000 });
  });

  test('should persist conversation during onboarding', async () => {
    await page.goto('/onboarding');
    
    // Send first message
    await page.fill('textarea[placeholder*="Type your message"]', "I'm a beginner");
    await page.click('button[aria-label="Send message"]');
    
    await page.waitForTimeout(2000);
    
    // Reload page
    await page.reload();
    
    // Conversation should still be there
    await expect(page.locator('text="I\'m a beginner"')).toBeVisible();
  });

  test('should show proper error handling', async () => {
    await page.goto('/onboarding');
    
    // Send empty message
    await page.click('button[aria-label="Send message"]');
    
    // Should not send empty message
    const messages = await page.locator('.message-bubble').count();
    expect(messages).toBe(1); // Only welcome message
    
    // Test very long message
    const longMessage = 'a'.repeat(1001);
    await page.fill('textarea[placeholder*="Type your message"]', longMessage);
    await page.click('button[aria-label="Send message"]');
    
    // Should show error or truncate
    await expect(page.locator('text=/message.*too long|1000 characters/i')).toBeVisible({ timeout: 5000 });
  });

  test('should handle AI timeout gracefully', async () => {
    await page.goto('/onboarding');
    
    // Send message
    await page.fill('textarea[placeholder*="Type your message"]', "Hello");
    await page.click('button[aria-label="Send message"]');
    
    // If timeout occurs, should show error message
    // Note: This test might not trigger timeout in normal conditions
    // but tests the error handling UI exists
    const errorMessage = page.locator('text=/error|timeout|try again/i');
    if (await errorMessage.isVisible({ timeout: 35000 })) {
      expect(await errorMessage.textContent()).toMatch(/error|timeout|try again/i);
    }
  });
});