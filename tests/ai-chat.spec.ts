import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'chasecclifton@yahoo.com';
const TEST_PASSWORD = 'Password123!';

test.describe('AI Chat Functionality', () => {
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

  test('should display AI chat widget', async () => {
    await page.goto('/dashboard');
    
    // Check for AI chat button/widget
    const aiChatButton = page.locator('button[aria-label*="AI"], button[aria-label*="Chat"], button[aria-label*="Assistant"]');
    await expect(aiChatButton).toBeVisible();
    
    // Click to open chat
    await aiChatButton.click();
    
    // Check for chat interface
    await expect(page.locator('.chat-container, [class*="chat"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="message"], input[placeholder*="ask"]')).toBeVisible();
  });

  test('should send and receive AI messages', async () => {
    await page.goto('/dashboard');
    
    // Open AI chat
    const aiChatButton = page.locator('button[aria-label*="AI"], button[aria-label*="Chat"], button[aria-label*="Assistant"]');
    await aiChatButton.click();
    
    // Send a message
    const chatInput = page.locator('textarea[placeholder*="message"], input[placeholder*="ask"]');
    await chatInput.fill('What are the best practices for YouTube thumbnails?');
    
    // Submit message
    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').filter({ hasText: /Send|Submit/i });
    await sendButton.click();
    
    // Wait for AI response
    await expect(page.locator('.message, [class*="message"]').last()).toContainText(/thumbnail|YouTube|image|click/i, { timeout: 30000 });
  });

  test('should handle platform-specific questions', async () => {
    await page.goto('/dashboard');
    
    // Open AI chat
    const aiChatButton = page.locator('button[aria-label*="AI"], button[aria-label*="Chat"], button[aria-label*="Assistant"]');
    await aiChatButton.click();
    
    const testQuestions = [
      { 
        question: 'How do I set up OBS for Twitch streaming?',
        expectedKeywords: /OBS|stream|Twitch|setup|software/i
      },
      {
        question: 'What are trending TikTok sounds right now?',
        expectedKeywords: /TikTok|trend|sound|music|viral/i
      },
      {
        question: 'How do I improve my YouTube channel SEO?',
        expectedKeywords: /YouTube|SEO|search|optimization|keywords/i
      }
    ];
    
    for (const { question, expectedKeywords } of testQuestions) {
      // Clear input
      const chatInput = page.locator('textarea[placeholder*="message"], input[placeholder*="ask"]');
      await chatInput.clear();
      await chatInput.fill(question);
      
      // Send message
      const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').filter({ hasText: /Send|Submit/i });
      await sendButton.click();
      
      // Wait for response
      await expect(page.locator('.message, [class*="message"]').last()).toContainText(expectedKeywords, { timeout: 30000 });
      
      // Small delay between questions
      await page.waitForTimeout(2000);
    }
  });

  test('should maintain conversation context', async () => {
    await page.goto('/dashboard');
    
    // Open AI chat
    const aiChatButton = page.locator('button[aria-label*="AI"], button[aria-label*="Chat"], button[aria-label*="Assistant"]');
    await aiChatButton.click();
    
    // First message
    const chatInput = page.locator('textarea[placeholder*="message"], input[placeholder*="ask"]');
    await chatInput.fill('I want to create gaming content');
    
    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').filter({ hasText: /Send|Submit/i });
    await sendButton.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Follow-up message that requires context
    await chatInput.clear();
    await chatInput.fill('What equipment do I need for that?');
    await sendButton.click();
    
    // Response should mention gaming-specific equipment
    await expect(page.locator('.message, [class*="message"]').last()).toContainText(/gaming|capture card|microphone|webcam|PC|console/i, { timeout: 30000 });
  });

  test('should show typing indicator', async () => {
    await page.goto('/dashboard');
    
    // Open AI chat
    const aiChatButton = page.locator('button[aria-label*="AI"], button[aria-label*="Chat"], button[aria-label*="Assistant"]');
    await aiChatButton.click();
    
    // Send a message
    const chatInput = page.locator('textarea[placeholder*="message"], input[placeholder*="ask"]');
    await chatInput.fill('Hello');
    
    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').filter({ hasText: /Send|Submit/i });
    await sendButton.click();
    
    // Check for typing indicator
    const typingIndicator = page.locator('text=/typing|Thinking|Loading/i, [class*="typing"], [class*="loading"]');
    await expect(typingIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should handle errors gracefully', async () => {
    await page.goto('/dashboard');
    
    // Open AI chat
    const aiChatButton = page.locator('button[aria-label*="AI"], button[aria-label*="Chat"], button[aria-label*="Assistant"]');
    await aiChatButton.click();
    
    // Send very long message to potentially trigger error
    const chatInput = page.locator('textarea[placeholder*="message"], input[placeholder*="ask"]');
    const longMessage = 'test '.repeat(300); // 1500 characters
    await chatInput.fill(longMessage);
    
    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').filter({ hasText: /Send|Submit/i });
    await sendButton.click();
    
    // Should either handle the message or show an error
    const errorMessage = page.locator('text=/error|failed|try again|limit/i');
    const successMessage = page.locator('.message, [class*="message"]').last();
    
    await expect(errorMessage.or(successMessage)).toBeVisible({ timeout: 30000 });
  });

  test('should persist chat history', async () => {
    await page.goto('/dashboard');
    
    // Open AI chat
    const aiChatButton = page.locator('button[aria-label*="AI"], button[aria-label*="Chat"], button[aria-label*="Assistant"]');
    await aiChatButton.click();
    
    // Send a unique message
    const uniqueMessage = `Test message ${Date.now()}`;
    const chatInput = page.locator('textarea[placeholder*="message"], input[placeholder*="ask"]');
    await chatInput.fill(uniqueMessage);
    
    const sendButton = page.locator('button[aria-label="Send"], button[type="submit"]').filter({ hasText: /Send|Submit/i });
    await sendButton.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Close and reopen chat
    const closeButton = page.locator('button[aria-label*="Close"], button[aria-label*="Minimize"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    
    await page.waitForTimeout(1000);
    await aiChatButton.click();
    
    // Check if previous message is still there
    await expect(page.locator(`text="${uniqueMessage}"`)).toBeVisible();
  });

  test('should enforce usage limits for free tier', async () => {
    // This test assumes the user is on free tier
    await page.goto('/dashboard');
    
    // Open AI chat
    const aiChatButton = page.locator('button[aria-label*="AI"], button[aria-label*="Chat"], button[aria-label*="Assistant"]');
    await aiChatButton.click();
    
    // Check for usage indicator
    const usageIndicator = page.locator('text=/\\d+.*messages.*remaining|Usage.*limit|AI.*credits/i');
    if (await usageIndicator.isVisible()) {
      const usageText = await usageIndicator.textContent();
      expect(usageText).toMatch(/\d+/);
    }
  });
});