import { test, expect } from '@playwright/test';

test.describe('CreatorCompass Full Application Test', () => {
  test('Comprehensive testing of all features and identify issues', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes
    
    const issues = [];
    const testResults = {
      timestamp: new Date().toISOString(),
      passed: [],
      failed: [],
      issues: []
    };
    
    console.log('=== CREATORCOMPASS COMPREHENSIVE TESTING ===\n');
    console.log('Test Account: chasecclifton@yahoo.com / Password123!');
    console.log('Objective: Test ALL aspects and identify EVERY issue\n');
    
    try {
      // 1. AUTHENTICATION TEST
      console.log('1. AUTHENTICATION TESTING');
      console.log('------------------------');
      
      await page.goto('http://localhost:3000/auth/signin');
      await page.fill('input[type="email"]', 'chasecclifton@yahoo.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Sign In")');
      
      await page.waitForNavigation();
      const postLoginUrl = page.url();
      
      if (postLoginUrl.includes('/dashboard')) {
        console.log('✓ Authentication successful - redirected to dashboard');
        testResults.passed.push('Authentication flow');
      } else {
        console.log('✗ Authentication redirect issue');
        issues.push({
          category: 'Authentication',
          severity: 'high',
          description: 'Post-login redirect not going to dashboard',
          location: postLoginUrl
        });
      }
      
      // 2. DASHBOARD TESTING
      console.log('\n2. DASHBOARD TESTING');
      console.log('--------------------');
      
      if (!postLoginUrl.includes('/dashboard')) {
        await page.goto('http://localhost:3000/dashboard');
      }
      
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'screenshots/dashboard-main.png', fullPage: true });
      
      // Check dashboard elements
      const dashboardChecks = {
        welcomeHeading: await page.locator('h1').first().isVisible(),
        platformBadge: await page.locator('.badge').first().isVisible(),
        tabs: await page.locator('[role="tab"]').count(),
        progressStats: await page.locator('[class*="card"]').count(),
        todaysTasks: await page.locator('[data-today-tasks]').isVisible(),
        quickActions: await page.locator('text=Quick Actions').isVisible(),
        aiWidget: await page.locator('button:has-text("AI"), button:has-text("Chat")').isVisible()
      };
      
      console.log('Dashboard elements:', dashboardChecks);
      
      if (!dashboardChecks.welcomeHeading) {
        issues.push({
          category: 'Dashboard',
          severity: 'medium',
          description: 'Welcome heading not visible',
          location: '/dashboard'
        });
      }
      
      if (dashboardChecks.tabs < 3) {
        issues.push({
          category: 'Dashboard',
          severity: 'high',
          description: 'Missing dashboard tabs (expected 3)',
          location: '/dashboard'
        });
      }
      
      // Test each tab
      const tabNames = ['overview', 'roadmap', 'calendar'];
      for (const tabName of tabNames) {
        try {
          const tab = page.locator(`button[value="${tabName}"]`);
          if (await tab.isVisible()) {
            await tab.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: `screenshots/dashboard-${tabName}.png` });
            console.log(`✓ ${tabName} tab functional`);
          } else {
            issues.push({
              category: 'Dashboard',
              severity: 'high',
              description: `${tabName} tab not found`,
              location: '/dashboard'
            });
          }
        } catch (error) {
          issues.push({
            category: 'Dashboard',
            severity: 'high',
            description: `Error clicking ${tabName} tab: ${error.message}`,
            location: '/dashboard'
          });
        }
      }
      
      // 3. NAVIGATION TESTING
      console.log('\n3. NAVIGATION TESTING');
      console.log('---------------------');
      
      const navigationLinks = [
        { name: 'Dashboard', href: '/dashboard', expectedContent: 'Welcome back' },
        { name: 'For You', href: '/foryou', expectedContent: 'For You' },
        { name: 'Calendar', href: '/calendar', expectedContent: 'Calendar' },
        { name: 'Ideas', href: '/ideas', expectedContent: 'Ideas' },
        { name: 'Templates', href: '/templates', expectedContent: 'Templates' },
        { name: 'Platform Tools', href: '/platform-tools', expectedContent: 'Platform' },
        { name: 'Analytics', href: '/analytics', expectedContent: 'Analytics' },
        { name: 'Resources', href: '/resources', expectedContent: 'Resources' },
        { name: 'Achievements', href: '/achievements', expectedContent: 'Achievements' }
      ];
      
      for (const link of navigationLinks) {
        try {
          console.log(`\nTesting ${link.name}...`);
          
          // Try to click the navigation link
          const navLink = page.locator(`a[href="${link.href}"]`).first();
          
          if (await navLink.isVisible({ timeout: 2000 })) {
            await navLink.click();
            await page.waitForLoadState('networkidle');
            
            const currentUrl = page.url();
            const pageContent = await page.textContent('body');
            
            if (currentUrl.includes(link.href)) {
              console.log(`✓ ${link.name} navigation works`);
              testResults.passed.push(`${link.name} navigation`);
              
              // Take screenshot
              await page.screenshot({ 
                path: `screenshots/page-${link.name.toLowerCase().replace(' ', '-')}.png` 
              });
              
              // Check for expected content
              if (!pageContent.toLowerCase().includes(link.expectedContent.toLowerCase())) {
                issues.push({
                  category: 'Content',
                  severity: 'medium',
                  description: `${link.name} page missing expected content`,
                  location: link.href
                });
              }
            } else {
              console.log(`✗ ${link.name} redirect issue`);
              issues.push({
                category: 'Navigation',
                severity: 'high',
                description: `${link.name} link redirects to wrong page`,
                location: link.href,
                actual: currentUrl
              });
            }
          } else {
            // Try direct navigation
            await page.goto(`http://localhost:3000${link.href}`);
            await page.waitForLoadState('networkidle');
            
            const directUrl = page.url();
            if (directUrl.includes(link.href)) {
              console.log(`⚠️ ${link.name} - nav link missing but direct access works`);
              issues.push({
                category: 'Navigation',
                severity: 'medium',
                description: `${link.name} navigation link not visible in menu`,
                location: 'Navigation menu'
              });
            } else {
              console.log(`✗ ${link.name} - page not accessible`);
              issues.push({
                category: 'Navigation',
                severity: 'critical',
                description: `${link.name} page not accessible`,
                location: link.href
              });
            }
          }
          
          // Return to dashboard for next test
          await page.goto('http://localhost:3000/dashboard');
        } catch (error) {
          console.log(`✗ ${link.name} - error: ${error.message}`);
          issues.push({
            category: 'Navigation',
            severity: 'high',
            description: `Error testing ${link.name}`,
            location: link.href,
            error: error.message
          });
        }
      }
      
      // 4. SPECIFIC FEATURE TESTING
      console.log('\n4. FEATURE TESTING');
      console.log('------------------');
      
      // Test Templates
      console.log('\nTesting Templates...');
      await page.goto('http://localhost:3000/templates');
      await page.waitForLoadState('networkidle');
      
      const templateElements = {
        cards: await page.locator('[class*="card"], [data-template]').count(),
        generateButtons: await page.locator('button:has-text("Generate")').count(),
        categories: await page.locator('[data-category], .category').count()
      };
      
      console.log('Template page elements:', templateElements);
      
      if (templateElements.cards === 0) {
        issues.push({
          category: 'Templates',
          severity: 'high',
          description: 'No template cards visible',
          location: '/templates'
        });
      }
      
      // Test AI Assistant
      console.log('\nTesting AI Assistant...');
      const aiButton = page.locator('button').filter({ hasText: /ai|chat|assistant/i }).first();
      
      if (await aiButton.isVisible({ timeout: 2000 })) {
        await aiButton.click();
        await page.waitForTimeout(1000);
        
        const chatVisible = await page.locator('[data-chat], [class*="chat"]').isVisible();
        if (chatVisible) {
          console.log('✓ AI Assistant opens');
          await page.screenshot({ path: 'screenshots/ai-assistant.png' });
          
          // Try to close it
          const closeButton = page.locator('button[aria-label*="close"], button:has-text("X")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        } else {
          issues.push({
            category: 'AI Assistant',
            severity: 'high',
            description: 'AI Assistant does not open properly',
            location: 'Global'
          });
        }
      } else {
        issues.push({
          category: 'AI Assistant',
          severity: 'high',
          description: 'AI Assistant button not found',
          location: 'Global'
        });
      }
      
      // 5. SUBSCRIPTION/PAYWALL TESTING
      console.log('\n5. SUBSCRIPTION TESTING');
      console.log('-----------------------');
      
      // Check for upgrade prompts
      const upgradeElements = await page.locator('button:has-text("Upgrade"), a:has-text("Upgrade")').count();
      console.log(`Upgrade buttons found: ${upgradeElements}`);
      
      // Try analytics (premium feature)
      await page.goto('http://localhost:3000/analytics');
      await page.waitForLoadState('networkidle');
      
      const analyticsBlocked = await page.locator('text=/upgrade|premium|pro plan/i').isVisible();
      if (analyticsBlocked) {
        console.log('✓ Analytics properly gated for free tier');
      } else {
        const analyticsContent = await page.locator('[data-analytics], [class*="chart"]').count();
        if (analyticsContent > 0) {
          issues.push({
            category: 'Subscription',
            severity: 'critical',
            description: 'Premium analytics accessible on free tier',
            location: '/analytics'
          });
        }
      }
      
      // 6. RESPONSIVE DESIGN TESTING
      console.log('\n6. RESPONSIVE DESIGN TESTING');
      console.log('----------------------------');
      
      const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ];
      
      for (const viewport of viewports) {
        await page.setViewportSize(viewport);
        await page.goto('http://localhost:3000/dashboard');
        await page.waitForLoadState('networkidle');
        
        const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text("☰")');
        
        if (viewport.name === 'Mobile' && !(await mobileMenuButton.isVisible())) {
          issues.push({
            category: 'Responsive',
            severity: 'high',
            description: 'Mobile menu button not visible on small screens',
            location: 'Header'
          });
        }
        
        await page.screenshot({ path: `screenshots/responsive-${viewport.name.toLowerCase()}.png` });
        console.log(`✓ ${viewport.name} viewport tested`);
      }
      
      // 7. ERROR HANDLING TESTING
      console.log('\n7. ERROR HANDLING TESTING');
      console.log('-------------------------');
      
      // Test 404 page
      await page.goto('http://localhost:3000/nonexistent-page');
      const is404 = await page.locator('text=/404|not found/i').isVisible();
      if (!is404) {
        issues.push({
          category: 'Error Handling',
          severity: 'medium',
          description: 'No proper 404 page',
          location: '/nonexistent-page'
        });
      }
      
      // 8. PERFORMANCE TESTING
      console.log('\n8. PERFORMANCE TESTING');
      console.log('----------------------');
      
      await page.goto('http://localhost:3000/dashboard');
      const performanceMetrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
          totalLoadTime: navigation.loadEventEnd - navigation.fetchStart
        };
      });
      
      console.log('Performance metrics:', performanceMetrics);
      
      if (performanceMetrics.totalLoadTime > 3000) {
        issues.push({
          category: 'Performance',
          severity: 'medium',
          description: `Slow page load: ${performanceMetrics.totalLoadTime}ms`,
          location: '/dashboard'
        });
      }
      
      // 9. ACCESSIBILITY TESTING
      console.log('\n9. ACCESSIBILITY TESTING');
      console.log('------------------------');
      
      // Check for basic accessibility
      const accessibilityChecks = {
        altTexts: await page.locator('img:not([alt])').count(),
        ariaLabels: await page.locator('button:not([aria-label]):not(:has-text(*))').count(),
        headingStructure: await page.locator('h1').count(),
        colorContrast: await page.locator('.text-gray-400, .text-muted-foreground').count()
      };
      
      console.log('Accessibility checks:', accessibilityChecks);
      
      if (accessibilityChecks.altTexts > 0) {
        issues.push({
          category: 'Accessibility',
          severity: 'medium',
          description: `${accessibilityChecks.altTexts} images missing alt text`,
          location: 'Global'
        });
      }
      
      // GENERATE COMPREHENSIVE REPORT
      console.log('\n\n=== COMPREHENSIVE TEST REPORT ===');
      console.log('=================================\n');
      
      console.log(`Total Issues Found: ${issues.length}`);
      console.log(`Tests Passed: ${testResults.passed.length}`);
      console.log(`Tests Failed: ${issues.length}`);
      
      // Group issues by category
      const issuesByCategory = issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nISSUES BY CATEGORY:');
      Object.entries(issuesByCategory).forEach(([category, count]) => {
        console.log(`- ${category}: ${count}`);
      });
      
      // Group issues by severity
      const issuesBySeverity = issues.reduce((acc, issue) => {
        acc[issue.severity] = (acc[issue.severity] || 0) + 1;
        return acc;
      }, {});
      
      console.log('\nISSUES BY SEVERITY:');
      console.log(`- Critical: ${issuesBySeverity.critical || 0}`);
      console.log(`- High: ${issuesBySeverity.high || 0}`);
      console.log(`- Medium: ${issuesBySeverity.medium || 0}`);
      console.log(`- Low: ${issuesBySeverity.low || 0}`);
      
      console.log('\n\nDETAILED ISSUES:');
      console.log('================\n');
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.category}`);
        console.log(`   Description: ${issue.description}`);
        console.log(`   Location: ${issue.location}`);
        if (issue.actual) console.log(`   Actual: ${issue.actual}`);
        if (issue.error) console.log(`   Error: ${issue.error}`);
        console.log('');
      });
      
      // Save full report
      testResults.issues = issues;
      await page.evaluate((report) => {
        console.log('\n\nFULL JSON REPORT:');
        console.log(JSON.stringify(report, null, 2));
      }, testResults);
      
    } catch (error) {
      console.error('\n\nTEST SUITE ERROR:', error);
      await page.screenshot({ path: 'screenshots/test-error.png', fullPage: true });
    }
  });
});