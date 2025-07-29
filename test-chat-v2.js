const fetch = require('node-fetch');

async function testChatV2() {
  console.log('Testing AI Chat v2 endpoint with dynamic imports...\n');

  const response = await fetch('http://localhost:3000/api/ai/chat-v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: "Hello, I want to become a content creator",
      context: {
        type: 'onboarding',
        step: 'welcome',
        responses: {}
      }
    })
  });

  if (!response.ok) {
    console.error('Error:', response.status, response.statusText);
    const text = await response.text();
    console.error('Response:', text);
    return;
  }

  console.log('Response status:', response.status);
  console.log('Headers:', response.headers.raw());
  
  const reader = response.body;
  const decoder = new TextDecoder();
  
  let buffer = '';
  
  for await (const chunk of reader) {
    const text = decoder.decode(chunk, { stream: true });
    buffer += text;
    
    // Process complete SSE messages
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // Keep incomplete line in buffer
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data.trim()) {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              process.stdout.write(parsed.content);
            } else if (parsed.error) {
              console.error('\n\nError:', parsed.error);
              if (parsed.details) {
                console.error('Details:', parsed.details);
              }
            } else if (parsed.done) {
              console.log('\n\n✅ Stream completed');
            } else if (parsed.conversationId) {
              console.log('Conversation ID:', parsed.conversationId);
            }
          } catch (e) {
            console.error('\n\nFailed to parse:', data);
          }
        }
      }
    }
  }
}

testChatV2().catch(console.error);