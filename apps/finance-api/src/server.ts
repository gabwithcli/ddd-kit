import { serve } from "@hono/node-server";
import app from "./app";
import { env } from "./config";

serve({ fetch: app.fetch, port: env.PORT });
console.log(`Hono listening on :${env.PORT}`);
