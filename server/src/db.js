import mongoose from 'mongoose';

let connection = null;

/**
 * Connect once and reuse the connection. In serverless functions the module
 * stays warm between invocations, so this avoids reconnecting per request.
 */
export function connectDB(uri = process.env.MONGODB_URI) {
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (!connection) {
    mongoose.set('strictQuery', true);
    connection = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 8000 })
      .catch((err) => {
        connection = null;
        throw err;
      });
  }
  return connection;
}

export async function disconnectDB() {
  connection = null;
  await mongoose.disconnect();
}
