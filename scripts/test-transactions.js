#!/usr/bin/env node

/**
 * Script to test database transaction rollbacks
 * Run with: node scripts/test-transactions.js
 */

// Set up TypeScript compilation for imports
require('ts-node/register');
require('tsconfig-paths/register');

// Import and run the tests
const { runTransactionTests } = require('../src/test/transaction-rollback.test.ts');

console.log('Starting transaction rollback tests...\n');

runTransactionTests()
  .then(() => {
    console.log('\nTests completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed with error:', error);
    process.exit(1);
  });