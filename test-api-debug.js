// Test to capture full error information
const http = require('http');

const postData = JSON.stringify({
  message: "Hi",
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

console.log('Testing API with debug info...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let fullData = '';
  res.on('data', (chunk) => {
    fullData += chunk.toString();
  });
  
  res.on('end', () => {
    console.log('\nRaw response:');
    console.log(fullData);
    
    // Parse SSE events
    const lines = fullData.split('\n');
    lines.forEach(line => {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.error) {
            console.log('\n❌ Error details:');
            console.log('  Message:', data.message);
            console.log('  Type:', data.errorType);
            console.log('  Stack:', data.errorStack);
          }
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