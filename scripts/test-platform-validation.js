#!/usr/bin/env node
/**
 * Test script for platform validation
 * Run with: node scripts/test-platform-validation.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const isHTTPS = BASE_URL.startsWith('https');
const httpModule = isHTTPS ? https : http;

// Parse URL
const url = new URL(BASE_URL);

// Test configuration
const TESTS = [
  {
    name: 'Free tier platform switch attempt via profile API',
    endpoint: '/api/user/profile',
    method: 'PUT',
    body: {
      selectedPlatform: 'tiktok' // Attempting to switch from youtube to tiktok
    },
    expectedStatus: 403,
    description: 'Should deny platform switch for free tier users'
  },
  {
    name: 'Free tier platform switch attempt via calendar API',
    endpoint: '/api/calendar/events/test-event-id',
    method: 'PATCH',
    body: {
      platform: 'twitch' // Attempting to change event platform
    },
    expectedStatus: 403,
    description: 'Should deny platform change in calendar events for free tier'
  },
  {
    name: 'Same platform update (should be allowed)',
    endpoint: '/api/user/profile',
    method: 'PUT',
    body: {
      selectedPlatform: 'youtube', // Same as current
      selectedNiche: 'gaming'
    },
    expectedStatus: 200,
    description: 'Should allow updating profile with same platform'
  }
];

// Helper to make HTTP request
function makeRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHTTPS ? 443 : 80),
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        // Add mock session cookie for testing (adjust as needed)
        'Cookie': 'next-auth.session-token=test-session'
      }
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data ? JSON.parse(data) : null
        });
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Run a single test
async function runTest(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   Description: ${test.description}`);
  console.log(`   Endpoint: ${test.endpoint}`);
  console.log(`   Method: ${test.method}`);
  console.log(`   Expected Status: ${test.expectedStatus}`);
  
  try {
    const response = await makeRequest(test.endpoint, test.method, test.body);
    
    console.log(`   Actual Status: ${response.status}`);
    
    if (response.status === test.expectedStatus) {
      console.log(`   ✅ Test PASSED`);
      
      // For 403 responses, check for upgrade messaging
      if (response.status === 403 && response.data) {
        console.log(`   📝 Error: ${response.data.error}`);
        console.log(`   💎 Requires Upgrade: ${response.data.requiresUpgrade}`);
        if (response.data.currentPlatform) {
          console.log(`   🎯 Current Platform: ${response.data.currentPlatform}`);
        }
      }
    } else {
      console.log(`   ❌ Test FAILED - Expected ${test.expectedStatus}, got ${response.status}`);
      if (response.data) {
        console.log(`   📝 Response:`, JSON.stringify(response.data, null, 2));
      }
    }
    
    return {
      name: test.name,
      passed: response.status === test.expectedStatus,
      response
    };
    
  } catch (error) {
    console.error(`   ❌ Test failed with error:`, error.message);
    return {
      name: test.name,
      passed: false,
      error: error.message
    };
  }
}

// Main test runner
async function main() {
  console.log('🚀 Platform Validation Test Suite');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('================================\n');
  
  const results = [];
  
  for (const test of TESTS) {
    const result = await runTest(test);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Summary
  console.log('\n\n📊 Test Summary');
  console.log('================================');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}`);
    });
  }
  
  console.log('\n✅ Platform validation test complete!');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
main().catch(console.error);