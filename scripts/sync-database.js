#!/usr/bin/env node

/**
 * Sync database schema across environments
 * This ensures both production and development databases have the same schema
 */

const { execSync } = require('child_process');

async function syncDatabase() {
  console.log('🔄 Starting database synchronization...\n');

  try {
    // First, ensure we're using the correct environment
    const currentEnv = process.env.NODE_ENV || 'development';
    console.log(`📍 Current environment: ${currentEnv}`);

    // Push schema to current database
    console.log('\n📤 Pushing schema to database...');
    execSync('npx prisma db push', { stdio: 'inherit' });

    // Generate Prisma client
    console.log('\n🔧 Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('\n✅ Database synchronization complete!');
    console.log('\n📝 Notes:');
    console.log('- Schema has been pushed to the current database');
    console.log('- Prisma client has been regenerated');
    console.log('- To sync other environments, run this script with different DATABASE_URL');
    
    // Show current models
    console.log('\n📊 Current models in schema:');
    const fs = require('fs');
    const schema = fs.readFileSync('./prisma/schema.prisma', 'utf-8');
    const models = schema.match(/model\s+(\w+)\s*{/g);
    if (models) {
      models.forEach(model => {
        const modelName = model.match(/model\s+(\w+)/)[1];
        console.log(`  - ${modelName}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error syncing database:', error.message);
    process.exit(1);
  }
}

// Check if we have DATABASE_URL
if (!process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL) {
  console.error('❌ No database URL found in environment variables');
  console.error('Please ensure DATABASE_URL or POSTGRES_PRISMA_URL is set');
  process.exit(1);
}

syncDatabase();