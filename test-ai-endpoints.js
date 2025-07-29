// Test AI endpoints directly
const fetch = require('node-fetch');

async function testAIEndpoints() {
  console.log('=== Testing CreatorCompass AI Endpoints ===\n');
  
  const baseUrl = 'http://localhost:3001';
  
  // First, we need to authenticate
  console.log('1. Authenticating...');
  
  try {
    // Get CSRF token
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const { csrfToken } = await csrfResponse.json();
    console.log('✅ Got CSRF token');
    
    // Sign in
    const signInResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        csrfToken,
        email: 'chasecclifton@yahoo.com',
        password: 'Password123!',
        callbackUrl: `${baseUrl}/dashboard`
      }),
      redirect: 'manual'
    });
    
    const cookies = signInResponse.headers.raw()['set-cookie'];
    const sessionCookie = cookies?.find(c => c.includes('next-auth.session-token'));
    
    if (!sessionCookie) {
      console.log('❌ Failed to authenticate');
      return;
    }
    
    console.log('✅ Authentication successful');
    
    // 2. Test AI Chat endpoint
    console.log('\n2. Testing /api/ai/chat endpoint...');
    
    const chatResponse = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        message: 'What are the best practices for YouTube thumbnails?',
        includeKnowledge: true
      })
    });
    
    if (!chatResponse.ok) {
      const error = await chatResponse.text();
      console.log(`❌ Chat API Error (${chatResponse.status}):`, error);
    } else {
      console.log('✅ Chat API returned:', chatResponse.status);
      
      // Read streaming response
      const reader = chatResponse.body;
      const decoder = new TextDecoder();
      let buffer = '';
      
      for await (const chunk of reader) {
        buffer += decoder.decode(chunk, { stream: true });
        if (buffer.includes('data: {"done":true}')) {
          console.log('✅ Streaming response completed');
          break;
        }
      }
    }
    
    // 3. Test AI Generate endpoint
    console.log('\n3. Testing /api/ai/generate endpoint...');
    
    const generateResponse = await fetch(`${baseUrl}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        type: 'title',
        context: {
          platform: 'youtube',
          topic: 'gaming',
          niche: 'minecraft',
          keyword: 'minecraft tutorial',
          emotion: 'excitement',
          maxLength: 60
        }
      })
    });
    
    if (!generateResponse.ok) {
      const error = await generateResponse.text();
      console.log(`❌ Generate API Error (${generateResponse.status}):`, error);
    } else {
      const result = await generateResponse.json();
      console.log('✅ Generate API response:', result);
    }
    
    // 4. Test AI Roadmap endpoint
    console.log('\n4. Testing /api/ai/roadmap endpoint...');
    
    const roadmapResponse = await fetch(`${baseUrl}/api/ai/roadmap`, {
      method: 'GET',
      headers: {
        'Cookie': sessionCookie
      }
    });
    
    if (!roadmapResponse.ok) {
      const error = await roadmapResponse.text();
      console.log(`❌ Roadmap API Error (${roadmapResponse.status}):`, error);
    } else {
      const result = await roadmapResponse.json();
      console.log('✅ Roadmap API response:', result.message || 'Success');
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  console.log('\n=== Test Complete ===');
}

testAIEndpoints().catch(console.error);