// Test direct import of db
console.log('Testing db import...\n');

// Test 1: Direct require
try {
  const dbModule = require('./src/lib/db');
  console.log('Direct require:');
  console.log('- dbModule keys:', Object.keys(dbModule));
  console.log('- db exists:', !!dbModule.db);
  console.log('- db.user exists:', dbModule.db ? !!dbModule.db.user : false);
} catch (e) {
  console.error('Direct require failed:', e.message);
}

// Test 2: Check if it's a module loading issue
console.log('\nChecking module system...');
console.log('- __dirname:', __dirname);
console.log('- process.cwd():', process.cwd());

// Test 3: Try importing Prisma directly
try {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  console.log('\nDirect Prisma import:');
  console.log('- PrismaClient exists:', !!PrismaClient);
  console.log('- prisma instance:', !!prisma);
  console.log('- prisma.user exists:', !!prisma.user);
} catch (e) {
  console.error('Direct Prisma import failed:', e.message);
}