import { test, expect, chromium } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test('Comprehensive application test', async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const issues = [];
  
  try {
    console.log('=== COMPREHENSIVE CREATORCOMPASS TESTING ===\n');
    
    // 1. Test Authentication
    console.log('1. Testing Authentication...');
    await page.goto('http://localhost:3000/auth/signin');
    
    await page.fill('input[name="email"]', 'chasecclifton@yahoo.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    const postAuthUrl = page.url();
    console.log('Post-authentication URL:', postAuthUrl);
    
    if (postAuthUrl.includes('/dashboard')) {
      console.log('✓ User has existing profile, redirected to dashboard');
    } else if (postAuthUrl.includes('/onboarding')) {
      console.log('⚠️ User needs onboarding');
      issues.push({
        type: 'UX',
        severity: 'medium',
        description: 'User with existing account still sees onboarding',
        location: '/onboarding'
      });
    }
    
    // 2. Test Dashboard
    console.log('\n2. Testing Dashboard...');
    if (!postAuthUrl.includes('/dashboard')) {
      await page.goto('http://localhost:3000/dashboard');
    }
    
    await page.waitForLoadState('networkidle');
    const dashboardUrl = page.url();
    
    if (dashboardUrl.includes('/dashboard')) {
      console.log('✓ Dashboard loaded successfully');
      await page.screenshot({ path: 'screenshots/dashboard-main.png', fullPage: true });
      
      // Check dashboard elements
      const elements = {
        welcomeHeading: await page.locator('h1').first().textContent(),
        badges: await page.locator('.badge, [class*="badge"]').allTextContents(),
        tabs: await page.locator('[role="tab"]').allTextContents(),
        statsCards: await page.locator('.card, [class*="card"]').count()
      };
      
      console.log('Dashboard elements:', elements);
      
      // Test tabs
      for (const tab of ['overview', 'roadmap', 'calendar']) {
        const tabButton = page.locator(`button[value="${tab}"]`);
        if (await tabButton.isVisible()) {
          await tabButton.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `screenshots/dashboard-${tab}-tab.png` });
          console.log(`✓ ${tab} tab works`);
        } else {
          issues.push({
            type: 'UI',
            severity: 'high',
            description: `${tab} tab not found`,
            location: '/dashboard'
          });
        }
      }
    } else {
      issues.push({
        type: 'Navigation',
        severity: 'critical',
        description: 'Cannot access dashboard',
        location: '/dashboard'
      });
    }
    
    // 3. Test Navigation Menu
    console.log('\n3. Testing Navigation...');
    const navLinks = [
      { name: 'Dashboard', href: '/dashboard' },
      { name: 'For You', href: '/foryou' },
      { name: 'Calendar', href: '/calendar' },
      { name: 'Ideas', href: '/ideas' },
      { name: 'Templates', href: '/templates' },
      { name: 'Platform Tools', href: '/platform-tools' },
      { name: 'Analytics', href: '/analytics' },
      { name: 'Resources', href: '/resources' },
      { name: 'Achievements', href: '/achievements' }
    ];
    
    for (const link of navLinks) {
      try {
        const navLink = page.locator(`a[href="${link.href}"]`).first();
        if (await navLink.isVisible({ timeout: 1000 })) {
          await navLink.click();
          await page.waitForLoadState('networkidle');
          const currentUrl = page.url();
          await page.screenshot({ path: `screenshots/page-${link.name.toLowerCase().replace(' ', '-')}.png` });
          
          if (currentUrl.includes(link.href)) {
            console.log(`✓ ${link.name} page loaded`);
          } else {
            console.log(`⚠️ ${link.name} redirected to ${currentUrl}`);
            issues.push({
              type: 'Navigation',
              severity: 'medium',
              description: `${link.name} link redirects unexpectedly`,
              location: link.href,
              actual: currentUrl
            });
          }
          
          // Go back to dashboard for next test
          await page.goto('http://localhost:3000/dashboard');
        } else {
          console.log(`✗ ${link.name} link not found`);
          issues.push({
            type: 'Navigation',
            severity: 'high',
            description: `${link.name} navigation link missing`,
            location: 'Navigation menu'
          });
        }
      } catch (error) {
        console.log(`✗ Error testing ${link.name}: ${error.message}`);
        issues.push({
          type: 'Error',
          severity: 'high',
          description: `Error accessing ${link.name}`,
          location: link.href,
          error: error.message
        });
      }
    }
    
    // 4. Test Specific Features
    console.log('\n4. Testing Specific Features...');
    
    // Test Templates
    await page.goto('http://localhost:3000/templates');
    await page.waitForLoadState('networkidle');
    
    const templateCards = await page.locator('[data-template-card], .template-card, [class*="template"]').count();
    console.log(`Found ${templateCards} template cards`);
    
    if (templateCards === 0) {
      issues.push({
        type: 'Content',
        severity: 'high',
        description: 'No templates found on templates page',
        location: '/templates'
      });
    }
    
    // Test AI Assistant Widget
    const aiWidget = page.locator('[data-ai-widget], button:has-text("AI Assistant"), button:has-text("Chat")').first();
    if (await aiWidget.isVisible({ timeout: 1000 })) {
      console.log('✓ AI Assistant widget found');
      await aiWidget.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'screenshots/ai-assistant-widget.png' });
      
      // Close it
      const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close"), button:has-text("X")').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    } else {
      console.log('✗ AI Assistant widget not found');
      issues.push({
        type: 'Feature',
        severity: 'medium',
        description: 'AI Assistant widget not visible',
        location: 'Global'
      });
    }
    
    // 5. Test Responsive Design
    console.log('\n5. Testing Responsive Design...');
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: `screenshots/responsive-${viewport.name.toLowerCase()}.png` });
      console.log(`✓ ${viewport.name} viewport tested`);
    }
    
    // 6. Performance Check
    console.log('\n6. Checking Performance...');
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
      };
    });
    
    console.log('Performance metrics:', metrics);
    
    if (metrics.loadComplete > 3000) {
      issues.push({
        type: 'Performance',
        severity: 'medium',
        description: `Page load time too slow: ${metrics.loadComplete}ms`,
        location: 'Global'
      });
    }
    
    // 7. Generate Summary Report
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total issues found: ${issues.length}`);
    console.log('\nIssues by severity:');
    const bySeverity = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {});
    Object.entries(bySeverity).forEach(([severity, count]) => {
      console.log(`- ${severity}: ${count}`);
    });
    
    console.log('\nDetailed Issues:');
    issues.forEach((issue, index) => {
      console.log(`\n${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Location: ${issue.location}`);
      if (issue.error) console.log(`   Error: ${issue.error}`);
      if (issue.actual) console.log(`   Actual: ${issue.actual}`);
    });
    
    // Save report
    await page.evaluate((issuesData) => {
      const report = {
        timestamp: new Date().toISOString(),
        totalIssues: issuesData.length,
        issues: issuesData,
        summary: {
          critical: issuesData.filter(i => i.severity === 'critical').length,
          high: issuesData.filter(i => i.severity === 'high').length,
          medium: issuesData.filter(i => i.severity === 'medium').length,
          low: issuesData.filter(i => i.severity === 'low').length
        }
      };
      console.log('Full Report:', JSON.stringify(report, null, 2));
    }, issues);
    
  } catch (error) {
    console.error('Test failed with error:', error);
    await page.screenshot({ path: 'screenshots/test-error.png', fullPage: true });
    throw error;
  } finally {
    console.log('\nTest complete. Browser will remain open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
});