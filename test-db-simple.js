// Simple test of database import
console.log('Testing database import...\n');

async function testDb() {
  try {
    // Try to import the compiled version
    console.log('Current dir:', process.cwd());
    
    // Check if the .next directory exists
    const fs = require('fs');
    const path = require('path');
    
    const nextServerPath = path.join(process.cwd(), '.next/server');
    console.log('Checking .next/server exists:', fs.existsSync(nextServerPath));
    
    // Look for the compiled db module
    const possiblePaths = [
      './.next/server/chunks/src_lib_db_ts.js',
      './.next/server/app/api/ai/chat/route.js',
      './.next/server/chunks/ssr/src_lib_db_8dc5a9._.js',
    ];
    
    for (const p of possiblePaths) {
      console.log(`Checking ${p}:`, fs.existsSync(p));
    }
    
    // Try to find the db module in chunks directory
    if (fs.existsSync('./.next/server/chunks')) {
      const chunks = fs.readdirSync('./.next/server/chunks');
      console.log('\nChunks found:', chunks.filter(f => f.includes('db')).slice(0, 5));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDb();