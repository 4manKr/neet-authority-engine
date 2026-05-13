// dev-with-db.mjs — Starts in-memory MongoDB + Next.js dev server
import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'child_process';

async function main() {
  console.log('🔄 Starting in-memory MongoDB...');
  
  const mongod = await MongoMemoryServer.create({
    instance: {
      dbName: 'neet-engine',
    },
  });

  const uri = mongod.getUri();
  console.log(`✅ MongoDB running at: ${uri}`);

  // Start Next.js dev server with the MongoDB URI
  console.log('🚀 Starting Next.js dev server...\n');
  
  const nextDev = spawn('npx', ['next', 'dev'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      MONGODB_URI: uri + 'neet-engine',
    },
  });

  nextDev.on('exit', async (code) => {
    console.log(`\n🛑 Next.js exited with code ${code}`);
    await mongod.stop();
    process.exit(code || 0);
  });

  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    nextDev.kill('SIGINT');
    await mongod.stop();
    process.exit(0);
  });
}

main().catch(console.error);
