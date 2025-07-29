import { test, expect } from '@playwright/test';

test('Debug signin page and authentication', async ({ page }) => {
  console.log('Starting signin debug test...\n');
  
  test.setTimeout(60000);
  
  try {
    // 1. Navigate to signin
    console.log('1. Going to signin page...');
    await page.goto('http://localhost:3000/auth/signin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    
    // 2. Check page structure
    console.log('\n2. Checking page structure...');
    
    // Look for form elements
    const emailInput = await page.locator('input[name="email"]').count();
    const passwordInput = await page.locator('input[name="password"]').count();
    const submitButton = await page.locator('button[type="submit"]').count();
    
    console.log(`Email inputs found: ${emailInput}`);
    console.log(`Password inputs found: ${passwordInput}`);
    console.log(`Submit buttons found: ${submitButton}`);
    
    // Check for any forms
    const forms = await page.locator('form').count();
    console.log(`Forms found: ${forms}`);
    
    // Look for alternative selectors
    const emailAlt = await page.locator('input[type="email"]').count();
    const passwordAlt = await page.locator('input[type="password"]').count();
    const buttonTexts = await page.locator('button').allTextContents();
    
    console.log(`\nAlternative selectors:`);
    console.log(`Email inputs (by type): ${emailAlt}`);
    console.log(`Password inputs (by type): ${passwordAlt}`);
    console.log(`All button texts:`, buttonTexts);
    
    // 3. Try to find the actual selectors
    console.log('\n3. Finding actual form elements...');
    
    // Get all input fields
    const allInputs = await page.locator('input').evaluateAll(inputs => 
      inputs.map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        value: input.value
      }))
    );
    
    console.log('\nAll input fields:', allInputs);
    
    // 4. Try to login with correct selectors
    console.log('\n4. Attempting login...');
    
    // Try email input
    const emailField = page.locator('input[type="email"]').first();
    if (await emailField.isVisible()) {
      await emailField.fill('chasecclifton@yahoo.com');
      console.log('✓ Filled email field');
    } else {
      console.log('✗ Email field not visible');
    }
    
    // Try password input
    const passwordField = page.locator('input[type="password"]').first();
    if (await passwordField.isVisible()) {
      await passwordField.fill('Password123!');
      console.log('✓ Filled password field');
    } else {
      console.log('✗ Password field not visible');
    }
    
    // Find submit button
    const signInButton = page.locator('button').filter({ hasText: /sign in|log in|submit/i }).first();
    if (await signInButton.isVisible()) {
      console.log('✓ Found sign in button, clicking...');
      await signInButton.click();
    } else {
      // Try form submit
      const form = page.locator('form').first();
      if (await form.isVisible()) {
        console.log('✓ Submitting form directly...');
        await form.evaluate(f => f.submit());
      } else {
        console.log('✗ No submit button or form found');
      }
    }
    
    // 5. Wait and check result
    console.log('\n5. Waiting for navigation...');
    
    // Set up navigation promise before clicking
    const navigationPromise = page.waitForNavigation({ timeout: 10000 }).catch(() => null);
    
    await navigationPromise;
    
    const finalUrl = page.url();
    console.log('\nFinal URL:', finalUrl);
    
    // Take screenshot
    await page.screenshot({ path: 'signin-debug.png', fullPage: true });
    
    // Check for error messages
    const errors = await page.locator('.error, [role="alert"], .text-red-500, .text-destructive').allTextContents();
    if (errors.length > 0) {
      console.log('\nError messages:', errors);
    }
    
    // Check console logs
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });
    
  } catch (error) {
    console.error('\nTest error:', error.message);
    await page.screenshot({ path: 'signin-debug-error.png', fullPage: true });
  }
});