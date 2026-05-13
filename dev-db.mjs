// dev-db.mjs — Starts an in-memory MongoDB for local development
// Usage: node dev-db.mjs
// This starts MongoDB on port 27017 and keeps it running until you press Ctrl+C

import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  console.log('🔄 Starting in-memory MongoDB server...');
  
  const mongod = await MongoMemoryServer.create({
    instance: {
      port: 27017,
      dbName: 'neet-engine',
    },
  });

  const uri = mongod.getUri();
  console.log(`✅ MongoDB running at: ${uri}`);
  console.log('📝 Use this in .env.local: MONGODB_URI=' + uri + 'neet-engine');
  console.log('\nPress Ctrl+C to stop the server.\n');

  // Keep process alive
  process.on('SIGINT', async () => {
    console.log('\n🛑 Stopping MongoDB...');
    await mongod.stop();
    process.exit(0);
  });
}

main().catch(console.error);
