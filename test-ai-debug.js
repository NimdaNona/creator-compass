// Debug AI streaming
const fetch = require('node-fetch');

async function debugAI() {
  console.log('=== Debugging AI Streaming ===\n');
  
  const baseUrl = 'http://localhost:3001';
  
  try {
    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        includeKnowledge: false,
        context: {
          type: 'onboarding',
          step: 'welcome',
          responses: {}
        }
      })
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const error = await response.text();
      console.log('Error body:', error);
      return;
    }
    
    // Read the stream completely
    const reader = response.body;
    const decoder = new TextDecoder();
    let fullData = '';
    
    console.log('\nReading stream...');
    
    for await (const chunk of reader) {
      const text = decoder.decode(chunk, { stream: true });
      fullData += text;
      console.log('Chunk received:', text.length, 'bytes');
      console.log('Raw chunk:', JSON.stringify(text));
    }
    
    console.log('\nFull response data:');
    console.log(fullData);
    
    // Parse the SSE events
    console.log('\nParsing SSE events:');
    const lines = fullData.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        console.log('Event:', line);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugAI().catch(console.error);