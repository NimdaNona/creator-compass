const fs = require('fs');

async function testAIChat() {
  try {
    console.log('Testing AI chat endpoint...');
    
    // Read environment variables
    const envContent = fs.readFileSync('.env.local', 'utf8');
    console.log('\nEnvironment variables related to OpenAI:');
    const lines = envContent.split('\n');
    for (const line of lines) {
      if (line.includes('OPENAI')) {
        const [key] = line.split('=');
        console.log(`- ${key} is ${line.includes('=') && line.split('=')[1] ? 'SET' : 'NOT SET'}`);
      }
    }
    
    // Test OpenAI directly
    console.log('\nTesting OpenAI client initialization...');
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      console.error('ERROR: OPENAI_API_KEY is not available in process.env');
    } else {
      console.log('SUCCESS: OPENAI_API_KEY is available in process.env');
      console.log(`Key starts with: ${openaiKey.substring(0, 7)}...`);
    }
    
    // Import the OpenAI service
    const { getOpenAIClient } = require('./src/lib/ai/openai-service');
    
    try {
      const client = getOpenAIClient();
      console.log('SUCCESS: OpenAI client initialized successfully');
    } catch (error) {
      console.error('ERROR initializing OpenAI client:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

testAIChat();