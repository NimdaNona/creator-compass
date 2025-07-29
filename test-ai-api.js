const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testOpenAI() {
  console.log('=== Testing OpenAI Integration ===\n');
  
  // 1. Check if API key exists
  console.log('1. Checking OpenAI API Key...');
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not found in environment variables');
    return;
  }
  
  console.log('✅ OpenAI API key found:', apiKey.substring(0, 10) + '...');
  
  // 2. Test direct OpenAI connection
  console.log('\n2. Testing OpenAI API Connection...');
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello from CreatorCompass!"' }
        ],
        max_tokens: 50
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.log('❌ OpenAI API Error:', response.status, error);
      return;
    }
    
    const data = await response.json();
    console.log('✅ OpenAI API Response:', data.choices[0].message.content);
    
  } catch (error) {
    console.log('❌ Connection Error:', error.message);
  }
  
  // 3. Check Vercel KV (Redis) configuration
  console.log('\n3. Checking Vercel KV Configuration...');
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  if (!kvUrl || !kvToken) {
    console.log('⚠️  Vercel KV not configured (optional for rate limiting)');
  } else {
    console.log('✅ Vercel KV configured');
  }
  
  console.log('\n=== Test Complete ===');
}

testOpenAI().catch(console.error);