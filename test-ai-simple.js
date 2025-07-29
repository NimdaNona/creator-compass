// Simple test for AI endpoints
const fetch = require('node-fetch');

async function testAI() {
  console.log('=== Testing AI Endpoints (Simple) ===\n');
  
  const baseUrl = 'http://localhost:3001';
  
  // 1. Test AI Chat with onboarding context (no auth required)
  console.log('1. Testing AI Chat (Onboarding Mode)...');
  
  try {
    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, I want to start creating content on YouTube',
        includeKnowledge: true,
        context: {
          type: 'onboarding',
          step: 'welcome',
          responses: {}
        }
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Error:', error);
      return;
    }
    
    // Handle streaming response
    const reader = response.body;
    const decoder = new TextDecoder();
    let fullResponse = '';
    let chunks = 0;
    
    console.log('\nStreaming response:');
    console.log('-------------------');
    
    for await (const chunk of reader) {
      const text = decoder.decode(chunk, { stream: true });
      fullResponse += text;
      chunks++;
      
      // Parse SSE data
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              process.stdout.write(data.content);
            }
            if (data.done) {
              console.log('\n\n✅ Stream completed');
              console.log(`Total chunks received: ${chunks}`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

testAI().catch(console.error);