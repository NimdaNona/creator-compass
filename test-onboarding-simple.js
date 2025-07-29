// Simple test of onboarding API
const http = require('http');

const postData = JSON.stringify({
  message: "Hi, I want to start creating content",
  includeKnowledge: true,
  context: {
    type: "onboarding",
    step: "welcome",
    responses: {}
  }
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/ai/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Testing AI Onboarding...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    // Try to parse SSE data
    const lines = chunk.toString().split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.error) {
            console.error('❌ API Error:', parsed.message);
            console.error('Stack:', parsed.stack);
          } else if (parsed.content) {
            process.stdout.write(parsed.content);
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  });
  
  res.on('end', () => {
    console.log('\n\nResponse complete');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();