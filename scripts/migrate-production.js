#!/usr/bin/env node
/**
 * Production database migration script
 * This script will be run after deployment to set up the production database
 */

const { execSync } = require('child_process');

async function main() {
  console.log('🚀 Starting production database migration...');
  
  try {
    // Generate Prisma client
    console.log('📦 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    // Push schema to database
    console.log('🔄 Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    
    // Run seed script
    console.log('🌱 Seeding database...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    
    console.log('✅ Production database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

main();