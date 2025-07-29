// Simple test to check API behavior
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

console.log('Testing API...\n');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  // Collect all data first
  let chunks = [];
  res.on('data', (chunk) => {
    chunks.push(chunk);
  });
  
  res.on('end', () => {
    const fullData = Buffer.concat(chunks).toString();
    console.log('\nFull response:');
    console.log(fullData);
    
    // Check for specific error patterns
    if (fullData.includes('findUnique')) {
      console.log('\n❌ Found findUnique error');
      
      // Try to extract more context
      const lines = fullData.split('\n');
      lines.forEach(line => {
        if (line.includes('error') || line.includes('Error')) {
          console.log('Error line:', line);
        }
      });
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();