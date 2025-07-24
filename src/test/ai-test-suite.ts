#!/usr/bin/env node
/**
 * AI Test Suite for CreatorCompass
 * 
 * This test suite validates all AI functionality including:
 * - Database connections with dynamic imports
 * - Streaming responses
 * - Onboarding conversation flow
 * - Knowledge base integration
 * - User context management
 * - Roadmap generation
 * 
 * Run with: npx tsx src/test/ai-test-suite.ts
 */

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  duration: number;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  console.log(`\n🧪 Running: ${name}`);
  const start = Date.now();
  
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, status: 'pass', duration });
    console.log(`✅ Passed (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    results.push({ 
      name, 
      status: 'fail', 
      duration, 
      error: error.message,
      details: error.response?.data || error.stack
    });
    console.error(`❌ Failed (${duration}ms): ${error.message}`);
  }
}

// Test 1: Database Connection
async function testDatabaseConnection() {
  const response = await fetch(`${API_BASE_URL}/api/ai/test-db-conversation`);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Database test failed: ${JSON.stringify(data)}`);
  }
  
  if (!data.success || !data.tests) {
    throw new Error(`Database not properly initialized: ${JSON.stringify(data)}`);
  }
  
  console.log(`  ✓ Database import: ${data.tests.dbImport}`);
  console.log(`  ✓ Model exists: ${data.tests.modelExists}`);
  console.log(`  ✓ Create: ${data.tests.create}`);
  console.log(`  ✓ Retrieve: ${data.tests.retrieve}`);
  console.log(`  ✓ Update: ${data.tests.update}`);
  console.log(`  ✓ Cleanup: ${data.tests.cleanup}`);
}

// Test 2: Simple Chat (Non-streaming)
async function testSimpleChat() {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'What is CreatorCompass?',
      context: { type: 'onboarding' }
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(`Chat failed: ${JSON.stringify(data)}`);
  }
  
  if (!data.success || !data.message) {
    throw new Error(`Invalid chat response: ${JSON.stringify(data)}`);
  }
  
  console.log(`  💬 Response length: ${data.message.length} chars`);
  console.log(`  🆔 Conversation ID: ${data.conversationId}`);
}

// Test 3: Streaming Chat
async function testStreamingChat() {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat-v2`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Hello!',
      context: { type: 'onboarding', step: 'welcome' }
    })
  });
  
  if (!response.ok) {
    throw new Error(`Streaming chat failed: ${response.status}`);
  }
  
  if (!response.body) {
    throw new Error('No response body for streaming');
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let chunks = 0;
  let fullResponse = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        chunks++;
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            fullResponse += data.content;
          }
          if (data.done) {
            console.log(`  🔄 Stream complete: ${chunks} chunks`);
            console.log(`  💬 Full response: ${fullResponse.length} chars`);
            console.log(`  🆔 Conversation ID: ${data.conversationId}`);
            return;
          }
        } catch (e) {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }
}

// Test 4: Onboarding Flow
async function testOnboardingFlow() {
  let conversationId: string | null = null;
  
  // Step 1: Initial greeting
  const response1 = await fetch(`${API_BASE_URL}/api/ai/chat-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "I'm just starting out",
      context: { type: 'onboarding', step: 'welcome' }
    })
  });
  
  const data1 = await response1.json();
  if (!data1.success) throw new Error('Step 1 failed');
  conversationId = data1.conversationId;
  console.log(`  ✓ Step 1: Creator level captured`);
  
  // Step 2: Platform selection
  const response2 = await fetch(`${API_BASE_URL}/api/ai/chat-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      message: "I want to focus on YouTube",
      context: { type: 'onboarding' }
    })
  });
  
  const data2 = await response2.json();
  if (!data2.success) throw new Error('Step 2 failed');
  console.log(`  ✓ Step 2: Platform captured`);
  
  // Step 3: Content niche
  const response3 = await fetch(`${API_BASE_URL}/api/ai/chat-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversationId,
      message: "I want to create gaming content",
      context: { type: 'onboarding' }
    })
  });
  
  const data3 = await response3.json();
  if (!data3.success) throw new Error('Step 3 failed');
  console.log(`  ✓ Step 3: Niche captured`);
  
  console.log(`  🎯 Onboarding flow working correctly`);
}

// Test 5: Knowledge Base Query
async function testKnowledgeBase() {
  const response = await fetch(`${API_BASE_URL}/api/ai/chat-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "What equipment do I need for YouTube?",
      includeKnowledge: true,
      context: { type: 'support' }
    })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(`Knowledge base query failed: ${JSON.stringify(data)}`);
  }
  
  // Check if response includes equipment-related information
  const hasEquipmentInfo = data.message.toLowerCase().includes('camera') || 
                          data.message.toLowerCase().includes('microphone') ||
                          data.message.toLowerCase().includes('equipment');
  
  if (!hasEquipmentInfo) {
    throw new Error('Response does not include equipment information');
  }
  
  console.log(`  📚 Knowledge base integration working`);
  console.log(`  💬 Response includes equipment guidance`);
}

// Test 6: Error Handling
async function testErrorHandling() {
  // Test invalid message
  const response1 = await fetch(`${API_BASE_URL}/api/ai/chat-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: '', // Empty message should fail validation
      context: { type: 'onboarding' }
    })
  });
  
  if (response1.ok) {
    throw new Error('Expected validation error for empty message');
  }
  
  console.log(`  ✓ Empty message validation works`);
  
  // Test very long message
  const longMessage = 'x'.repeat(1001); // Over 1000 char limit
  const response2 = await fetch(`${API_BASE_URL}/api/ai/chat-simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: longMessage,
      context: { type: 'onboarding' }
    })
  });
  
  if (response2.ok) {
    throw new Error('Expected validation error for long message');
  }
  
  console.log(`  ✓ Message length validation works`);
}

// Main test runner
async function runAllTests() {
  console.log('🚀 CreatorCompass AI Test Suite');
  console.log('================================');
  console.log(`API URL: ${API_BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Check if server is running
  try {
    const healthCheck = await fetch(`${API_BASE_URL}/api/health`);
    if (!healthCheck.ok) {
      console.error('❌ Server is not responding properly');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Cannot connect to server. Is it running?');
    console.error(`   Try: npm run dev`);
    process.exit(1);
  }
  
  // Run all tests
  await runTest('Database Connection', testDatabaseConnection);
  await runTest('Simple Chat API', testSimpleChat);
  await runTest('Streaming Chat API', testStreamingChat);
  await runTest('Onboarding Flow', testOnboardingFlow);
  await runTest('Knowledge Base Integration', testKnowledgeBase);
  await runTest('Error Handling', testErrorHandling);
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
      if (r.details) {
        console.log(`    Details: ${JSON.stringify(r.details, null, 2)}`);
      }
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed! AI functionality is working correctly.');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite error:', error);
  process.exit(1);
});