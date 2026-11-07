import serverless from 'serverless-http';
import { createApp } from '../../server/src/app.js';
import { connectDB } from '../../server/src/db.js';

const app = serverless(createApp());

export const handler = async (event, context) => {
  // Keep the Mongo connection open between warm invocations.
  context.callbackWaitsForEmptyEventLoop = false;
  await connectDB();
  return app(event, context);
};
