import { test, expect } from '@playwright/test';

test('Identify key issues in CreatorCompass', async ({ page }) => {
  test.setTimeout(120000);
  
  const issues = [];
  
  console.log('=== CREATORCOMPASS KEY ISSUES TEST ===\n');
  
  // 1. Authentication
  console.log('1. Testing Authentication...');
  await page.goto('http://localhost:3000/auth/signin');
  await page.fill('input[type="email"]', 'chasecclifton@yahoo.com');
  await page.fill('input[type="password"]', 'Password123!');
  await page.click('button:has-text("Sign In")');
  await page.waitForNavigation();
  
  if (page.url().includes('/dashboard')) {
    console.log('✓ Authentication works\n');
  }
  
  // 2. Dashboard Check
  console.log('2. Testing Dashboard...');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: 'dashboard-test.png' });
  
  const dashboardIssues = [];
  
  // Check key elements
  const checks = {
    tabs: await page.locator('[role="tab"]').count(),
    welcomeText: await page.locator('h1').textContent(),
    badges: await page.locator('.badge').count()
  };
  
  console.log('Dashboard state:', checks);
  
  if (checks.tabs < 3) {
    issues.push({
      severity: 'HIGH',
      category: 'Dashboard',
      description: 'Missing dashboard tabs',
      impact: 'Users cannot navigate between dashboard views'
    });
  }
  
  // 3. Navigation Quick Test
  console.log('\n3. Testing Navigation...');
  const navTests = [
    { name: 'Templates', href: '/templates' },
    { name: 'Analytics', href: '/analytics' },
    { name: 'Resources', href: '/resources' }
  ];
  
  for (const nav of navTests) {
    try {
      await page.goto(`http://localhost:3000${nav.href}`);
      await page.waitForLoadState('networkidle');
      const finalUrl = page.url();
      
      if (finalUrl.includes(nav.href)) {
        console.log(`✓ ${nav.name} accessible`);
      } else {
        console.log(`✗ ${nav.name} redirects to: ${finalUrl}`);
        issues.push({
          severity: 'MEDIUM',
          category: 'Navigation',
          description: `${nav.name} page redirect issue`,
          impact: 'Page not accessible or redirects unexpectedly'
        });
      }
    } catch (error) {
      issues.push({
        severity: 'HIGH',
        category: 'Navigation',
        description: `${nav.name} page error: ${error.message}`,
        impact: 'Page crashes or fails to load'
      });
    }
  }
  
  // 4. AI Features
  console.log('\n4. Testing AI Features...');
  await page.goto('http://localhost:3000/dashboard');
  
  const aiButton = await page.locator('button').filter({ hasText: /ai|chat/i }).first();
  if (await aiButton.isVisible({ timeout: 2000 })) {
    console.log('✓ AI Assistant button found');
  } else {
    issues.push({
      severity: 'MEDIUM',
      category: 'AI Features',
      description: 'AI Assistant not visible on dashboard',
      impact: 'Users cannot access AI features'
    });
  }
  
  // 5. Mobile Responsiveness
  console.log('\n5. Testing Mobile View...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000/dashboard');
  
  const mobileMenu = await page.locator('button[aria-label*="menu"]').isVisible();
  if (!mobileMenu) {
    issues.push({
      severity: 'HIGH',
      category: 'Responsive Design',
      description: 'Mobile menu not visible on small screens',
      impact: 'Mobile users cannot navigate the app'
    });
  }
  
  // 6. Key Missing Features Based on Code
  console.log('\n6. Checking for Known Issues...');
  
  // OpenAI API Key Issue (from previous findings)
  issues.push({
    severity: 'CRITICAL',
    category: 'Configuration',
    description: 'OpenAI API key not configured',
    impact: 'AI features non-functional without API key',
    solution: 'Add OPENAI_API_KEY to environment variables'
  });
  
  // Database Import Issues (from previous findings)
  issues.push({
    severity: 'HIGH',
    category: 'Code Quality',
    description: 'Multiple files using incorrect database imports (prisma vs db)',
    impact: 'Runtime errors when accessing certain features',
    solution: 'Already fixed in multiple files'
  });
  
  // GENERATE FINAL REPORT
  console.log('\n\n=== ISSUE SUMMARY REPORT ===');
  console.log('============================\n');
  
  console.log(`Total Issues Found: ${issues.length}\n`);
  
  // Group by severity
  const critical = issues.filter(i => i.severity === 'CRITICAL');
  const high = issues.filter(i => i.severity === 'HIGH');
  const medium = issues.filter(i => i.severity === 'MEDIUM');
  
  console.log('BY SEVERITY:');
  console.log(`- CRITICAL: ${critical.length}`);
  console.log(`- HIGH: ${high.length}`);
  console.log(`- MEDIUM: ${medium.length}`);
  
  console.log('\n\nDETAILED ISSUES:');
  console.log('================\n');
  
  // Critical Issues First
  if (critical.length > 0) {
    console.log('CRITICAL ISSUES (Must Fix):');
    console.log('---------------------------');
    critical.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.description}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Impact: ${issue.impact}`);
      if (issue.solution) console.log(`   Solution: ${issue.solution}`);
    });
  }
  
  // High Priority Issues
  if (high.length > 0) {
    console.log('\n\nHIGH PRIORITY ISSUES:');
    console.log('---------------------');
    high.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.description}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Impact: ${issue.impact}`);
      if (issue.solution) console.log(`   Solution: ${issue.solution}`);
    });
  }
  
  // Medium Priority Issues
  if (medium.length > 0) {
    console.log('\n\nMEDIUM PRIORITY ISSUES:');
    console.log('-----------------------');
    medium.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.description}`);
      console.log(`   Category: ${issue.category}`);
      console.log(`   Impact: ${issue.impact}`);
      if (issue.solution) console.log(`   Solution: ${issue.solution}`);
    });
  }
  
  // Action Plan
  console.log('\n\n=== RECOMMENDED ACTION PLAN ===');
  console.log('===============================\n');
  
  console.log('1. IMMEDIATE ACTIONS (Critical):');
  console.log('   - Configure OpenAI API key in environment variables');
  console.log('   - Deploy to Vercel with proper environment configuration\n');
  
  console.log('2. HIGH PRIORITY FIXES:');
  console.log('   - Fix mobile navigation menu');
  console.log('   - Ensure all navigation links work properly');
  console.log('   - Complete database import fixes (mostly done)\n');
  
  console.log('3. MEDIUM PRIORITY IMPROVEMENTS:');
  console.log('   - Add loading states for better UX');
  console.log('   - Improve error handling and user feedback');
  console.log('   - Enhance mobile responsiveness\n');
  
  console.log('4. TESTING RECOMMENDATIONS:');
  console.log('   - Set up proper E2E test suite with Playwright');
  console.log('   - Add unit tests for critical business logic');
  console.log('   - Implement error monitoring (Sentry/similar)\n');
  
  // Save JSON report
  const report = {
    timestamp: new Date().toISOString(),
    totalIssues: issues.length,
    breakdown: {
      critical: critical.length,
      high: high.length,
      medium: medium.length
    },
    issues: issues
  };
  
  console.log('\n\nJSON REPORT:');
  console.log(JSON.stringify(report, null, 2));
});