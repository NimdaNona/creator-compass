// Test AI chat endpoint with onboarding context
const fetch = require('node-fetch');

async function testAIOnboarding() {
  console.log('=== Testing AI Onboarding Chat ===\n');
  
  try {
    // Test onboarding AI chat (no auth required)
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, I want to start creating content',
        includeKnowledge: true,
        context: {
          type: 'onboarding',
          step: 'welcome',
          responses: {}
        }
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    if (!response.ok) {
      const error = await response.text();
      console.error('Error response:', error);
      return;
    }

    // Handle streaming response
    const reader = response.body;
    const decoder = new TextDecoder();
    let buffer = '';

    console.log('\nStreaming response:');
    console.log('-------------------');

    reader.on('data', (chunk) => {
      buffer += decoder.decode(chunk, { stream: true });
      
      // Process complete SSE messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              process.stdout.write(data.content);
            } else if (data.done) {
              console.log('\n\n✅ Response complete!');
              console.log('Conversation ID:', data.conversationId);
            } else if (data.error) {
              console.error('\n❌ Error:', data.message);
            }
          } catch (e) {
            // Ignore parse errors for empty messages
          }
        }
      }
    });

    reader.on('end', () => {
      console.log('\n-------------------');
      console.log('Stream ended');
    });

    reader.on('error', (err) => {
      console.error('Stream error:', err);
    });

  } catch (error) {
    console.error('❌ Request error:', error.message);
  }
}

testAIOnboarding();