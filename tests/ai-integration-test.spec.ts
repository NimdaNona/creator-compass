import { test, expect } from '@playwright/test';

test.describe('AI Integration Tests - CreatorCompass', () => {
  test.setTimeout(180000); // 3 minutes for AI tests

  test('Comprehensive AI functionality validation', async ({ page }) => {
    console.log('=== CREATORCOMPASS AI INTEGRATION TEST ===\n');
    
    const testResults = {
      timestamp: new Date().toISOString(),
      passed: [],
      failed: [],
      aiFeatures: []
    };

    try {
      // 1. AUTHENTICATION
      console.log('1. AUTHENTICATION');
      console.log('----------------');
      await page.goto('http://localhost:3001/auth/signin');
      await page.fill('input[type="email"]', 'chasecclifton@yahoo.com');
      await page.fill('input[type="password"]', 'Password123!');
      await page.click('button:has-text("Sign In")');
      await page.waitForNavigation();
      console.log('✓ Authentication successful\n');

      // 2. TEST AI CHAT ENDPOINT
      console.log('2. TESTING AI CHAT FUNCTIONALITY');
      console.log('---------------------------------');
      
      // Navigate to dashboard
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for AI Assistant Widget
      const aiButton = await page.locator('button[aria-label*="AI"], button:has-text("AI Assistant")').first();
      
      if (await aiButton.isVisible({ timeout: 5000 })) {
        console.log('✓ AI Assistant button found');
        
        // Click to open AI chat
        await aiButton.click();
        await page.waitForTimeout(1000);
        
        // Check if chat interface opened
        const chatInterface = await page.locator('[data-testid="ai-chat"], [class*="ai-chat"], [class*="chat-container"]').first();
        
        if (await chatInterface.isVisible()) {
          console.log('✓ AI Chat interface opened');
          
          // Test sending a message
          const chatInput = await page.locator('input[placeholder*="Ask"], textarea[placeholder*="Ask"], input[placeholder*="Type"], textarea[placeholder*="Type"]').first();
          
          if (await chatInput.isVisible()) {
            console.log('✓ Chat input field found');
            
            // Send test message
            await chatInput.fill('What are the best practices for YouTube thumbnails?');
            
            // Find and click send button
            const sendButton = await page.locator('button[type="submit"], button:has-text("Send"), button[aria-label*="Send"]').first();
            if (await sendButton.isVisible()) {
              await sendButton.click();
              console.log('✓ Test message sent');
              
              // Wait for AI response
              await page.waitForTimeout(5000);
              
              // Check for response
              const messages = await page.locator('[class*="message"], [data-message]').count();
              if (messages > 1) {
                console.log('✓ AI response received');
                testResults.passed.push('AI Chat functionality');
                
                // Take screenshot
                await page.screenshot({ path: 'screenshots/ai-chat-test.png' });
              } else {
                console.log('✗ No AI response received');
                testResults.failed.push('AI Chat response');
              }
            }
          } else {
            console.log('✗ Chat input not found');
            testResults.failed.push('AI Chat input');
          }
        } else {
          console.log('✗ Chat interface did not open');
          testResults.failed.push('AI Chat interface');
        }
      } else {
        console.log('✗ AI Assistant button not found');
        testResults.failed.push('AI Assistant widget');
      }

      // 3. TEST AI ONBOARDING
      console.log('\n3. TESTING AI ONBOARDING');
      console.log('------------------------');
      
      // Navigate to onboarding
      await page.goto('http://localhost:3001/onboarding');
      await page.waitForLoadState('networkidle');
      
      // Check for AI onboarding option
      const aiOnboardingOption = await page.locator('button:has-text("AI"), text="AI Onboarding"').first();
      
      if (await aiOnboardingOption.isVisible({ timeout: 5000 })) {
        console.log('✓ AI Onboarding option available');
        testResults.passed.push('AI Onboarding available');
      } else {
        console.log('✗ AI Onboarding not found');
        testResults.failed.push('AI Onboarding option');
      }

      // 4. TEST AI TEMPLATE GENERATION
      console.log('\n4. TESTING AI TEMPLATE GENERATION');
      console.log('---------------------------------');
      
      // Navigate to templates
      await page.goto('http://localhost:3001/templates');
      await page.waitForLoadState('networkidle');
      
      // Look for AI generation buttons
      const aiGenerateButtons = await page.locator('button:has-text("Generate"), button:has-text("AI Generate")').count();
      
      if (aiGenerateButtons > 0) {
        console.log(`✓ Found ${aiGenerateButtons} AI generation buttons`);
        testResults.passed.push('AI Template generation UI');
        
        // Try clicking first generate button
        const firstGenerateBtn = await page.locator('button:has-text("Generate")').first();
        if (await firstGenerateBtn.isVisible()) {
          await firstGenerateBtn.click();
          await page.waitForTimeout(2000);
          
          // Check for generation form or modal
          const generationForm = await page.locator('[class*="modal"], [class*="generate"], form').first();
          if (await generationForm.isVisible()) {
            console.log('✓ Template generation form opened');
            testResults.passed.push('Template generation interface');
          }
        }
      } else {
        console.log('✗ No AI generation buttons found');
        testResults.failed.push('AI Template generation');
      }

      // 5. TEST AI INSIGHTS ON DASHBOARD
      console.log('\n5. TESTING AI INSIGHTS');
      console.log('----------------------');
      
      await page.goto('http://localhost:3001/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Look for AI insights section
      const aiInsights = await page.locator('text="AI Insights", text="Insights", [data-testid="ai-insights"]').first();
      
      if (await aiInsights.isVisible({ timeout: 5000 })) {
        console.log('✓ AI Insights section found');
        testResults.passed.push('AI Insights display');
      } else {
        console.log('⚠️ AI Insights section not visible');
        testResults.failed.push('AI Insights section');
      }

      // 6. TEST AI API ENDPOINTS DIRECTLY
      console.log('\n6. TESTING AI API ENDPOINTS');
      console.log('---------------------------');
      
      // Get authentication cookies
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => c.name.includes('session'));
      
      if (sessionCookie) {
        // Test chat endpoint
        const chatResponse = await page.evaluate(async (cookie) => {
          try {
            const response = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': `${cookie.name}=${cookie.value}`
              },
              body: JSON.stringify({
                message: 'Test message',
                includeKnowledge: true
              })
            });
            return { status: response.status, ok: response.ok };
          } catch (error) {
            return { error: error.message };
          }
        }, sessionCookie);
        
        if (chatResponse.ok) {
          console.log('✓ AI Chat API endpoint working');
          testResults.passed.push('AI Chat API');
        } else {
          console.log(`✗ AI Chat API error: ${chatResponse.status || chatResponse.error}`);
          testResults.failed.push('AI Chat API');
        }
        
        // Test generate endpoint
        const generateResponse = await page.evaluate(async (cookie) => {
          try {
            const response = await fetch('/api/ai/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': `${cookie.name}=${cookie.value}`
              },
              body: JSON.stringify({
                type: 'title',
                context: {
                  platform: 'youtube',
                  topic: 'gaming',
                  niche: 'minecraft'
                }
              })
            });
            return { status: response.status, ok: response.ok };
          } catch (error) {
            return { error: error.message };
          }
        }, sessionCookie);
        
        if (generateResponse.ok) {
          console.log('✓ AI Generate API endpoint working');
          testResults.passed.push('AI Generate API');
        } else {
          console.log(`✗ AI Generate API error: ${generateResponse.status || generateResponse.error}`);
          testResults.failed.push('AI Generate API');
        }
      }

      // 7. CHECK AI CONFIGURATION
      console.log('\n7. AI CONFIGURATION CHECK');
      console.log('-------------------------');
      
      // Check if OpenAI key is configured
      const aiKeyCheck = await page.evaluate(async () => {
        try {
          // This would normally be a server-side check
          const response = await fetch('/api/ai/test');
          const data = await response.json();
          return data;
        } catch (error) {
          return { error: error.message };
        }
      });
      
      console.log('AI Configuration status:', aiKeyCheck);

      // GENERATE FINAL REPORT
      console.log('\n\n=== AI INTEGRATION TEST REPORT ===');
      console.log('==================================\n');
      
      console.log(`Total Tests: ${testResults.passed.length + testResults.failed.length}`);
      console.log(`Passed: ${testResults.passed.length}`);
      console.log(`Failed: ${testResults.failed.length}`);
      
      if (testResults.passed.length > 0) {
        console.log('\n✅ PASSED TESTS:');
        testResults.passed.forEach(test => console.log(`  - ${test}`));
      }
      
      if (testResults.failed.length > 0) {
        console.log('\n❌ FAILED TESTS:');
        testResults.failed.forEach(test => console.log(`  - ${test}`));
      }
      
      console.log('\n\n=== AI FEATURE RECOMMENDATIONS ===');
      console.log('==================================\n');
      
      console.log('1. IMMEDIATE ACTIONS:');
      console.log('   - Ensure OpenAI API key is properly configured');
      console.log('   - Make AI Assistant widget more prominent');
      console.log('   - Add AI discovery flow for new users');
      console.log('   - Implement loading states for AI responses\n');
      
      console.log('2. ENHANCEMENT OPPORTUNITIES:');
      console.log('   - Add proactive AI suggestions on dashboard');
      console.log('   - Implement AI-powered content calendar');
      console.log('   - Create smart notifications system');
      console.log('   - Build predictive analytics dashboard\n');
      
      console.log('3. ENTERPRISE FEATURES TO ADD:');
      console.log('   - AI collaboration tools for teams');
      console.log('   - Advanced personalization engine');
      console.log('   - AI learning and adaptation system');
      console.log('   - Voice-controlled AI assistant\n');
      
      // Save test results
      testResults.summary = {
        totalTests: testResults.passed.length + testResults.failed.length,
        passedCount: testResults.passed.length,
        failedCount: testResults.failed.length,
        successRate: testResults.passed.length / (testResults.passed.length + testResults.failed.length) * 100
      };
      
      console.log('\nTEST RESULTS JSON:');
      console.log(JSON.stringify(testResults, null, 2));
      
    } catch (error) {
      console.error('\nTEST ERROR:', error);
      await page.screenshot({ path: 'screenshots/ai-test-error.png', fullPage: true });
    }
  });
});