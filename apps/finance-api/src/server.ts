// ## File: apps/finance-api/src/server.ts

import { serve } from "@hono/node-server";
import app from "./app";

// Serve the app
const port = 3000;
console.log(`Server is running on port ${port}`);
console.log(`Scalar Docs available at http://localhost:${port}/docs`);
console.log(`Swagger UI available at http://localhost:${port}/swagger`);

serve({
  fetch: app.fetch,
  port,
});
