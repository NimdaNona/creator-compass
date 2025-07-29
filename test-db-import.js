// Test database import directly
console.log('Testing database import...\n');

const path = require('path');
const fs = require('fs');

// Add project root to module paths
const projectRoot = path.resolve(__dirname);
require('module').Module._nodeModulePaths = function(from) {
  const paths = [
    path.join(projectRoot, 'node_modules'),
    path.join(projectRoot, '.next/server/vendor-chunks/node_modules'),
  ];
  return paths;
};

// Set up module aliases
require('module-alias/register');
const moduleAlias = require('module-alias');
moduleAlias.addAlias('@', projectRoot + '/src');

async function testDbImport() {
  try {
    console.log('1. Testing direct import...');
    
    // Import db module
    const dbModule = await import('./src/lib/db.js');
    console.log('   - db module imported successfully');
    console.log('   - Module keys:', Object.keys(dbModule));
    
    // Check if db exists
    const { db } = dbModule;
    console.log('   - db exists:', !!db);
    console.log('   - db type:', typeof db);
    
    if (db) {
      // List available models
      const models = Object.keys(db).filter(k => !k.startsWith('_') && !k.startsWith('$'));
      console.log('   - Available models:', models);
      
      // Test user model
      if (db.user) {
        console.log('\n2. Testing user model...');
        try {
          const count = await db.user.count();
          console.log('   ✅ User count:', count);
        } catch (error) {
          console.error('   ❌ Error counting users:', error.message);
        }
      } else {
        console.error('   ❌ user model not found on db object');
      }
    } else {
      console.error('   ❌ db object is undefined');
    }
    
  } catch (error) {
    console.error('❌ Import error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDbImport();