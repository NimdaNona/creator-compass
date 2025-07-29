import { test, expect, Page } from '@playwright/test';

const TEST_EMAIL = 'chasecclifton@yahoo.com';
const TEST_PASSWORD = 'Password123!';

test.describe('Authentication Flow', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/');
  });

  test('should display landing page with sign in options', async () => {
    // Check for main heading
    await expect(page.locator('h1').filter({ hasText: 'Your AI-Powered Creator Compass' })).toBeVisible();
    
    // Check for sign in button
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Check for Get Started button
    await expect(page.locator('text=Get Started Free')).toBeVisible();
  });

  test('should navigate to sign in page', async () => {
    await page.click('text=Sign In');
    await expect(page).toHaveURL('/auth/signin');
    
    // Check for sign in form elements
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for OAuth options
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('should show validation errors for invalid inputs', async () => {
    await page.goto('/auth/signin');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    
    // Test invalid email
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email address')).toBeVisible();
    
    // Test short password
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should sign in with valid credentials', async () => {
    await page.goto('/auth/signin');
    
    // Fill in credentials
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 30000 });
    
    // Should be redirected to dashboard or onboarding
    const url = page.url();
    expect(url).toMatch(/\/dashboard|\/onboarding/);
  });

  test('should handle sign up flow', async () => {
    await page.goto('/auth/signup');
    
    // Check for sign up form elements
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    
    // Test password mismatch
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'TestPassword123!');
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
  });

  test('should handle forgot password flow', async () => {
    await page.goto('/auth/signin');
    
    // Click forgot password link
    await page.click('text=Forgot password?');
    await expect(page).toHaveURL('/auth/forgot-password');
    
    // Check for forgot password form
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('text=Send Reset Email')).toBeVisible();
    
    // Test submitting email
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.click('text=Send Reset Email');
    
    // Should show success message
    await expect(page.locator('text=Password reset email sent')).toBeVisible({ timeout: 10000 });
  });

  test('should handle sign out', async () => {
    // First sign in
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', TEST_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/onboarding/, { timeout: 30000 });
    
    // Find and click sign out
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Sign Out');
    
    // Should be redirected to home page
    await expect(page).toHaveURL('/');
  });

  test('should protect authenticated routes', async () => {
    // Try to access protected routes without authentication
    const protectedRoutes = [
      '/dashboard',
      '/roadmap',
      '/templates',
      '/resources',
      '/achievements',
      '/analytics',
      '/settings'
    ];
    
    for (const route of protectedRoutes) {
      await page.goto(route);
      // Should be redirected to sign in
      await expect(page).toHaveURL('/auth/signin');
    }
  });
});