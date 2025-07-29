// Test to check available Prisma models
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkModels() {
  console.log('Checking Prisma models...');
  
  // Get all model names
  const modelNames = Object.keys(prisma).filter(key => 
    !key.startsWith('_') && 
    !['$connect', '$disconnect', '$on', '$transaction', '$queryRaw', '$executeRaw', '$extends', '$use'].includes(key)
  );
  
  console.log('Available models:', modelNames.length);
  console.log('Models:', modelNames.sort().join(', '));
  
  // Check for conversation-related models
  const conversationModels = modelNames.filter(name => 
    name.toLowerCase().includes('conversation')
  );
  
  console.log('\nConversation-related models:', conversationModels);
  
  // Check specific model
  console.log('\nChecking AIConversation model:');
  console.log('- prisma.aIConversation exists:', 'aIConversation' in prisma);
  console.log('- prisma.aiConversation exists:', 'aiConversation' in prisma);
  console.log('- prisma.AIConversation exists:', 'AIConversation' in prisma);
  
  await prisma.$disconnect();
}

checkModels().catch(console.error);