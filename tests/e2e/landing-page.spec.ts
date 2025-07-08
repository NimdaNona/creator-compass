import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load and display the main title', async ({ page }) => {
    // Wait for the page to load
    await expect(page).toHaveTitle(/CreatorCompass/);
    
    // Check for main heading
    await expect(page.locator('h1')).toContainText('CreatorCompass');
  });

  test('should have navigation elements', async ({ page }) => {
    // Check for header navigation
    await expect(page.locator('header')).toBeVisible();
    
    // Check for sign in link
    await expect(page.locator('text=Sign In')).toBeVisible();
    
    // Check for get started button
    await expect(page.locator('text=Get Started')).toBeVisible();
  });

  test('should navigate to sign in page when clicking sign in', async ({ page }) => {
    await page.click('text=Sign In');
    
    // Should navigate to sign in page
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should navigate to sign in page when clicking get started', async ({ page }) => {
    await page.click('text=Get Started');
    
    // Should navigate to sign in page for new users
    await expect(page).toHaveURL(/.*\/auth\/signin/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Page should still be accessible
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have proper meta tags for SEO', async ({ page }) => {
    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.+/);
    
    // Check viewport meta tag
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });
});