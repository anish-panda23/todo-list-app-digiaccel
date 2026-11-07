import 'dotenv/config';
import { createApp } from './app.js';
import { connectDB } from './db.js';

const port = Number(process.env.PORT) || 5000;
let uri = process.env.MONGODB_URI;

if (!uri) {
  // Zero-setup local development: spin up a throwaway MongoDB in memory.
  // Zero-setup local development: spin up a throwaway MongoDB in memory.
  const { MongoMemoryServer } = await import('mongodb-memory-server-core');
  const mongo = await MongoMemoryServer.create();
  uri = mongo.getUri();
  console.warn('MONGODB_URI not set, using an in-memory MongoDB (data is lost on restart).');
}

await connectDB(uri);
createApp().listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
