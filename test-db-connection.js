// Test database connection
require('dotenv').config({ path: '.env.local' });

async function testDB() {
  console.log('=== Testing Database Connection ===\n');
  
  try {
    // Import the db module
    const { db } = require('./src/lib/db');
    
    console.log('1. Database object exists:', !!db);
    console.log('2. db.user exists:', !!db.user);
    console.log('3. db.user.findUnique exists:', typeof db.user?.findUnique);
    
    // Try a simple query
    console.log('\n4. Testing simple query...');
    const userCount = await db.user.count();
    console.log('✅ User count:', userCount);
    
    // Test finding a user by email
    console.log('\n5. Testing findUnique...');
    const user = await db.user.findUnique({
      where: { email: 'chasecclifton@yahoo.com' }
    });
    console.log('✅ User found:', !!user, user?.email);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  console.log('\n=== Test Complete ===');
  process.exit(0);
}

testDB();