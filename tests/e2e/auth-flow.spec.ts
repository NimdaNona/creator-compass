import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display sign in page correctly', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check page title
    await expect(page).toHaveTitle(/Sign In.*CreatorCompass/);
    
    // Check for sign in options
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
    await expect(page.locator('text=Sign in with GitHub')).toBeVisible();
    
    // Check for branding
    await expect(page.locator('text=CreatorCompass')).toBeVisible();
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');
    
    // Should redirect to sign in
    await page.waitForURL(/.*\/auth\/signin/);
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should redirect unauthenticated users from onboarding', async ({ page }) => {
    // Try to access onboarding without authentication
    await page.goto('/onboarding');
    
    // Should redirect to sign in
    await page.waitForURL(/.*\/auth\/signin/);
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should handle auth provider buttons', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Check Google sign in button
    const googleButton = page.locator('text=Sign in with Google');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    
    // Check GitHub sign in button  
    const githubButton = page.locator('text=Sign in with GitHub');
    await expect(githubButton).toBeVisible();
    await expect(githubButton).toBeEnabled();
    
    // Note: We won't actually click these in tests as they would redirect to external providers
  });

  test('should display proper loading states', async ({ page }) => {
    await page.goto('/auth/signin');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
    
    // Should not show error messages initially
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
  });
});