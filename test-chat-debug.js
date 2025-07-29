// Direct test of chat API debugging
const http = require('http');

const postData = JSON.stringify({
  message: "Test message",
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

console.log('Testing AI Chat Debug...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let rawData = '';
  res.on('data', (chunk) => {
    rawData += chunk.toString();
  });
  
  res.on('end', () => {
    console.log('\nRaw response:');
    console.log(rawData);
    
    // Parse SSE events
    const lines = rawData.split('\n');
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          console.log('\nParsed event:', data);
        } catch (e) {
          // Ignore parse errors
        }
      }
    });
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();