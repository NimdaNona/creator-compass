#!/usr/bin/env node
/**
 * Test script for rate limiting
 * Run with: node scripts/test-rate-limits.js
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
    name: 'General API Rate Limit',
    endpoint: '/api/usage',
    method: 'GET',
    expectedLimit: 300, // Free tier
    requestCount: 10,
  },
  {
    name: 'AI API Rate Limit',
    endpoint: '/api/ai/test',
    method: 'GET',
    expectedLimit: 30, // Free tier
    requestCount: 5,
  },
  {
    name: 'Template API Rate Limit',
    endpoint: '/api/templates',
    method: 'GET',
    expectedLimit: 20, // Free tier
    requestCount: 5,
  },
];

// Helper to make HTTP request
function makeRequest(endpoint, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: url.hostname,
      port: url.port || (isHTTPS ? 443 : 80),
      path: endpoint,
      method: method,
      headers: {
        'Content-Type': 'application/json',
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
    req.end();
  });
}

// Run a single test
async function runTest(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   Endpoint: ${test.endpoint}`);
  console.log(`   Method: ${test.method}`);
  console.log(`   Expected Limit: ${test.expectedLimit}`);
  console.log(`   Request Count: ${test.requestCount}`);
  
  const results = [];
  
  for (let i = 0; i < test.requestCount; i++) {
    try {
      const response = await makeRequest(test.endpoint, test.method);
      
      const rateLimitHeaders = {
        limit: response.headers['x-ratelimit-limit'],
        remaining: response.headers['x-ratelimit-remaining'],
        reset: response.headers['x-ratelimit-reset'],
        retryAfter: response.headers['retry-after']
      };
      
      results.push({
        request: i + 1,
        status: response.status,
        rateLimitHeaders,
        isRateLimited: response.status === 429
      });
      
      console.log(`   Request ${i + 1}: ${response.status} - Remaining: ${rateLimitHeaders.remaining || 'N/A'}`);
      
      // If rate limited, show retry after
      if (response.status === 429) {
        console.log(`   ⚠️  Rate limited! Retry after: ${rateLimitHeaders.retryAfter}s`);
        break;
      }
      
    } catch (error) {
      console.error(`   ❌ Request ${i + 1} failed:`, error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Verify headers
  const firstResult = results[0];
  if (firstResult && firstResult.rateLimitHeaders.limit) {
    const limit = parseInt(firstResult.rateLimitHeaders.limit);
    console.log(`\n   ✅ Rate limit headers present`);
    console.log(`   📊 Limit: ${limit} (Expected: ${test.expectedLimit})`);
    
    if (limit !== test.expectedLimit) {
      console.log(`   ⚠️  Warning: Limit doesn't match expected value`);
    }
  } else {
    console.log(`\n   ❌ Rate limit headers missing!`);
  }
  
  return results;
}

// Main test runner
async function main() {
  console.log('🚀 Rate Limiting Test Suite');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('================================\n');
  
  const allResults = {};
  
  for (const test of TESTS) {
    try {
      const results = await runTest(test);
      allResults[test.name] = results;
    } catch (error) {
      console.error(`\n❌ Test failed: ${test.name}`, error);
    }
  }
  
  // Summary
  console.log('\n\n📊 Test Summary');
  console.log('================================');
  
  for (const [testName, results] of Object.entries(allResults)) {
    const rateLimited = results.some(r => r.isRateLimited);
    const hasHeaders = results.some(r => r.rateLimitHeaders.limit);
    
    console.log(`\n${testName}:`);
    console.log(`   Headers Present: ${hasHeaders ? '✅' : '❌'}`);
    console.log(`   Rate Limited: ${rateLimited ? '✅ (as expected for heavy testing)' : '✅ (within limits)'}`);
  }
  
  console.log('\n✅ Rate limiting test complete!');
}

// Run tests
main().catch(console.error);